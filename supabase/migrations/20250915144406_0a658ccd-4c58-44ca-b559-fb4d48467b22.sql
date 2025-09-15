-- Create inscription-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inscription-documents', 'inscription-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for inscription-documents bucket
CREATE POLICY "Users can upload their own inscription documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'inscription-documents');

CREATE POLICY "Users can view their own inscription documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'inscription-documents');

CREATE POLICY "Users can delete their own inscription documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'inscription-documents');

CREATE POLICY "Super admins can manage all inscription documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'inscription-documents' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Evaluators can view all inscription documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'inscription-documents' AND has_role(auth.uid(), 'evaluator'::app_role));