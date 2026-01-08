-- =============================================
-- MIGRATION: PRODUCT CATEGORIES & CODES
-- =============================================

-- 1. Create CATEGORIES table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    prefix VARCHAR(10) NOT NULL, -- Ex: EQ, FR, LX
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(user_id, name),
    UNIQUE(user_id, prefix)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can view own categories') THEN
        CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can insert own categories') THEN
        CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can update own categories') THEN
        CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can delete own categories') THEN
        CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Triggers for categories
CREATE OR REPLACE TRIGGER set_categories_user_id
    BEFORE INSERT ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE OR REPLACE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- 2. Modify PRODUCTS table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);


-- 3. Function to Generate Product Code
CREATE OR REPLACE FUNCTION public.generate_product_code()
RETURNS TRIGGER AS $$
DECLARE
    cat_prefix VARCHAR;
    last_code VARCHAR;
    new_number INTEGER;
    new_code VARCHAR;
BEGIN
    -- If code is already manualy set, do nothing. 
    -- If category_id is null, do nothing.
    IF NEW.code IS NOT NULL OR NEW.category_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get prefix
    SELECT prefix INTO cat_prefix FROM public.categories WHERE id = NEW.category_id;
    
    IF cat_prefix IS NULL THEN
        RETURN NEW; 
    END IF;

    -- Find last code for this user and prefix
    -- We assume format is PREFIX + 3 digits (e.g. EQ001)
    -- We match using Regex to define valid codes
    SELECT code INTO last_code 
    FROM public.products 
    WHERE user_id = NEW.user_id 
    AND code ~ ('^' || cat_prefix || '[0-9]+$')
    ORDER BY LENGTH(code) DESC, code DESC
    LIMIT 1;

    IF last_code IS NULL THEN
        new_number := 1;
    ELSE
        -- Extract number part (remove prefix)
        new_number := CAST(SUBSTRING(last_code FROM LENGTH(cat_prefix) + 1) AS INTEGER) + 1;
    END IF;

    -- Format: Prefix + 3 digits padded (e.g. EQ001, EQ010, EQ100)
    new_code := cat_prefix || LPAD(new_number::TEXT, 3, '0');
    
    NEW.code := new_code;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for Product Code
DROP TRIGGER IF EXISTS trigger_generate_product_code ON public.products;
CREATE TRIGGER trigger_generate_product_code
    BEFORE INSERT ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.generate_product_code();


-- 5. Auto-populate Default Categories for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.categories (user_id, name, prefix)
    VALUES 
        (NEW.id, 'Equipamento', 'EQ'),
        (NEW.id, 'Ferramenta', 'FR'),
        (NEW.id, 'Lixa', 'LX'),
        (NEW.id, 'Higiene', 'HP'),
        (NEW.id, 'Tips', 'TP'),
        (NEW.id, 'Gel', 'GL'),
        (NEW.id, 'Esmalte', 'ES'),
        (NEW.id, 'Finalizado', 'FN'),
        (NEW.id, 'Preparador', 'PQ')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users for categories
-- (Assuming we can create multiple triggers on auth.users without issue)
DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_categories();


-- 6. Populate for EXISTING users
-- NOTE: disabling triggers to avoid permission issues during manual migration if run from editor
ALTER TABLE public.categories DISABLE TRIGGER set_categories_user_id;

INSERT INTO public.categories (user_id, name, prefix)
SELECT 
    au.id,
    defaults.name,
    defaults.prefix
FROM auth.users au
CROSS JOIN (VALUES 
    ('Equipamento', 'EQ'),
    ('Ferramenta', 'FR'),
    ('Lixa', 'LX'),
    ('Higiene', 'HP'),
    ('Tips', 'TP'),
    ('Gel', 'GL'),
    ('Esmalte', 'ES'),
    ('Finalizado', 'FN'),
    ('Preparador', 'PQ')
) AS defaults(name, prefix)
ON CONFLICT (user_id, name) DO NOTHING;

ALTER TABLE public.categories ENABLE TRIGGER set_categories_user_id;
