import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Save, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EvaluationData {
  titulo_score: number;
  antiguedad_titulo_score: number;
  antiguedad_docente_score: number;
  concepto_score: number;
  promedio_titulo_score: number;
  trabajo_publico_score: number;
  becas_otros_score: number;
  concurso_score: number;
  otros_antecedentes_score: number;
  red_federal_score: number;
  notes?: string;
  status: 'draft' | 'completed';
}

interface EvaluationCriterion {
  id: keyof EvaluationData;
  label: string;
  maxValue?: number;
  column: string;
}

interface EvaluationGridProps {
  inscriptionId: string;
  teachingLevel: string;
}

const evaluationCriteria: EvaluationCriterion[] = [
  { id: 'titulo_score', label: 'TÍTULO', column: 'A' },
  { id: 'antiguedad_titulo_score', label: 'ANTIGÜEDAD TÍTULO', maxValue: 3, column: 'B' },
  { id: 'antiguedad_docente_score', label: 'ANTIGÜEDAD DOCEN.', maxValue: 6, column: 'C' },
  { id: 'concepto_score', label: 'CONCEPTO', column: 'D' },
  { id: 'promedio_titulo_score', label: 'PROM.GRAL.TÍTULO DOCEN.', column: 'E' },
  { id: 'trabajo_publico_score', label: 'TRAB.PUBLIC.', maxValue: 3, column: 'F' },
  { id: 'becas_otros_score', label: 'BECAS Y OTROS EST.', maxValue: 3, column: 'G' },
  { id: 'concurso_score', label: 'CONCURSO', maxValue: 2, column: 'H' },
  { id: 'otros_antecedentes_score', label: 'OTROS ANTEC. DOC.', maxValue: 3, column: 'I' },
  { id: 'red_federal_score', label: 'RED FEDERAL', maxValue: 3, column: 'J' },
];

export const EvaluationGrid: React.FC<EvaluationGridProps> = ({ inscriptionId, teachingLevel }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<EvaluationData>({
    titulo_score: 0,
    antiguedad_titulo_score: 0,
    antiguedad_docente_score: 0,
    concepto_score: 0,
    promedio_titulo_score: 0,
    trabajo_publico_score: 0,
    becas_otros_score: 0,
    concurso_score: 0,
    otros_antecedentes_score: 0,
    red_federal_score: 0,
    notes: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const calculateTotal = (): number => {
    return Object.keys(evaluation)
      .filter(key => key.endsWith('_score'))
      .reduce((total, key) => total + (evaluation[key as keyof EvaluationData] as number), 0);
  };

  useEffect(() => {
    fetchExistingEvaluation();
  }, [inscriptionId, user]);

  const fetchExistingEvaluation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('inscription_id', inscriptionId)
        .eq('evaluator_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setEvaluation({
          titulo_score: data.titulo_score || 0,
          antiguedad_titulo_score: data.antiguedad_titulo_score || 0,
          antiguedad_docente_score: data.antiguedad_docente_score || 0,
          concepto_score: data.concepto_score || 0,
          promedio_titulo_score: data.promedio_titulo_score || 0,
          trabajo_publico_score: data.trabajo_publico_score || 0,
          becas_otros_score: data.becas_otros_score || 0,
          concurso_score: data.concurso_score || 0,
          otros_antecedentes_score: data.otros_antecedentes_score || 0,
          red_federal_score: data.red_federal_score || 0,
          notes: data.notes || '',
          status: (data.status as 'draft' | 'completed') || 'draft'
        });
      }
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la evaluación',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (criterionId: keyof EvaluationData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const criterion = evaluationCriteria.find(c => c.id === criterionId);
    
    // Validate against maximum value if set
    if (criterion?.maxValue && numericValue > criterion.maxValue) {
      toast({
        title: 'Valor inválido',
        description: `El puntaje máximo para ${criterion.label} es ${criterion.maxValue}`,
        variant: 'destructive',
      });
      return;
    }

    setEvaluation(prev => ({
      ...prev,
      [criterionId]: numericValue
    }));
  };

  const handleSave = async (status: 'draft' | 'completed' = 'draft') => {
    if (!user) return;

    setSaving(true);
    try {
      const evaluationData = {
        inscription_id: inscriptionId,
        evaluator_id: user.id,
        titulo_score: evaluation.titulo_score,
        antiguedad_titulo_score: evaluation.antiguedad_titulo_score,
        antiguedad_docente_score: evaluation.antiguedad_docente_score,
        concepto_score: evaluation.concepto_score,
        promedio_titulo_score: evaluation.promedio_titulo_score,
        trabajo_publico_score: evaluation.trabajo_publico_score,
        becas_otros_score: evaluation.becas_otros_score,
        concurso_score: evaluation.concurso_score,
        otros_antecedentes_score: evaluation.otros_antecedentes_score,
        red_federal_score: evaluation.red_federal_score,
        notes: evaluation.notes,
        status: status
      };

      const { error } = await supabase
        .from('evaluations')
        .upsert(evaluationData, { onConflict: 'inscription_id,evaluator_id' });

      if (error) throw error;

      setEvaluation(prev => ({ ...prev, status }));

      toast({
        title: 'Evaluación guardada',
        description: status === 'completed' 
          ? 'La evaluación ha sido finalizada correctamente' 
          : 'Los cambios han sido guardados como borrador',
      });
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la evaluación',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando evaluación...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Grilla de Evaluación - {teachingLevel.charAt(0).toUpperCase() + teachingLevel.slice(1)}
            </CardTitle>
            <CardDescription>
              Listado de orden de mérito de aspirantes a cobertura de cargos
            </CardDescription>
          </div>
          <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'}>
            {evaluation.status === 'completed' ? 'Finalizada' : 'Borrador'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center font-semibold">COL</TableHead>
                <TableHead className="min-w-[200px] font-semibold">CRITERIO</TableHead>
                <TableHead className="w-20 text-center font-semibold">MAX</TableHead>
                <TableHead className="w-24 text-center font-semibold">PUNTAJE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluationCriteria.map((criterion) => (
                <TableRow key={criterion.id}>
                  <TableCell className="text-center font-mono font-semibold bg-muted">
                    {criterion.column}
                  </TableCell>
                  <TableCell className="font-medium">
                    {criterion.label}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {criterion.maxValue || '—'}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max={criterion.maxValue}
                      step="0.1"
                      value={evaluation[criterion.id] || ''}
                      onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                      className="text-center"
                      disabled={evaluation.status === 'completed'}
                    />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell className="text-center font-mono">—</TableCell>
                <TableCell className="font-bold">TOTAL</TableCell>
                <TableCell className="text-center">—</TableCell>
                <TableCell className="text-center">
                  <div className="px-3 py-2 bg-primary/10 rounded font-bold text-lg">
                    {calculateTotal().toFixed(1)}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Observaciones adicionales
            </label>
            <Textarea
              value={evaluation.notes || ''}
              onChange={(e) => setEvaluation(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Agregar comentarios o observaciones sobre la evaluación..."
              disabled={evaluation.status === 'completed'}
              rows={3}
            />
          </div>

          {evaluation.status !== 'completed' && (
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Borrador
              </Button>
              <Button
                onClick={() => handleSave('completed')}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                Finalizar Evaluación
              </Button>
            </div>
          )}

          {evaluation.status === 'completed' && (
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium">
                ✓ Evaluación finalizada - Total: {calculateTotal().toFixed(1)} puntos
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};