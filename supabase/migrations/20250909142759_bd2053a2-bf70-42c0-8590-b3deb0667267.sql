-- Add unique constraint for one inscription per user per period
ALTER TABLE public.inscriptions 
ADD CONSTRAINT unique_user_inscription_per_period 
UNIQUE (user_id, inscription_period_id);

-- Create inscription deletion requests table
CREATE TABLE public.inscription_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  inscription_id UUID NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on deletion requests
ALTER TABLE public.inscription_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deletion requests
CREATE POLICY "Users can create their own deletion requests" 
ON public.inscription_deletion_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own deletion requests" 
ON public.inscription_deletion_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all deletion requests" 
ON public.inscription_deletion_requests 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_inscription_deletion_requests_updated_at
BEFORE UPDATE ON public.inscription_deletion_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update current period name to "INSCRIPCIÓN DE PRUEBA SEPTIEMBRE 25"
UPDATE public.inscription_periods 
SET name = 'INSCRIPCIÓN DE PRUEBA SEPTIEMBRE 25'
WHERE is_active = true;