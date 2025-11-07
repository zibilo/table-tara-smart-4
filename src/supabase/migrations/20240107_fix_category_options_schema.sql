-- Safe Migration: Fix category_option_groups and category_options schema
-- This migration safely adds missing columns and handles the transition from dish_id to category

-- ============================================
-- PART 1: Fix category_option_groups table
-- ============================================

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'category_option_groups' 
                   AND column_name = 'category') THEN
        ALTER TABLE public.category_option_groups ADD COLUMN category text;
        RAISE NOTICE 'Added category column';
    END IF;

    -- Add selection_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'category_option_groups' 
                   AND column_name = 'selection_type') THEN
        ALTER TABLE public.category_option_groups ADD COLUMN selection_type text;
        RAISE NOTICE 'Added selection_type column';
    END IF;

    -- Add enable_description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'category_option_groups' 
                   AND column_name = 'enable_description') THEN
        ALTER TABLE public.category_option_groups ADD COLUMN enable_description boolean DEFAULT false;
        RAISE NOTICE 'Added enable_description column';
    END IF;
END $$;

-- Migrate existing data if needed
DO $$
BEGIN
    -- If dish_id still exists, migrate the data
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'category_option_groups' 
               AND column_name = 'dish_id') THEN
        
        -- Populate category from dish's category
        UPDATE public.category_option_groups 
        SET category = dishes.category
        FROM public.dishes
        WHERE category_option_groups.dish_id = dishes.id
        AND category_option_groups.category IS NULL;
        
        RAISE NOTICE 'Migrated dish_id to category';
    END IF;

    -- If allow_multiple still exists, convert to selection_type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'category_option_groups' 
               AND column_name = 'allow_multiple') THEN
        
        UPDATE public.category_option_groups 
        SET selection_type = CASE 
            WHEN allow_multiple = true THEN 'multiple'
            ELSE 'single'
        END
        WHERE selection_type IS NULL;
        
        RAISE NOTICE 'Converted allow_multiple to selection_type';
    END IF;
END $$;

-- Make new columns NOT NULL after data migration
DO $$
BEGIN
    -- Make category NOT NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'category_option_groups' 
               AND column_name = 'category'
               AND is_nullable = 'YES') THEN
        ALTER TABLE public.category_option_groups ALTER COLUMN category SET NOT NULL;
        RAISE NOTICE 'Set category to NOT NULL';
    END IF;

    -- Make selection_type NOT NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'category_option_groups' 
               AND column_name = 'selection_type'
               AND is_nullable = 'YES') THEN
        ALTER TABLE public.category_option_groups ALTER COLUMN selection_type SET NOT NULL;
        RAISE NOTICE 'Set selection_type to NOT NULL';
    END IF;
END $$;

-- Add CHECK constraint for selection_type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'category_option_groups_selection_type_check') THEN
        ALTER TABLE public.category_option_groups 
        ADD CONSTRAINT category_option_groups_selection_type_check 
        CHECK (selection_type IN ('single', 'multiple'));
        RAISE NOTICE 'Added selection_type CHECK constraint';
    END IF;
END $$;

-- Drop old columns if they still exist
DO $$
BEGIN
    -- Drop dish_id foreign key constraint
    IF EXISTS (SELECT 1 FROM pg_constraint 
               WHERE conname = 'dish_option_groups_dish_id_fkey') THEN
        ALTER TABLE public.category_option_groups 
        DROP CONSTRAINT dish_option_groups_dish_id_fkey;
        RAISE NOTICE 'Dropped dish_id foreign key';
    END IF;

    -- Drop dish_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'category_option_groups' 
               AND column_name = 'dish_id') THEN
        ALTER TABLE public.category_option_groups DROP COLUMN dish_id;
        RAISE NOTICE 'Dropped dish_id column';
    END IF;

    -- Drop allow_multiple column
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'category_option_groups' 
               AND column_name = 'allow_multiple') THEN
        ALTER TABLE public.category_option_groups DROP COLUMN allow_multiple;
        RAISE NOTICE 'Dropped allow_multiple column';
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_category_option_groups_category 
ON public.category_option_groups(category);

-- ============================================
-- PART 2: Fix category_options table
-- ============================================

-- Rename price_modifier to extra_price if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'category_options' 
               AND column_name = 'price_modifier') THEN
        ALTER TABLE public.category_options 
        RENAME COLUMN price_modifier TO extra_price;
        RAISE NOTICE 'Renamed price_modifier to extra_price';
    END IF;
END $$;

-- ============================================
-- PART 3: Add helpful comments
-- ============================================

COMMENT ON TABLE public.category_option_groups IS 'Groups of customization options organized by categories. Options are shared across all dishes in a category.';
COMMENT ON COLUMN public.category_option_groups.category IS 'Category name that matches a name from the categories table';
COMMENT ON COLUMN public.category_option_groups.selection_type IS 'Either "single" (radio buttons) or "multiple" (checkboxes)';
COMMENT ON COLUMN public.category_option_groups.enable_description IS 'Allows customers to add special notes/comments for this option group';
COMMENT ON COLUMN public.category_options.extra_price IS 'Additional price in currency for selecting this option';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully! The schema is now up to date.';
END $$;
