-- Fix test docente users passwords and email confirmation
-- Reset passwords to 'test123' and confirm emails for all test users

UPDATE auth.users 
SET 
  encrypted_password = crypt('test123', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now()
WHERE email LIKE 'docente%@test.com'
  OR email LIKE 'evaluador%@test.com'
  OR email LIKE 'admin%@test.com';