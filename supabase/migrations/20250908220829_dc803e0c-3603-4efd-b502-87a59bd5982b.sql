-- Allow evaluators and super_admins to view profiles of users who have inscriptions
CREATE POLICY "Evaluators can view profiles of inscribed users" ON public.profiles
FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(), 'evaluator'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) AND
  EXISTS (
    SELECT 1 FROM public.inscriptions 
    WHERE inscriptions.user_id = profiles.id
  )
);