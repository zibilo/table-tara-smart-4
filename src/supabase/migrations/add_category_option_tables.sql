-- Create category_option_groups table
CREATE TABLE IF NOT EXISTS public.category_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('hamburger', 'pizza', 'boisson', 'dessert')),
  name text NOT NULL,
  selection_type text NOT NULL CHECK (selection_type IN ('single', 'multiple')),
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  enable_description boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create category_options table
CREATE TABLE IF NOT EXISTS public.category_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id uuid NOT NULL REFERENCES public.category_option_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  extra_price numeric(10,2) DEFAULT 0,
  is_available boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_category_option_groups_category ON public.category_option_groups(category);
CREATE INDEX IF NOT EXISTS idx_category_options_option_group_id ON public.category_options(option_group_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.category_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_options ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (customers can view options)
CREATE POLICY "Anyone can view category option groups"
  ON public.category_option_groups
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view category options"
  ON public.category_options
  FOR SELECT
  USING (true);

-- Create policies for admin write access
CREATE POLICY "Admins can manage category option groups"
  ON public.category_option_groups
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can manage category options"
  ON public.category_options
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Insert sample data for Hamburger category
DO $$
DECLARE
  group1_id uuid;
  group2_id uuid;
  group3_id uuid;
BEGIN
  -- Create option groups for Hamburger
  INSERT INTO public.category_option_groups (category, name, selection_type, is_required, display_order, enable_description)
  VALUES 
    ('hamburger', 'Type de Sandwich', 'single', true, 0, false)
  RETURNING id INTO group1_id;

  INSERT INTO public.category_option_groups (category, name, selection_type, is_required, display_order, enable_description)
  VALUES 
    ('hamburger', 'Cuisson', 'single', true, 1, true)
  RETURNING id INTO group2_id;

  INSERT INTO public.category_option_groups (category, name, selection_type, is_required, display_order, enable_description)
  VALUES 
    ('hamburger', 'Garniture Supplémentaire', 'multiple', false, 2, false)
  RETURNING id INTO group3_id;

  -- Create options for group 1 (Type de Sandwich)
  INSERT INTO public.category_options (option_group_id, name, extra_price, display_order)
  VALUES 
    (group1_id, 'Royale', 0, 0),
    (group1_id, 'Végétarien', 0, 1),
    (group1_id, 'Double', 2.00, 2);

  -- Create options for group 2 (Cuisson)
  INSERT INTO public.category_options (option_group_id, name, extra_price, display_order)
  VALUES 
    (group2_id, 'Bien Cuit', 0, 0),
    (group2_id, 'À Point', 0, 1),
    (group2_id, 'Saignant', 0, 2);

  -- Create options for group 3 (Garniture Supplémentaire)
  INSERT INTO public.category_options (option_group_id, name, extra_price, display_order)
  VALUES 
    (group3_id, 'Tomate Fraîche', 0.50, 0),
    (group3_id, 'Oignons Frits', 1.00, 1),
    (group3_id, 'Bacon Croustillant', 1.50, 2);
END $$;

-- Insert sample data for Pizza category
DO $$
DECLARE
  group1_id uuid;
  group2_id uuid;
BEGIN
  -- Create option groups for Pizza
  INSERT INTO public.category_option_groups (category, name, selection_type, is_required, display_order, enable_description)
  VALUES 
    ('pizza', 'Format', 'single', true, 0, false)
  RETURNING id INTO group1_id;

  INSERT INTO public.category_option_groups (category, name, selection_type, is_required, display_order, enable_description)
  VALUES 
    ('pizza', 'Base', 'single', true, 1, false)
  RETURNING id INTO group2_id;

  -- Create options for group 1 (Format)
  INSERT INTO public.category_options (option_group_id, name, extra_price, display_order)
  VALUES 
    (group1_id, 'Junior', 0, 0),
    (group1_id, 'Standard', 2.00, 1),
    (group1_id, 'Familiale', 5.00, 2);

  -- Create options for group 2 (Base)
  INSERT INTO public.category_options (option_group_id, name, extra_price, display_order)
  VALUES 
    (group2_id, 'Tomate', 0, 0),
    (group2_id, 'Crème Fraîche', 0.50, 1);
END $$;

-- Insert sample data for Boisson category
DO $$
DECLARE
  group1_id uuid;
BEGIN
  -- Create option groups for Boisson
  INSERT INTO public.category_option_groups (category, name, selection_type, is_required, display_order, enable_description)
  VALUES 
    ('boisson', 'Type de Boisson', 'single', true, 0, false)
  RETURNING id INTO group1_id;

  -- Create options for group 1 (Type de Boisson)
  INSERT INTO public.category_options (option_group_id, name, extra_price, display_order)
  VALUES 
    (group1_id, 'Coca-Cola', 0, 0),
    (group1_id, 'Fanta', 0, 1),
    (group1_id, 'Eau Minérale', 0, 2),
    (group1_id, 'Jus d''Orange', 0.50, 3);
END $$;

-- Insert sample data for Dessert category
DO $$
DECLARE
  group1_id uuid;
  group2_id uuid;
BEGIN
  -- Create option groups for Dessert
  INSERT INTO public.category_option_groups (category, name, selection_type, is_required, display_order, enable_description)
  VALUES 
    ('dessert', 'Type de Gâteau', 'single', true, 0, false)
  RETURNING id INTO group1_id;

  INSERT INTO public.category_option_groups (category, name, selection_type, is_required, display_order, enable_description)
  VALUES 
    ('dessert', 'Accompagnement', 'multiple', false, 1, false)
  RETURNING id INTO group2_id;

  -- Create options for group 1 (Type de Gâteau)
  INSERT INTO public.category_options (option_group_id, name, extra_price, display_order)
  VALUES 
    (group1_id, 'Forêt Noire', 0, 0),
    (group1_id, 'Cheesecake', 0.50, 1),
    (group1_id, 'Tiramisu', 0.50, 2),
    (group1_id, 'Fraisier', 0, 3);

  -- Create options for group 2 (Accompagnement)
  INSERT INTO public.category_options (option_group_id, name, extra_price, display_order)
  VALUES 
    (group2_id, 'Brownie', 1.00, 0),
    (group2_id, 'Muffin', 0.80, 1),
    (group2_id, 'Salade de Fruits', 1.50, 2);
END $$;

-- Add some comments for documentation
COMMENT ON TABLE public.category_option_groups IS 'Groups of customization options organized by main categories (hamburger, pizza, boisson, dessert)';
COMMENT ON TABLE public.category_options IS 'Individual customization options within each category group';
COMMENT ON COLUMN public.category_option_groups.category IS 'Main category: hamburger, pizza, boisson, or dessert';
COMMENT ON COLUMN public.category_option_groups.selection_type IS 'Either "single" (radio buttons) or "multiple" (checkboxes)';
COMMENT ON COLUMN public.category_option_groups.enable_description IS 'Allow customers to add special notes/description for this field';
COMMENT ON COLUMN public.category_options.extra_price IS 'Additional price in € for selecting this option';
