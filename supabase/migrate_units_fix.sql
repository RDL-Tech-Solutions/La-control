-- =============================================
-- MIGRATION: ADD DEFAULT_VALUE TO UNITS
-- =============================================
-- Execute this script in your Supabase SQL Editor to fix the missing column
-- and setup the automatic unit population.

-- 1. Add the column to existing table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'units' 
        AND column_name = 'default_value'
    ) THEN
        ALTER TABLE public.units ADD COLUMN default_value DECIMAL(10,2) DEFAULT 1 NOT NULL;
    END IF;
END $$;

-- 2. Create or Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_units()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.units (user_id, name, abbreviation, default_value)
    VALUES 
        (NEW.id, 'Unidade', 'un', 1),
        (NEW.id, 'Mililitro', 'ml', 1),
        (NEW.id, 'Litro', 'l', 1),
        (NEW.id, 'Grama', 'g', 1),
        (NEW.id, 'Quilograma', 'kg', 1),
        (NEW.id, 'Par', 'par', 1),
        (NEW.id, 'Caixa', 'cx', 1),
        (NEW.id, 'Pacote', 'pct', 1)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Populate existing users (specifically admin)
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID for admin@admin.com
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@admin.com';

    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.units (user_id, name, abbreviation, default_value)
        VALUES 
            (target_user_id, 'Unidade', 'un', 1.0),
            (target_user_id, 'Mililitro', 'ml', 1.0),
            (target_user_id, 'Litro', 'l', 1.0),
            (target_user_id, 'Grama', 'g', 1.0),
            (target_user_id, 'Quilograma', 'kg', 1.0),
            (target_user_id, 'Par', 'par', 1.0),
            (target_user_id, 'Caixa', 'cx', 1.0),
            (target_user_id, 'Pacote', 'pct', 1.0)
        ON CONFLICT (id) DO NOTHING; -- This is to avoid errors if they somehow exist
        
        -- Update existing ones to 1.0
        UPDATE public.units SET default_value = 1.0 WHERE user_id = target_user_id AND abbreviation = 'ml';
    END IF;

    -- 4. Setup trigger for FUTURE users
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_units'
    ) THEN
        EXECUTE 'CREATE TRIGGER on_auth_user_created_units
                 AFTER INSERT ON auth.users
                 FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_units()';
    END IF;
END $$;
