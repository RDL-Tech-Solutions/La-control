-- =============================================
-- FINAL SIGNUP FIX - LA CONTROL
-- =============================================
-- This script fixes the "Database error saving new user" issue
-- by making the user_id assignment more robust.

-- 1. FIX THE set_user_id() FUNCTION
-- This is the most important part. It must not overwrite an already 
-- provided user_id and must handle cases where auth.uid() is null.
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set user_id if it's currently NULL and we have an authenticated user
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENSURE TRIGGER FUNCTIONS ARE ROBUST
-- We'll recreate the unit population function to use ON CONFLICT
CREATE OR REPLACE FUNCTION public.handle_new_user_units()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.units (user_id, name, abbreviation, default_value)
    VALUES 
        (NEW.id, 'Unidade', 'un', 1.0),
        (NEW.id, 'Mililitro', 'ml', 1.0),
        (NEW.id, 'Litro', 'l', 1.0),
        (NEW.id, 'Grama', 'g', 1.0),
        (NEW.id, 'Quilograma', 'kg', 1.0),
        (NEW.id, 'Par', 'par', 1.0),
        (NEW.id, 'Caixa', 'cx', 1.0),
        (NEW.id, 'Pacote', 'pct', 1.0)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENSURE CATEGORY POPULATION IS ROBUST (from migrate_categories.sql)
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

-- 4. ENSURE TRIGGERS ON auth.users ARE ACTIVE
DROP TRIGGER IF EXISTS on_auth_user_created_units ON auth.users;
CREATE TRIGGER on_auth_user_created_units
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_units();

DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_categories();

-- 5. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 6. UNIQUE CONSTRAINT (Required for ON CONFLICT DO NOTHING to work better)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'units_user_id_abbreviation_key') THEN
        ALTER TABLE public.units ADD CONSTRAINT units_user_id_abbreviation_key UNIQUE (user_id, abbreviation);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_user_id_name_key') THEN
        ALTER TABLE public.categories ADD CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name);
    END IF;
END $$;
