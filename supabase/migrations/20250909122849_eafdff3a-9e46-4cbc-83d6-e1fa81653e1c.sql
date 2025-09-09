-- Create 10 test teachers
-- The handle_new_user() trigger will automatically create profiles and assign 'docente' roles

-- Insert test users directly into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'docente1@test.com', '$2a$10$K8gUcmRLzNe4VtPDUVhVqOrK4IqmDjhWx.R9XZbtKW.YqF8Rt6dkW', NOW(), NULL, '', NOW(), '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"first_name": "María", "last_name": "García"}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'docente2@test.com', '$2a$10$K8gUcmRLzNe4VtPDUVhVqOrK4IqmDjhWx.R9XZbtKW.YqF8Rt6dkW', NOW(), NULL, '', NOW(), '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"first_name": "Carlos", "last_name": "Rodríguez"}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'docente3@test.com', '$2a$10$K8gUcmRLzNe4VtPDUVhVqOrK4IqmDjhWx.R9XZbtKW.YqF8Rt6dkW', NOW(), NULL, '', NOW(), '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"first_name": "Ana", "last_name": "Martínez"}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'docente4@test.com', '$2a$10$K8gUcmRLzNe4VtPDUVhVqOrK4IqmDjhWx.R9XZbtKW.YqF8Rt6dkW', NOW(), NULL, '', NOW(), '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"first_name": "Luis", "last_name": "González"}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'docente5@test.com', '$2a$10$K8gUcmRLzNe4VtPDUVhVqOrK4IqmDjhWx.R9XZbtKW.YqF8Rt6dkW', NOW(), NULL, '', NOW(), '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"first_name": "Carmen", "last_name": "López"}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'docente6@test.com', '$2a$10$K8gUcmRLzNe4VtPDUVhVqOrK4IqmDjhWx.R9XZbtKW.YqF8Rt6dkW', NOW(), NULL, '', NOW(), '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"first_name": "Roberto", "last_name": "Fernández"}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'docente7@test.com', '$2a$10$K8gUcmRLzNe4VtPDUVhVqOrK4IqmDjhWx.R9XZbtKW.YqF8Rt6dkW', NOW(), NULL, '', NOW(), '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"first_name": "Patricia", "last_name": "Silva"}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'docente8@test.com', '$2a$10$K8gUcmRLzNe4VtPDUVhVqOrK4IqmDjhWx.R9XZbtKW.YqF8Rt6dkW', NOW(), NULL, '', NOW(), '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"first_name": "Diego", "last_name": "Morales"}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'docente9@test.com', '$2a$10$K8gUcmRLzNe4VtPDUVhVqOrK4IqmDjhWx.R9XZbtKW.YqF8Rt6dkW', NOW(), NULL, '', NOW(), '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"first_name": "Valeria", "last_name": "Castro"}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'docente10@test.com', '$2a$10$K8gUcmRLzNe4VtPDUVhVqOrK4IqmDjhWx.R9XZbtKW.YqF8Rt6dkW', NOW(), NULL, '', NOW(), '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"first_name": "Sebastián", "last_name": "Herrera"}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL);

-- Update the created profiles with additional test data
-- Wait a moment for the trigger to execute, then update profiles
DO $$
DECLARE
    user_record RECORD;
    dni_counter INTEGER := 30000000;
BEGIN
    -- Update each profile with realistic test data
    FOR user_record IN 
        SELECT u.id, u.raw_user_meta_data->>'first_name' as first_name, u.raw_user_meta_data->>'last_name' as last_name
        FROM auth.users u 
        WHERE u.email LIKE 'docente%@test.com'
    LOOP
        UPDATE public.profiles 
        SET 
            dni = dni_counter::text,
            phone = '11' || (40000000 + dni_counter - 30000000)::text,
            titulo_1_nombre = 'Profesorado en Educación Primaria',
            titulo_1_fecha_egreso = '2020-12-15'::date,
            titulo_1_promedio = 8.5 + (RANDOM() * 1.5)::numeric(3,2)
        WHERE id = user_record.id;
        
        dni_counter := dni_counter + 1;
    END LOOP;
END $$;