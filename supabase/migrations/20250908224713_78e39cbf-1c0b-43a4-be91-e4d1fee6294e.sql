-- Create evaluations table for inscription scoring
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscription_id UUID NOT NULL,
  evaluator_id UUID NOT NULL,
  
  -- Evaluation criteria scores (matching the image columns)
  titulo_score DECIMAL(3,1) DEFAULT 0,
  antiguedad_titulo_score DECIMAL(3,1) DEFAULT 0 CHECK (antiguedad_titulo_score >= 0 AND antiguedad_titulo_score <= 3),
  antiguedad_docente_score DECIMAL(3,1) DEFAULT 0 CHECK (antiguedad_docente_score >= 0 AND antiguedad_docente_score <= 6),
  concepto_score DECIMAL(3,1) DEFAULT 0,
  promedio_titulo_score DECIMAL(3,1) DEFAULT 0,
  trabajo_publico_score DECIMAL(3,1) DEFAULT 0 CHECK (trabajo_publico_score >= 0 AND trabajo_publico_score <= 3),
  becas_otros_score DECIMAL(3,1) DEFAULT 0 CHECK (becas_otros_score >= 0 AND becas_otros_score <= 3),
  concurso_score DECIMAL(3,1) DEFAULT 0 CHECK (concurso_score >= 0 AND concurso_score <= 2),
  otros_antecedentes_score DECIMAL(3,1) DEFAULT 0 CHECK (otros_antecedentes_score >= 0 AND otros_antecedentes_score <= 3),
  red_federal_score DECIMAL(3,1) DEFAULT 0 CHECK (red_federal_score >= 0 AND red_federal_score <= 3),
  
  -- Calculated total score
  total_score DECIMAL(4,1) GENERATED ALWAYS AS (
    titulo_score + antiguedad_titulo_score + antiguedad_docente_score + 
    concepto_score + promedio_titulo_score + trabajo_publico_score + 
    becas_otros_score + concurso_score + otros_antecedentes_score + red_federal_score
  ) STORED,
  
  -- Evaluation metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(inscription_id, evaluator_id)
);

-- Enable Row Level Security
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Evaluators can view evaluations" 
ON public.evaluations 
FOR SELECT 
USING (has_role(auth.uid(), 'evaluator'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Evaluators can create evaluations" 
ON public.evaluations 
FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'evaluator'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) 
  AND auth.uid() = evaluator_id
);

CREATE POLICY "Evaluators can update their own evaluations" 
ON public.evaluations 
FOR UPDATE 
USING (
  (has_role(auth.uid(), 'evaluator'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) 
  AND auth.uid() = evaluator_id
);

CREATE POLICY "Super admins can manage all evaluations" 
ON public.evaluations 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_evaluations_updated_at
BEFORE UPDATE ON public.evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_evaluations_inscription_id ON public.evaluations(inscription_id);
CREATE INDEX idx_evaluations_evaluator_id ON public.evaluations(evaluator_id);