-- Migration: Update category_option_groups to use category instead of dish_id
-- This migration changes the option groups to be linked to categories instead of individual dishes

-- Step 1: Add the new 'category' column
ALTER TABLE public.category_option_groups 
ADD COLUMN IF NOT EXISTS category text;

-- Step 2: Migrate existing data (populate category from dish's category)
UPDATE public.category_option_groups 
SET category = dishes.category
FROM public.dishes
WHERE category_option_groups.dish_id = dishes.id
AND category_option_groups.category IS NULL;

-- Step 3: Make category NOT NULL after data migration
ALTER TABLE public.category_option_groups 
ALTER COLUMN category SET NOT NULL;

-- Step 4: Drop the old foreign key constraint
ALTER TABLE public.category_option_groups 
DROP CONSTRAINT IF EXISTS dish_option_groups_dish_id_fkey;

-- Step 5: Drop the dish_id column (since we're now using category)
ALTER TABLE public.category_option_groups 
DROP COLUMN IF EXISTS dish_id;

-- Step 6: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_category_option_groups_category 
ON public.category_option_groups(category);

-- Step 7: Add comment to document the change
COMMENT ON COLUMN public.category_option_groups.category IS 'Category name that links to the categories table. Options are now shared across all dishes in a category.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: category_option_groups now uses category instead of dish_id';
END $$;
