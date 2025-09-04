-- Create enum for inscription statuses
CREATE TYPE public.inscription_status AS ENUM (
  'draft',
  'submitted', 
  'under_review',
  'approved',
  'rejected',
  'requires_changes'
);

-- Create enum for document types
CREATE TYPE public.document_type AS ENUM (
  'cv',
  'certificates',
  'diplomas',
  'recommendations',
  'other'
);

-- Create inscriptions table
CREATE TABLE public.inscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status inscription_status NOT NULL DEFAULT 'draft',
  subject_area TEXT NOT NULL,
  teaching_level TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  availability TEXT,
  motivational_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inscription_documents table
CREATE TABLE public.inscription_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscription_id UUID NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inscription_history table
CREATE TABLE public.inscription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscription_id UUID NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  previous_status inscription_status,
  new_status inscription_status NOT NULL,
  changed_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscription_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscription_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inscriptions
CREATE POLICY "Users can view their own inscriptions" 
ON public.inscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inscriptions" 
ON public.inscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inscriptions" 
ON public.inscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Evaluators can view all inscriptions" 
ON public.inscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'evaluator'::app_role));

CREATE POLICY "Evaluators can update inscription status" 
ON public.inscriptions 
FOR UPDATE 
USING (has_role(auth.uid(), 'evaluator'::app_role));

CREATE POLICY "Super admins can manage all inscriptions" 
ON public.inscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for inscription_documents
CREATE POLICY "Users can view their own inscription documents" 
ON public.inscription_documents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.inscriptions 
  WHERE inscriptions.id = inscription_documents.inscription_id 
  AND inscriptions.user_id = auth.uid()
));

CREATE POLICY "Users can manage their own inscription documents" 
ON public.inscription_documents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.inscriptions 
  WHERE inscriptions.id = inscription_documents.inscription_id 
  AND inscriptions.user_id = auth.uid()
));

CREATE POLICY "Evaluators can view all inscription documents" 
ON public.inscription_documents 
FOR SELECT 
USING (has_role(auth.uid(), 'evaluator'::app_role));

CREATE POLICY "Super admins can manage all inscription documents" 
ON public.inscription_documents 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for inscription_history
CREATE POLICY "Users can view their inscription history" 
ON public.inscription_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.inscriptions 
  WHERE inscriptions.id = inscription_history.inscription_id 
  AND inscriptions.user_id = auth.uid()
));

CREATE POLICY "Evaluators can view all inscription history" 
ON public.inscription_history 
FOR SELECT 
USING (has_role(auth.uid(), 'evaluator'::app_role));

CREATE POLICY "Evaluators can create inscription history" 
ON public.inscription_history 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'evaluator'::app_role));

CREATE POLICY "Super admins can manage all inscription history" 
ON public.inscription_history 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updating updated_at on inscriptions
CREATE TRIGGER update_inscriptions_updated_at
BEFORE UPDATE ON public.inscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create history entries
CREATE OR REPLACE FUNCTION public.handle_inscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.inscription_history (
      inscription_id,
      previous_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for status changes
CREATE TRIGGER inscription_status_change_trigger
AFTER UPDATE ON public.inscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_inscription_status_change();