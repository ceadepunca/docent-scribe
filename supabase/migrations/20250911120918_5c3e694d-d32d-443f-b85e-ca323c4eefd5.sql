-- Allow evaluators to view all inscription periods (active and inactive)
CREATE POLICY "Evaluators can view all periods" 
ON public.inscription_periods 
FOR SELECT 
USING (has_role(auth.uid(), 'evaluator'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));