import { supabase } from "@/integrations/supabase/client";

export async function ensureCategoriesTableExists() {
  try {
    // Check if categories table exists by trying to select from it
    const { error: checkError } = await supabase
      .from("categories")
      .select("id")
      .limit(1);

    // If no error or error is not "relation does not exist", table exists
    if (!checkError || !checkError.message.includes("does not exist")) {
      console.log("Categories table already exists");
      return true;
    }

    console.log("Categories table does not exist, creating it...");

    // Execute the migration SQL
    const migrationSQL = `
      -- Create categories table
      CREATE TABLE IF NOT EXISTS public.categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        emoji text,
        display_order integer DEFAULT 0,
        created_at timestamp with time zone DEFAULT now(),
        UNIQUE(name, emoji)
      );

      -- Enable Row Level Security (RLS)
      ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

      -- Create policies for public read access
      CREATE POLICY "Anyone can view categories"
        ON public.categories
        FOR SELECT
        USING (true);

      -- Create policies for admin write access
      CREATE POLICY "Admins can manage categories"
        ON public.categories
        FOR ALL
        USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

      -- Create index for better query performance
      CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);
    `;

    // Note: Direct SQL execution requires elevated privileges
    // This is typically done via Supabase Dashboard or CLI
    console.warn(
      "Please execute the migration SQL manually in Supabase Dashboard:\n",
      "Go to: Supabase Dashboard > SQL Editor > Run the migration"
    );

    return false;
  } catch (error) {
    console.error("Error checking categories table:", error);
    return false;
  }
}
