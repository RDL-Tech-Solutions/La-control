-- =============================================
-- ALTERNATIVE FIX - Remove trigger approach
-- =============================================
-- If the trigger is causing issues, we can take a different approach:
-- Create units only when needed (on first login) instead of on signup

-- Step 1: Drop problematic trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_units ON auth.users;

-- Step 2: Verify units trigger is removed
DROP TRIGGER IF EXISTS set_units_user_id ON public.units;

-- Step 3: Recreate units table WITHOUT the user_id trigger
-- This allows manual insertion during signup
ALTER TABLE IF EXISTS public.units DISABLE TRIGGER set_units_user_id;

-- Alternative: Let's try a simpler approach - make user_id nullable temporarily
-- This way signup can succeed even if units creation fails
-- Then we can create units on first login

-- =============================================
-- SIMPLE FIX - Disable Email Confirmation
-- =============================================
-- Sometimes the issue is with email confirmation settings
-- Go to Authentication > Settings > Email Auth
-- Make sure "Enable email confirmations" is DISABLED for testing

-- =============================================
-- NUCLEAR OPTION - Recreate everything from scratch
-- =============================================
-- WARNING: This will DELETE ALL DATA
-- Only use this if you have a fresh database with no important data

/*
-- Drop all tables
DROP TABLE IF EXISTS public.financial_records CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.service_products CASCADE;
DROP TABLE IF EXISTS public.service_types CASCADE;
DROP TABLE IF EXISTS public.stock_entries CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.set_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_units() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;

-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created_units ON auth.users;

-- Now run the schema_corrected.sql file to recreate everything
*/
