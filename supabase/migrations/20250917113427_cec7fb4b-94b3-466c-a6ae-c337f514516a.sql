-- Fix RLS policies for inscription_documents table to allow proper document uploads

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can manage their own inscription documents" ON public.inscription_documents;
DROP POLICY IF EXISTS "Users can view their own inscription documents" ON public.inscription_documents;

-- Create proper RLS policies with WITH CHECK clauses
CREATE POLICY "Users can view their own inscription documents" 
ON public.inscription_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM inscriptions 
    WHERE inscriptions.id = inscription_documents.inscription_id 
    AND inscriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own inscription documents" 
ON public.inscription_documents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM inscriptions 
    WHERE inscriptions.id = inscription_documents.inscription_id 
    AND inscriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own inscription documents" 
ON public.inscription_documents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM inscriptions 
    WHERE inscriptions.id = inscription_documents.inscription_id 
    AND inscriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own inscription documents" 
ON public.inscription_documents 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM inscriptions 
    WHERE inscriptions.id = inscription_documents.inscription_id 
    AND inscriptions.user_id = auth.uid()
  )
);

-- Super admin policies (these should already exist but ensuring they're correct)
CREATE POLICY "Super admins can insert any inscription documents" 
ON public.inscription_documents 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update any inscription documents" 
ON public.inscription_documents 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete any inscription documents" 
ON public.inscription_documents 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));