import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Save, Calculator, SkipForward, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

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
  title_type?: 'docente' | 'habilitante' | 'supletorio';
  isImported?: boolean; // Flag to indicate if this evaluation was imported
}

interface EvaluationCriterion {
  id: keyof EvaluationData;
  label: string;
  maxValue?: number;
  column: string;
}

interface SubjectSelection {
  id: string;
  subject_id: string;
  subject?: {
    name: string;
    school?: {
      name: string;
    };
  };
}

interface PositionSelection {
  id: string;
  administrative_position_id: string;
  administrative_position?: {
    name: string;
    school?: {
      name: string;
    };
  };
}

interface EvaluationGridProps {
  inscriptionId: string;
  teachingLevel: string;
  subjectSelection?: SubjectSelection;
  positionSelection?: PositionSelection;
  evaluationNavigation?: {
    hasEvaluationContext: boolean;
    canGoToNext: boolean;
    goToNext: () => void;
    goToNextUnevaluated: () => void;
    backToEvaluations: () => void;
    unevaluatedCount: number;
  };
}

const getTitleTypeMaxValue = (titleType?: string): number => {
  switch (titleType) {
    case 'docente': return 9;
    case 'habilitante': return 6;
    case 'supletorio': return 3;
    default: return 9; // Default for non-secondary levels
  }
};

