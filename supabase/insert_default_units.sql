-- =============================================
-- INSERT DEFAULT UNITS & SETUP TRIGGER
-- =============================================
-- This script:
-- 1. Inserts default units for existing admin user
-- 2. Sets up the trigger for FUTURE users

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Get the user ID for admin@admin.com
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@admin.com';

    -- 2. If user exists, insert units with default values
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.units (user_id, name, abbreviation, default_value)
        SELECT 
            target_user_id,
            name, 
            abbreviation,
            default_val
        FROM (VALUES 
            ('Unidade', 'un', 1.0),
            ('Mililitro', 'ml', 5.0),
            ('Litro', 'l', 1.0),
            ('Grama', 'g', 1.0),
            ('Quilograma', 'kg', 1.0),
            ('Par', 'par', 1.0),
            ('Caixa', 'cx', 1.0),
            ('Pacote', 'pct', 1.0)
        ) AS default_units(name, abbreviation, default_val)
        WHERE NOT EXISTS (
            SELECT 1 FROM public.units 
            WHERE user_id = target_user_id AND abbreviation = default_units.abbreviation
        );
        
        RAISE NOTICE 'Default units inserted for user %', target_user_id;
    END IF;

    -- 3. Setup trigger for FUTURE users (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_units'
    ) THEN
        -- Note: This might require superuser permissions in some environments
        -- In Supabase, you can run this in the SQL Editor
        EXECUTE 'CREATE TRIGGER on_auth_user_created_units
                 AFTER INSERT ON auth.users
                 FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_units()';
        RAISE NOTICE 'Trigger on_auth_user_created_units created successfully.';
    END IF;

END $$;

