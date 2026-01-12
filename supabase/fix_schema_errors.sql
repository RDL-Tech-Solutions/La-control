-- =============================================
-- FIX SCHEMA ERRORS - LA CONTROL
-- =============================================
-- This migration fixes the missing functions and triggers
-- that are preventing new user signup
-- Execute this in your Supabase SQL Editor

-- =============================================
-- 1. CREATE MISSING set_user_id() FUNCTION
-- =============================================
-- This function automatically sets the user_id to the current authenticated user
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. FIX INCOMPLETE POLICIES
-- =============================================
-- Drop the incomplete policy if it exists
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

-- Recreate complete policies
CREATE POLICY "Users can update own products" ON public.products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. CREATE AUTH TRIGGER FOR NEW USERS
-- =============================================
-- This trigger automatically creates default units for new users
-- and will run whenever a new user signs up

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_units ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_units
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_units();

-- =============================================
-- 4. VERIFY FUNCTION EXISTS
-- =============================================
-- Recreate the handle_new_user_units function to ensure it's correct
CREATE OR REPLACE FUNCTION public.handle_new_user_units()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.units (user_id, name, abbreviation, default_value)
    VALUES 
        (NEW.id, 'Unidade', 'un', 1),
        (NEW.id, 'Mililitro', 'ml', 5),
        (NEW.id, 'Litro', 'l', 1),
        (NEW.id, 'Grama', 'g', 1),
        (NEW.id, 'Quilograma', 'kg', 1),
        (NEW.id, 'Par', 'par', 1),
        (NEW.id, 'Caixa', 'cx', 1),
        (NEW.id, 'Pacote', 'pct', 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. GRANT PROPER PERMISSIONS
-- =============================================
-- Ensure functions can be executed
GRANT EXECUTE ON FUNCTION public.set_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_units() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO anon, authenticated;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these to verify the fix was applied correctly

-- Check if functions exist
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('set_user_id', 'handle_new_user_units', 'update_updated_at');

-- Check if trigger exists
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created_units';

-- Check if policies exist
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE tablename = 'products';