export const EvaluationGrid: React.FC<EvaluationGridProps> = ({ 
  inscriptionId, 
  teachingLevel, 
  subjectSelection, 
  positionSelection,
  evaluationNavigation
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const initialEvaluation: EvaluationData = {
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
    status: 'draft',
    title_type: teachingLevel === 'secundario' ? 'docente' : undefined
  };

  const [evaluation, setEvaluation] = useState<EvaluationData>(initialEvaluation);
  const [originalEvaluation, setOriginalEvaluation] = useState<EvaluationData>(initialEvaluation);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<() => void | null>(null);

  // Use unsaved changes hook
  const { hasUnsavedChanges } = useUnsavedChanges(evaluation, originalEvaluation);

  const isSecondaryLevel = teachingLevel === 'secundario';
  const titleMaxValue = getTitleTypeMaxValue(evaluation.title_type);

  const evaluationCriteria: EvaluationCriterion[] = [
    { id: 'titulo_score', label: 'TÍTULO', maxValue: titleMaxValue, column: 'A' },
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

  const calculateTotal = (): number => {
    return Object.keys(evaluation)
      .filter(key => key.endsWith('_score'))
      .reduce((total, key) => total + (evaluation[key as keyof EvaluationData] as number), 0);
  };

  useEffect(() => {
    fetchExistingEvaluation();
  }, [inscriptionId, user, subjectSelection, positionSelection]);

  const fetchExistingEvaluation = async () => {
    if (!user) return;

    try {
      // First, try to find any existing evaluation for this inscription (regardless of evaluator)
      // This ensures we show imported scores even if they were imported by a different evaluator
      let query = supabase
        .from('evaluations')
        .select('*')
        .eq('inscription_id', inscriptionId);

      // Add selection-specific filters for secondary level
      if (isSecondaryLevel) {
        if (subjectSelection) {
          query = query.eq('subject_selection_id', subjectSelection.id);
        } else if (positionSelection) {
          query = query.eq('position_selection_id', positionSelection.id);
        }
      } else {
        // For non-secondary levels, ensure we get general evaluations
        query = query.is('subject_selection_id', null).is('position_selection_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      let evaluationData = data;

      // If we found an evaluation, check if it belongs to the current user
      const isCurrentUserEvaluation = evaluationData && evaluationData.evaluator_id === user.id;
      
      if (evaluationData) {
        console.log('Found existing evaluation:', evaluationData);
        console.log('Is current user evaluation:', isCurrentUserEvaluation);
      }

      if (evaluationData) {
        const loadedEvaluation: EvaluationData = {
          titulo_score: evaluationData.titulo_score || 0,
          antiguedad_titulo_score: evaluationData.antiguedad_titulo_score || 0,
          antiguedad_docente_score: evaluationData.antiguedad_docente_score || 0,
          concepto_score: evaluationData.concepto_score || 0,
          promedio_titulo_score: evaluationData.promedio_titulo_score || 0,
          trabajo_publico_score: evaluationData.trabajo_publico_score || 0,
          becas_otros_score: evaluationData.becas_otros_score || 0,
          concurso_score: evaluationData.concurso_score || 0,
          otros_antecedentes_score: evaluationData.otros_antecedentes_score || 0,
          red_federal_score: evaluationData.red_federal_score || 0,
          notes: evaluationData.notes || '',
          // If it's not the current user's evaluation, always set as draft to allow editing
          status: isCurrentUserEvaluation ? (evaluationData.status as 'draft' | 'completed') || 'draft' : 'draft',
          title_type: (evaluationData.title_type as 'docente' | 'habilitante' | 'supletorio') || (isSecondaryLevel ? 'docente' : undefined),
          isImported: !isCurrentUserEvaluation // Mark as imported if it's not the current user's evaluation
        };
        setEvaluation(loadedEvaluation);
        setOriginalEvaluation(loadedEvaluation);
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

  const handleTitleTypeChange = (titleType: string) => {
    const validTitleType = titleType as 'docente' | 'habilitante' | 'supletorio';
    const newMaxValue = getTitleTypeMaxValue(validTitleType);
    
    setEvaluation(prev => ({
      ...prev,
      title_type: validTitleType,
      // Automatically set titulo_score to the maximum value for the selected title type
      titulo_score: newMaxValue
    }));
  };

  const handleSave = async (status: 'draft' | 'completed' = 'draft') => {
    if (!user) return;

    // If saving changes to a completed evaluation, maintain completed status
    const finalStatus = originalEvaluation.status === 'completed' ? 'completed' : status;

    setSaving(true);
    try {
      const evaluationData: any = {
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
        status: finalStatus,
        last_modified_by: user.id
      };

      // Add selection-specific fields for secondary level
      if (isSecondaryLevel) {
        evaluationData.title_type = evaluation.title_type;
        if (subjectSelection) {
          evaluationData.subject_selection_id = subjectSelection.id;
        } else if (positionSelection) {
          evaluationData.position_selection_id = positionSelection.id;
        }
      }

      // Check if this is an existing evaluation from the current user
      const isCurrentUserEvaluation = originalEvaluation && originalEvaluation.evaluator_id === user.id;
      
      let error;
      if (isCurrentUserEvaluation) {
        // Update existing evaluation
        const { error: updateError } = await supabase
          .from('evaluations')
          .upsert(evaluationData, {
            onConflict: 'inscription_id,evaluator_id,subject_selection_id,position_selection_id'
          });
        error = updateError;
      } else {
        // Create new evaluation for current user (this handles imported evaluations)
        const { error: insertError } = await supabase
          .from('evaluations')
          .insert(evaluationData);
        error = insertError;
      }

      if (error) throw error;

      setEvaluation(prev => ({ ...prev, status: finalStatus }));
      // Update original evaluation to reflect saved state
      setOriginalEvaluation(prev => ({ ...prev, ...evaluationData, status: finalStatus }));

      const isEditingCompleted = originalEvaluation.status === 'completed';
      toast({
        title: 'Evaluación guardada',
        description: isEditingCompleted 
          ? 'Los cambios en la evaluación completada han sido guardados'
          : finalStatus === 'completed' 
            ? 'La evaluación ha sido finalizada correctamente' 
            : 'Los cambios han sido guardados como borrador',
      });

      // Auto-navigate logic if in evaluation context and completed (only for new evaluations, not edited ones)
      if (finalStatus === 'completed' && evaluationNavigation?.hasEvaluationContext && originalEvaluation.status !== 'completed' && status === 'completed') {
        // Check if this is the last unevaluated teacher (count will be 1 before saving)
        if (evaluationNavigation.unevaluatedCount === 1) {
          // This is the last one, return to evaluations after showing success message
          setTimeout(() => {
            toast({
              title: 'Período completado',
              description: 'Todas las evaluaciones del período han sido finalizadas',
            });
            setTimeout(() => {
              evaluationNavigation.backToEvaluations();
            }, 1500);
          }, 1500);
        } else if (evaluationNavigation.unevaluatedCount > 1) {
          // There are more to evaluate, go to next
          setTimeout(() => {
            evaluationNavigation.goToNextUnevaluated();
          }, 1500);
        }
      }
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

  // Navigation wrapper functions that check for unsaved changes
  const handleNavigationWithConfirmation = (navigationFn: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationFn);
      setShowNavigationDialog(true);
    } else {
      navigationFn();
    }
  };

  const handleSaveAndContinue = async () => {
    await handleSave('draft');
    setShowNavigationDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleContinueWithoutSaving = () => {
    setShowNavigationDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowNavigationDialog(false);
    setPendingNavigation(null);
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

  const getSelectionTitle = () => {
    if (subjectSelection) {
      return `${subjectSelection.subject?.name} - ${subjectSelection.subject?.school?.name}`;
    }
    if (positionSelection) {
      return `${positionSelection.administrative_position?.name} - ${positionSelection.administrative_position?.school?.name}`;
    }
    return teachingLevel.charAt(0).toUpperCase() + teachingLevel.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Grilla de Evaluación
            </CardTitle>
            <CardDescription>
              {isSecondaryLevel && (subjectSelection || positionSelection) 
                ? getSelectionTitle()
                : `${teachingLevel.charAt(0).toUpperCase() + teachingLevel.slice(1)} - Listado de orden de mérito`
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {evaluation.isImported && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Download className="h-3 w-3 mr-1" />
                Puntajes importados
              </Badge>
            )}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Cambios sin guardar
              </Badge>
            )}
            {evaluation.status === 'completed' && hasUnsavedChanges && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Editando evaluación completada
              </Badge>
            )}
            <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'}>
              {evaluation.status === 'completed' ? 'Finalizada' : 'Borrador'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title Type Selector for Secondary Level */}
        {isSecondaryLevel && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Tipo de Título para {subjectSelection ? 'esta materia' : 'este cargo'}
            </label>
            <Select
              value={evaluation.title_type}
              onValueChange={handleTitleTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo de título" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="docente">Docente (9 puntos)</SelectItem>
                <SelectItem value="habilitante">Habilitante (6 puntos)</SelectItem>
                <SelectItem value="supletorio">Supletorio (3 puntos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

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
                      step="0.01"
                      value={evaluation[criterion.id] || ''}
                      onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                      className="text-center"
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
                    {calculateTotal().toFixed(2)}
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
              rows={3}
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {evaluation.status === 'completed' ? (
                <Button
                  variant="outline"
                  onClick={() => handleSave('completed')}
                  disabled={saving || !hasUnsavedChanges}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </Button>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Quick navigation for evaluation context */}
            {evaluationNavigation?.hasEvaluationContext && evaluation.status !== 'completed' && (
              <div className="flex gap-2">
                {evaluationNavigation.canGoToNext && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() => handleNavigationWithConfirmation(evaluationNavigation.goToNext)}
                  >
                    Siguiente Docente
                  </Button>
                )}
                
                {evaluationNavigation.unevaluatedCount > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={saving}
                    onClick={() => handleNavigationWithConfirmation(evaluationNavigation.goToNextUnevaluated)}
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Siguiente sin evaluar
                  </Button>
                )}
              </div>
            )}
          </div>

          {evaluation.status === 'completed' && !hasUnsavedChanges && (
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium">
                ✓ Evaluación finalizada - Total: {calculateTotal().toFixed(1)} puntos
              </p>
              <p className="text-green-600 text-sm mt-1">
                Puedes editar los valores si es necesario hacer correcciones
              </p>
            </div>
          )}
        </div>

        {/* Navigation Confirmation Dialog */}
        <AlertDialog open={showNavigationDialog} onOpenChange={setShowNavigationDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Cambios sin guardar
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tienes cambios sin guardar en esta evaluación. ¿Qué deseas hacer?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={handleCancelNavigation}>
                Cancelar
              </AlertDialogCancel>
              <Button
                variant="outline"
                onClick={handleContinueWithoutSaving}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Continuar sin guardar
              </Button>
              <AlertDialogAction onClick={handleSaveAndContinue}>
                Guardar y continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};