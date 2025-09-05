-- Asignar rol de super_admin al usuario actual
INSERT INTO user_roles (user_id, role) 
VALUES ('702a5ace-8f46-4600-95db-3a58144049ec', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;