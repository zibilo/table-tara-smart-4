-- Fix category_option_groups table to support dynamic categories from categories table
-- Drop the old CHECK constraint that limited categories to hardcoded values
ALTER TABLE public.category_option_groups 
DROP CONSTRAINT IF EXISTS category_option_groups_category_check;

-- The category column should now accept any text value matching category names
-- from the categories table (no foreign key to allow flexibility)
ALTER TABLE public.category_option_groups 
ALTER COLUMN category TYPE text;

-- Optional: Add a comment to explain the relationship
COMMENT ON COLUMN public.category_option_groups.category IS 'Category name that should match a name from the categories table';

-- Clear existing sample data (optional, only if you want to start fresh)
-- TRUNCATE TABLE public.category_options CASCADE;
-- TRUNCATE TABLE public.category_option_groups CASCADE;

-- Note: The frontend will now be able to create option groups for any category
-- that exists in the categories table
