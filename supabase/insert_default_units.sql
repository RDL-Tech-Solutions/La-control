-- =============================================
-- INSERT DEFAULT UNITS
-- =============================================
-- This script inserts default units for the 'admin@admin.com' user.
-- If you want to insert for another user, change the email in the WHERE clause.

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Get the user ID for admin@admin.com
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@admin.com';

    -- 2. If user exists, insert units
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.units (user_id, name, abbreviation)
        SELECT 
            target_user_id,
            name, 
            abbreviation
        FROM (VALUES 
            ('Unidade', 'un'),
            ('Mililitro', 'ml'),
            ('Litro', 'l'),
            ('Grama', 'g'),
            ('Quilograma', 'kg'),
            ('Par', 'par'),
            ('Caixa', 'cx'),
            ('Pacote', 'pct')
        ) AS default_units(name, abbreviation)
        WHERE NOT EXISTS (
            SELECT 1 FROM public.units 
            WHERE user_id = target_user_id AND abbreviation = default_units.abbreviation
        );
        
        RAISE NOTICE 'Default units inserted for user %', target_user_id;
    ELSE
        RAISE NOTICE 'User admin@admin.com not found. Please create the user first.';
    END IF;
END $$;
