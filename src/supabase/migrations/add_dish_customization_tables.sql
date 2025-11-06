-- Create dish_option_groups table
CREATE TABLE IF NOT EXISTS public.dish_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id uuid NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  name text NOT NULL,
  selection_type text NOT NULL CHECK (selection_type IN ('single', 'multiple')),
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create dish_options table
CREATE TABLE IF NOT EXISTS public.dish_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id uuid NOT NULL REFERENCES public.dish_option_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  extra_price numeric(10,2) DEFAULT 0,
  is_available boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Add customizations column to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS customizations jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dish_option_groups_dish_id ON public.dish_option_groups(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_options_option_group_id ON public.dish_options(option_group_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.dish_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_options ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (customers can view options)
CREATE POLICY "Anyone can view dish option groups"
  ON public.dish_option_groups
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view dish options"
  ON public.dish_options
  FOR SELECT
  USING (true);

-- Insert sample data for testing (Hamburger Classique)
DO $$
DECLARE
  hamburger_dish_id uuid;
  group1_id uuid;
  group2_id uuid;
  group3_id uuid;
  group4_id uuid;
BEGIN
  -- Get or create a hamburger dish
  INSERT INTO public.dishes (name, description, price, category, restaurant_id, is_available)
  VALUES (
    'Hamburger Classique',
    'Un délicieux hamburger avec pain, viande, salade, tomate, oignon et sauce',
    5000,
    'plats',
    (SELECT id FROM public.restaurants LIMIT 1),
    true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO hamburger_dish_id;
  
  -- If no dish was returned (already exists), get the existing one
  IF hamburger_dish_id IS NULL THEN
    SELECT id INTO hamburger_dish_id 
    FROM public.dishes 
    WHERE name = 'Hamburger Classique' 
    LIMIT 1;
  END IF;

  -- Only proceed if we have a dish ID
  IF hamburger_dish_id IS NOT NULL THEN
    -- Create option groups
    INSERT INTO public.dish_option_groups (dish_id, name, selection_type, is_required, display_order)
    VALUES 
      (hamburger_dish_id, 'Cuisson de la Viande', 'single', true, 0)
    RETURNING id INTO group1_id;

    INSERT INTO public.dish_option_groups (dish_id, name, selection_type, is_required, display_order)
    VALUES 
      (hamburger_dish_id, 'Choisissez votre Sauce', 'single', false, 1)
    RETURNING id INTO group2_id;

    INSERT INTO public.dish_option_groups (dish_id, name, selection_type, is_required, display_order)
    VALUES 
      (hamburger_dish_id, 'Ajouter des Suppléments', 'multiple', false, 2)
    RETURNING id INTO group3_id;

    INSERT INTO public.dish_option_groups (dish_id, name, selection_type, is_required, display_order)
    VALUES 
      (hamburger_dish_id, 'Retirer des Ingrédients', 'multiple', false, 3)
    RETURNING id INTO group4_id;

    -- Create options for group 1 (Cuisson)
    INSERT INTO public.dish_options (option_group_id, name, extra_price, display_order)
    VALUES 
      (group1_id, 'Saignant', 0, 0),
      (group1_id, 'À point', 0, 1),
      (group1_id, 'Bien cuit', 0, 2);

    -- Create options for group 2 (Sauce)
    INSERT INTO public.dish_options (option_group_id, name, extra_price, display_order)
    VALUES 
      (group2_id, 'Mayonnaise', 0, 0),
      (group2_id, 'Ketchup', 0, 1),
      (group2_id, 'Moutarde', 0, 2),
      (group2_id, 'Sauce BBQ', 0, 3);

    -- Create options for group 3 (Suppléments)
    INSERT INTO public.dish_options (option_group_id, name, extra_price, display_order)
    VALUES 
      (group3_id, 'Bacon', 500, 0),
      (group3_id, 'Œuf', 300, 1),
      (group3_id, 'Fromage', 400, 2),
      (group3_id, 'Avocat', 350, 3);

    -- Create options for group 4 (Retirer)
    INSERT INTO public.dish_options (option_group_id, name, extra_price, display_order)
    VALUES 
      (group4_id, 'Oignon', 0, 0),
      (group4_id, 'Tomate', 0, 1),
      (group4_id, 'Cornichons', 0, 2),
      (group4_id, 'Salade', 0, 3);
  END IF;
END $$;

-- Add some comments for documentation
COMMENT ON TABLE public.dish_option_groups IS 'Groups of customization options for dishes (e.g., "Cooking Level", "Sauces")';
COMMENT ON TABLE public.dish_options IS 'Individual customization options within each group';
COMMENT ON COLUMN public.dish_option_groups.selection_type IS 'Either "single" (radio buttons) or "multiple" (checkboxes)';
COMMENT ON COLUMN public.dish_options.extra_price IS 'Additional price in XAF for selecting this option';
