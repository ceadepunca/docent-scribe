-- Step 1: Remove DNI from secondary account first
UPDATE profiles 
SET dni = NULL 
WHERE email = 'jrdiaz@institutosanmartin.edu.ar';

-- Step 2: Add DNI to the main super admin account
UPDATE profiles 
SET dni = '21325214' 
WHERE email = 'jorgediaz@hotmail.com';
