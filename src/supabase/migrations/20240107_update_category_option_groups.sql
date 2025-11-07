-- Migration: Update category_option_groups and category_options schema to match AdminCategoryOptions component
-- This changes from dish-based to category-based options

-- ============================================
-- PART 1: Fix category_option_groups table
-- ============================================

-- Step 1: Add new columns
ALTER TABLE public.category_option_groups 
ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE public.category_option_groups 
ADD COLUMN IF NOT EXISTS selection_type text;

ALTER TABLE public.category_option_groups 
ADD COLUMN IF NOT EXISTS enable_description boolean DEFAULT false;

-- Step 2: Migrate existing data
-- Populate category from dish's category
UPDATE public.category_option_groups 
SET category = dishes.category
FROM public.dishes
WHERE category_option_groups.dish_id = dishes.id
AND category_option_groups.category IS NULL;

-- Convert allow_multiple boolean to selection_type text
UPDATE public.category_option_groups 
SET selection_type = CASE 
  WHEN allow_multiple = true THEN 'multiple'
  ELSE 'single'
END
WHERE selection_type IS NULL;

-- Step 3: Make new columns NOT NULL after data migration
ALTER TABLE public.category_option_groups 
ALTER COLUMN category SET NOT NULL;

ALTER TABLE public.category_option_groups 
ALTER COLUMN selection_type SET NOT NULL;

-- Step 4: Add CHECK constraint for selection_type
ALTER TABLE public.category_option_groups 
ADD CONSTRAINT category_option_groups_selection_type_check 
CHECK (selection_type IN ('single', 'multiple'));

-- Step 5: Drop old columns
ALTER TABLE public.category_option_groups 
DROP CONSTRAINT IF EXISTS dish_option_groups_dish_id_fkey;

ALTER TABLE public.category_option_groups 
DROP COLUMN IF EXISTS dish_id;

ALTER TABLE public.category_option_groups 
DROP COLUMN IF EXISTS allow_multiple;

-- Step 6: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_category_option_groups_category 
ON public.category_option_groups(category);

-- ============================================
-- PART 2: Fix category_options table
-- ============================================

-- Rename price_modifier to extra_price to match the frontend code
ALTER TABLE public.category_options 
RENAME COLUMN price_modifier TO extra_price;

-- ============================================
-- PART 3: Add helpful comments
-- ============================================

COMMENT ON TABLE public.category_option_groups IS 'Groups of customization options organized by categories. Options are shared across all dishes in a category.';
COMMENT ON COLUMN public.category_option_groups.category IS 'Category name that matches a name from the categories table';
COMMENT ON COLUMN public.category_option_groups.selection_type IS 'Either "single" (radio buttons) or "multiple" (checkboxes)';
COMMENT ON COLUMN public.category_option_groups.enable_description IS 'Allows customers to add special notes/comments for this option group';
COMMENT ON COLUMN public.category_options.extra_price IS 'Additional price in currency for selecting this option';