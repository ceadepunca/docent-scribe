-- Make the profile-documents bucket public so documents can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-documents';