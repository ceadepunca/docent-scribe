-- Storage policies for inscription-documents bucket
-- Drop conflicting policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read inscription documents'
  ) THEN
    DROP POLICY "Public read inscription documents" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload inscription documents'
  ) THEN
    DROP POLICY "Users can upload inscription documents" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their inscription documents'
  ) THEN
    DROP POLICY "Users can update their inscription documents" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their inscription documents'
  ) THEN
    DROP POLICY "Users can delete their inscription documents" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Super admins manage inscription docs'
  ) THEN
    DROP POLICY "Super admins manage inscription docs" ON storage.objects;
  END IF;
END $$;

-- Public read for inscription-documents bucket
CREATE POLICY "Public read inscription documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'inscription-documents');

-- Users (inscription owners) can upload into folder: <inscription_id>/filename
CREATE POLICY "Users can upload inscription documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'inscription-documents'
  AND EXISTS (
    SELECT 1 FROM public.inscriptions i
    WHERE i.id::text = (storage.foldername(name))[1]
      AND i.user_id = auth.uid()
  )
);

-- Users can update their own objects
CREATE POLICY "Users can update their inscription documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'inscription-documents'
  AND EXISTS (
    SELECT 1 FROM public.inscriptions i
    WHERE i.id::text = (storage.foldername(name))[1]
      AND i.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'inscription-documents'
);

-- Users can delete their own objects
CREATE POLICY "Users can delete their inscription documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'inscription-documents'
  AND EXISTS (
    SELECT 1 FROM public.inscriptions i
    WHERE i.id::text = (storage.foldername(name))[1]
      AND i.user_id = auth.uid()
  )
);

-- Super admins can manage all objects in this bucket
CREATE POLICY "Super admins manage inscription docs"
ON storage.objects
FOR ALL
USING (bucket_id = 'inscription-documents' AND has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (bucket_id = 'inscription-documents' AND has_role(auth.uid(), 'super_admin'::app_role));