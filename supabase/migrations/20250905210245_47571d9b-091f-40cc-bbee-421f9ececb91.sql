-- Create storage bucket for profile documents
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-documents', 'profile-documents', false);

-- Add new document types to the enum
ALTER TYPE document_type ADD VALUE 'dni_frente';
ALTER TYPE document_type ADD VALUE 'dni_dorso';
ALTER TYPE document_type ADD VALUE 'titulo_pdf';

-- Create profile_documents table
CREATE TABLE public.profile_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_type)
);

-- Enable RLS on profile_documents
ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for profile_documents
CREATE POLICY "Users can view their own profile documents" 
ON public.profile_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own profile documents" 
ON public.profile_documents 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all profile documents" 
ON public.profile_documents 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage all profile documents" 
ON public.profile_documents 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Storage policies for profile-documents bucket
CREATE POLICY "Users can view their own profile documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own profile documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Super admins can manage all profile documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'profile-documents' AND has_role(auth.uid(), 'super_admin'::app_role));