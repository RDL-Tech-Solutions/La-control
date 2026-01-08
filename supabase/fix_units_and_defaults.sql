-- =============================================
-- BULLETPROOF FIX: UNITS TABLE & DEFAULT VALUES
-- =============================================

-- 1. Ensure the default_value column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'units' AND column_name = 'default_value'
    ) THEN
        ALTER TABLE public.units ADD COLUMN default_value DECIMAL(10,2) DEFAULT 1.0 NOT NULL;
    END IF;
END $$;

-- 2. Disable the specific user trigger (avoiding system triggers)
-- This avoids 'permission denied' on system triggers
ALTER TABLE public.units DISABLE TRIGGER set_units_user_id;

-- 3. Add Unique Constraint to prevent duplicates
DO $$
BEGIN
    -- Clean up any existing duplicates
    DELETE FROM public.units a USING public.units b
    WHERE a.id < b.id 
    AND a.user_id = b.user_id 
    AND a.abbreviation = b.abbreviation;
    
    -- Add the constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'units_user_id_abbreviation_key'
    ) THEN
        ALTER TABLE public.units ADD CONSTRAINT units_user_id_abbreviation_key UNIQUE (user_id, abbreviation);
    END IF;
END $$;

-- 4. Update the trigger function for FUTURE users
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
    ON CONFLICT (user_id, abbreviation) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Populate default units for ALL existing users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM auth.users LOOP
        INSERT INTO public.units (user_id, name, abbreviation, default_value)
        VALUES 
            (r.id, 'Unidade', 'un', 1.0),
            (r.id, 'Mililitro', 'ml', 1.0),
            (r.id, 'Litro', 'l', 1.0),
            (r.id, 'Grama', 'g', 1.0),
            (r.id, 'Quilograma', 'kg', 1.0),
            (r.id, 'Par', 'par', 1.0),
            (r.id, 'Caixa', 'cx', 1.0),
            (r.id, 'Pacote', 'pct', 1.0)
        ON CONFLICT (user_id, abbreviation) DO NOTHING;
    END LOOP;
END $$;

-- 6. Re-enable the specific trigger
ALTER TABLE public.units ENABLE TRIGGER set_units_user_id;

-- 7. Ensure all 'ml' are corrected to 1.0
UPDATE public.units SET default_value = 1.0 WHERE abbreviation = 'ml';
