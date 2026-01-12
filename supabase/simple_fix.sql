-- =============================================
-- SIMPLE FIX - Remove Problematic Trigger
-- =============================================
-- This removes the auth trigger that's causing the signup failure
-- Users will still be created, but default units won't be auto-created
-- (You can add units manually or create them on first login later)

-- Remove the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created_units ON auth.users;

-- That's it! Try signup now.
-- The trigger will be removed and signup should work.

-- =============================================
-- Optional: Verify trigger is removed
-- =============================================
-- Run this to confirm the trigger is gone:
/*
SELECT trigger_name 
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_units';
*/
-- Expected result: 0 rows (trigger doesn't exist anymore)
