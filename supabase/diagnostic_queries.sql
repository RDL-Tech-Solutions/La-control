-- =============================================
-- DIAGNOSTIC QUERIES - Check Database State
-- =============================================
-- Run these queries in Supabase SQL Editor to diagnose the issue

-- 1. Check if functions exist
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('set_user_id', 'handle_new_user_units', 'update_updated_at')
ORDER BY routine_name;
-- Expected: 3 rows

-- 2. Check if auth trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
ORDER BY trigger_name;
-- Look for: on_auth_user_created_units

-- 3. Check all triggers on units table (should not have user_id trigger)
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'units'
AND event_object_schema = 'public';

-- 4. Check if units table exists and structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'units'
ORDER BY ordinal_position;

-- 5. Check RLS policies on units table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'units';

-- 6. Check if there are any errors in recent auth attempts
-- (This requires access to Supabase logs - check Dashboard > Logs)

-- 7. Try to manually insert a unit to test permissions
-- IMPORTANT: Replace 'YOUR_USER_ID' with an actual user ID from auth.users
-- SELECT id FROM auth.users LIMIT 1; -- Run this first to get a user ID
-- Then uncomment and run:
/*
INSERT INTO public.units (user_id, name, abbreviation, default_value)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Test Unit',
    'test',
    1
);
*/

-- 8. Check auth.users table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth'
AND table_name = 'users'
ORDER BY ordinal_position;
