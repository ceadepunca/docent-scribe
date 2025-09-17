import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, Calculator, User, GraduationCap, SkipForward } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  first_name: string;
  last_name: string;
  dni: string | null;
  email: string;
  titulo_1_nombre: string | null;
  titulo_1_promedio: number | null;
  titulo_2_nombre: string | null;
  titulo_2_promedio: number | null;
  titulo_3_nombre: string | null;
  titulo_3_promedio: number | null;
  titulo_4_nombre: string | null;
  titulo_4_promedio: number | null;
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
  title_type: 'docente' | 'habilitante' | 'supletorio';
}

interface GroupedItem {
  id: string;
  displayName: string;
  selections: (SubjectSelection | PositionSelection)[];
  evaluation: EvaluationData;
  type: 'subject' | 'position';
}

interface ConsolidatedEvaluationGridProps {
  inscriptionId: string;
  subjectSelections: SubjectSelection[];
  positionSelections: PositionSelection[];
  userId: string;
  evaluationNavigation?: {
    hasEvaluationContext: boolean;
    canGoToNext: boolean;
    goToNext: () => void;
    goToNextUnevaluated: () => void;
    unevaluatedCount: number;
  };
}

const getTitleTypeMaxValue = (titleType: string): number => {
  switch (titleType) {
    case 'docente': return 9;
    case 'habilitante': return 6;
    case 'supletorio': return 3;
    default: return 9;
  }
};

const evaluationCriteria = [
  { id: 'titulo_score', label: 'TÍT.', fullLabel: 'TÍTULO', maxValue: undefined, column: 'A' },
  { id: 'antiguedad_titulo_score', label: 'ANT.TÍT.', fullLabel: 'ANTIGÜEDAD TÍTULO', maxValue: 3, column: 'B' },
  { id: 'antiguedad_docente_score', label: 'ANT.DOC.', fullLabel: 'ANTIGÜEDAD DOCENTE', maxValue: 6, column: 'C' },
  { id: 'concepto_score', label: 'CONC.', fullLabel: 'CONCEPTO', maxValue: undefined, column: 'D' },
  { id: 'promedio_titulo_score', label: 'PROM.', fullLabel: 'PROMEDIO GENERAL TÍTULO DOCENTE', maxValue: undefined, column: 'E' },
  { id: 'trabajo_publico_score', label: 'T.PUB.', fullLabel: 'TRABAJO PÚBLICO', maxValue: 3, column: 'F' },
  { id: 'becas_otros_score', label: 'BECAS', fullLabel: 'BECAS Y OTROS ESTUDIOS', maxValue: 3, column: 'G' },
  { id: 'concurso_score', label: 'CONC.', fullLabel: 'CONCURSO', maxValue: 2, column: 'H' },
  { id: 'otros_antecedentes_score', label: 'OTROS', fullLabel: 'OTROS ANTECEDENTES DOCENTES', maxValue: 3, column: 'I' },
  { id: 'red_federal_score', label: 'R.FED.', fullLabel: 'RED FEDERAL', maxValue: 3, column: 'J' },
] as const;

export const ConsolidatedEvaluationGrid: React.FC<ConsolidatedEvaluationGridProps> = ({
  inscriptionId,
  subjectSelections,
  positionSelections,
  userId,
  evaluationNavigation
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [groupedItems, setGroupedItems] = useState<GroupedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalNotes, setGlobalNotes] = useState('');

  // Group similar items by name/title scope
  const groupItems = (subjects: SubjectSelection[], positions: PositionSelection[]): GroupedItem[] => {
    const groups: GroupedItem[] = [];
    
    // Group subjects by name (could be enhanced to group by discipline)
    const subjectGroups = new Map<string, SubjectSelection[]>();
    subjects.forEach(selection => {
      const name = selection.subject?.name || 'Sin nombre';
      if (!subjectGroups.has(name)) {
        subjectGroups.set(name, []);
      }
      subjectGroups.get(name)!.push(selection);
    });

    // Create grouped items for subjects
    subjectGroups.forEach((selections, name) => {
      const schoolNames = selections
        .map(s => s.subject?.school?.name)
        .filter(Boolean)
        .join(', ');
      
      const displayName = schoolNames ? `${name} (${schoolNames})` : name;
      
      groups.push({
        id: `subject-group-${name}`,
        displayName,
        selections,
        type: 'subject',
        evaluation: {
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
          title_type: 'docente'
        }
      });
    });

    // Group positions by name
    const positionGroups = new Map<string, PositionSelection[]>();
    positions.forEach(selection => {
      const name = selection.administrative_position?.name || 'Sin nombre';
      if (!positionGroups.has(name)) {
        positionGroups.set(name, []);
      }
      positionGroups.get(name)!.push(selection);
    });

    // Create grouped items for positions
    positionGroups.forEach((selections, name) => {
      const schoolNames = selections
        .map(s => s.administrative_position?.school?.name)
        .filter(Boolean)
        .join(', ');
      
      const displayName = schoolNames ? `${name} (${schoolNames})` : name;
      
      groups.push({
        id: `position-group-${name}`,
        displayName,
        selections,
        type: 'position',
        evaluation: {
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
          title_type: 'docente'
        }
      });
    });

    return groups;
  };

  const calculateTotal = (evaluation: EvaluationData): number => {
    return evaluationCriteria.reduce((total, criterion) => {
      return total + (evaluation[criterion.id as keyof EvaluationData] as number || 0);
    }, 0);
  };

  const fetchProfileAndEvaluations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Initialize grouped items
      const initialGroups = groupItems(subjectSelections, positionSelections);
      
      // Fetch existing evaluations for each group
      for (const group of initialGroups) {
        // For now, load evaluation from the first selection in the group
        // In a real scenario, you might want to load a representative evaluation
        const firstSelection = group.selections[0];
        
        let query = supabase
          .from('evaluations')
          .select('*')
          .eq('inscription_id', inscriptionId)
          .eq('evaluator_id', user.id);

        if (group.type === 'subject') {
          query = query.eq('subject_selection_id', firstSelection.id);
        } else {
          query = query.eq('position_selection_id', firstSelection.id);
        }

        const { data: evaluationData } = await query.maybeSingle();

        if (evaluationData) {
          group.evaluation = {
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
            status: (evaluationData.status as 'draft' | 'completed') || 'draft',
            title_type: (evaluationData.title_type as 'docente' | 'habilitante' | 'supletorio') || 'docente'
          };
        }
      }

      setGroupedItems(initialGroups);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndEvaluations();
  }, [inscriptionId, user, subjectSelections, positionSelections, userId]);

  // Function to replicate evaluation values to all other rows
  const replicateToAllRows = (sourceGroupIndex: number, fieldName: keyof EvaluationData, value: any) => {
    setGroupedItems(prev => {
      const updated = [...prev];
      const sourceEvaluation = updated[sourceGroupIndex].evaluation;
      
      // Update all other rows that are not completed
      updated.forEach((group, index) => {
        if (index !== sourceGroupIndex && group.evaluation.status !== 'completed') {
          updated[index] = {
            ...group,
            evaluation: {
              ...group.evaluation,
              [fieldName]: value
            }
          };
        }
      });
      
      return updated;
    });
  };

  const handleScoreChange = (groupIndex: number, criterionId: keyof EvaluationData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const criterion = evaluationCriteria.find(c => c.id === criterionId);
    const group = groupedItems[groupIndex];
    
    // Validate against maximum value
    let maxValue = criterion?.maxValue;
    if (criterionId === 'titulo_score') {
      maxValue = getTitleTypeMaxValue(group.evaluation.title_type);
    }
    
    if (maxValue && numericValue > maxValue) {
      toast({
        title: 'Valor inválido',
        description: `El puntaje máximo para ${criterion?.label} es ${maxValue}`,
        variant: 'destructive',
      });
      return;
    }

    // First, update the current row
    setGroupedItems(prev => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        evaluation: {
          ...updated[groupIndex].evaluation,
          [criterionId]: numericValue
        }
      };
      return updated;
    });
    
    // Don't replicate titulo_score to other rows as teachers can have different titles per subject/position
    if (criterionId !== 'titulo_score') {
      setTimeout(() => {
        replicateToAllRows(groupIndex, criterionId, numericValue);
      }, 0);
    }
  };

  const handleTitleTypeChange = (groupIndex: number, titleType: string) => {
    const validTitleType = titleType as 'docente' | 'habilitante' | 'supletorio';
    const newMaxValue = getTitleTypeMaxValue(validTitleType);
    
    // Only update the current row - don't replicate to other rows
    // as teachers can have different title types for different subjects/positions
    setGroupedItems(prev => {
      const updated = [...prev];
      const currentEvaluation = updated[groupIndex].evaluation;
      
      updated[groupIndex] = {
        ...updated[groupIndex],
        evaluation: {
          ...currentEvaluation,
          title_type: validTitleType,
          titulo_score: newMaxValue
        }
      };
      return updated;
    });
  };

  const saveEvaluationsForGroup = async (group: GroupedItem) => {
    if (!user) return;

    const evaluationData = {
      inscription_id: inscriptionId,
      evaluator_id: user.id,
      titulo_score: group.evaluation.titulo_score,
      antiguedad_titulo_score: group.evaluation.antiguedad_titulo_score,
      antiguedad_docente_score: group.evaluation.antiguedad_docente_score,
      concepto_score: group.evaluation.concepto_score,
      promedio_titulo_score: group.evaluation.promedio_titulo_score,
      trabajo_publico_score: group.evaluation.trabajo_publico_score,
      becas_otros_score: group.evaluation.becas_otros_score,
      concurso_score: group.evaluation.concurso_score,
      otros_antecedentes_score: group.evaluation.otros_antecedentes_score,
      red_federal_score: group.evaluation.red_federal_score,
      notes: group.evaluation.notes,
      status: group.evaluation.status,
      title_type: group.evaluation.title_type
    };

    // Save evaluation for each selection in the group
    for (const selection of group.selections) {
      const data = {
        ...evaluationData,
        last_modified_by: user.id,
        ...(group.type === 'subject' 
          ? { subject_selection_id: selection.id }
          : { position_selection_id: selection.id }
        )
      };

      const { error } = await supabase
        .from('evaluations')
        .upsert(data, { 
          onConflict: 'inscription_id,evaluator_id,subject_selection_id,position_selection_id' 
        });

      if (error) throw error;
    }
  };

  const handleSaveAll = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Save all group evaluations
      for (const group of groupedItems) {
        await saveEvaluationsForGroup(group);
      }

      toast({
        title: 'Evaluaciones guardadas',
        description: 'Todas las evaluaciones han sido guardadas correctamente',
      });
    } catch (error: any) {
      console.error('Error saving evaluations:', error);
      toast({
        title: 'Error',
        description: `No se pudieron guardar las evaluaciones: ${error.message || error}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAll = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Mark all evaluations as completed and save
      const updatedGroups = [...groupedItems];
      updatedGroups.forEach(group => {
        group.evaluation.status = 'completed';
      });
      setGroupedItems(updatedGroups);

      for (const group of updatedGroups) {
        await saveEvaluationsForGroup(group);
      }

      toast({
        title: 'Evaluaciones finalizadas',
        description: 'Todas las evaluaciones han sido finalizadas correctamente',
      });

      // Auto-navigate to next unevaluated if in evaluation context
      if (evaluationNavigation?.hasEvaluationContext && evaluationNavigation.unevaluatedCount > 0) {
        setTimeout(() => {
          evaluationNavigation.goToNextUnevaluated();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error completing evaluations:', error);
      toast({
        title: 'Error',
        description: `No se pudieron finalizar las evaluaciones: ${error.message || error}`,
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
          <p className="mt-2 text-muted-foreground">Cargando evaluaciones...</p>
        </CardContent>
      </Card>
    );
  }

  const allCompleted = groupedItems.every(group => group.evaluation.status === 'completed');
  const hasEvaluations = groupedItems.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Grilla Consolidada de Evaluación
            </CardTitle>
            <CardDescription>
              Evaluación completa para nivel secundario
              <span className="block mt-1 text-xs text-primary font-medium">
                ⚡ Los valores se replican automáticamente (excepto títulos que son individuales)
              </span>
            </CardDescription>
          </div>
          <Badge variant={allCompleted ? 'default' : 'secondary'}>
            {allCompleted ? 'Finalizada' : 'En Progreso'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Teacher Profile Information */}
        {profile && (
          <Card className="bg-muted/30">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-sm">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      DNI: {profile.dni || 'N/A'} | {profile.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <GraduationCap className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {[
                      profile.titulo_1_nombre && `${profile.titulo_1_nombre.substring(0, 25)}${profile.titulo_1_nombre.length > 25 ? '...' : ''} (${profile.titulo_1_promedio || 'N/A'})`,
                      profile.titulo_2_nombre && `${profile.titulo_2_nombre.substring(0, 25)}${profile.titulo_2_nombre.length > 25 ? '...' : ''} (${profile.titulo_2_promedio || 'N/A'})`
                    ].filter(Boolean).slice(0, 2).join(' • ') || 'Sin títulos'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Consolidated Evaluation Table */}
        {hasEvaluations && (
          <div className="w-full">
            <TooltipProvider>
              <Table className="table-fixed w-full text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px] font-semibold text-xs">MATERIA / CARGO</TableHead>
                    <TableHead className="w-[100px] font-semibold text-xs">TIPO</TableHead>
                    {evaluationCriteria.map((criterion) => (
                      <Tooltip key={criterion.id}>
                        <TooltipTrigger asChild>
                          <TableHead className="w-8 text-center font-semibold p-1 h-20">
                            <div className="flex flex-col items-center justify-center h-full leading-none">
                              {criterion.label.split('').map((char, index) => (
                                <span key={index} className="block text-xs font-bold">
                                  {char}
                                </span>
                              ))}
                            </div>
                          </TableHead>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p><strong>{criterion.column}:</strong> {criterion.fullLabel}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    <TableHead className="w-16 text-center font-semibold text-xs h-24">
                      <div className="flex flex-col items-center justify-center h-full leading-none">
                        {'TOTAL'.split('').map((letter, index) => (
                          <span key={index} className="block text-2xs font-bold">
                            {letter}
                          </span>
                        ))}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {groupedItems.map((group, groupIndex) => {
                  const total = calculateTotal(group.evaluation);
                  const titleMaxValue = getTitleTypeMaxValue(group.evaluation.title_type);
                  
                  return (
                    <TableRow key={group.id} className="text-xs">
                      <TableCell className="p-2">
                        <div>
                          <p className="font-semibold text-xs leading-tight break-words">{group.displayName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-2xs px-1 py-0">
                              {group.evaluation.status === 'completed' ? 'Ok' : 'Draft'}
                            </Badge>
                            {group.evaluation.status !== 'completed' && (
                              <Badge variant="secondary" className="text-2xs px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
                                ↔ Sync
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-1">
                        <Select
                          value={group.evaluation.title_type}
                          onValueChange={(value) => handleTitleTypeChange(groupIndex, value)}
                          disabled={group.evaluation.status === 'completed'}
                        >
                          <SelectTrigger className="w-full h-7 text-2xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="docente" className="text-2xs">Doc (9)</SelectItem>
                            <SelectItem value="habilitante" className="text-2xs">Hab (6)</SelectItem>
                            <SelectItem value="supletorio" className="text-2xs">Sup (3)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {evaluationCriteria.map((criterion) => {
                        let maxValue = criterion.maxValue;
                        if (criterion.id === 'titulo_score') {
                          maxValue = titleMaxValue;
                        }
                        
                        return (
                          <TableCell key={criterion.id} className="p-1">
                           <Input
                              type="number"
                              min="0"
                              max={maxValue}
                              step="0.01"
                              value={group.evaluation[criterion.id as keyof EvaluationData] || ''}
                              onChange={(e) => handleScoreChange(groupIndex, criterion.id as keyof EvaluationData, e.target.value)}
                              className="text-center w-8 h-7 text-2xs px-0"
                              disabled={group.evaluation.status === 'completed'}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center p-1">
                        <div className="px-1 py-1 bg-primary/10 rounded font-bold text-2xs">
                          {total.toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </TooltipProvider>
          </div>
        )}

        {/* Global Notes */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Observaciones generales
            </label>
            <Textarea
              value={globalNotes}
              onChange={(e) => setGlobalNotes(e.target.value)}
              placeholder="Agregar comentarios generales sobre todas las evaluaciones..."
              disabled={allCompleted}
              rows={3}
            />
          </div>

          {!allCompleted && (
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleSaveAll}
                        disabled={saving || !hasEvaluations}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Guardar Todo
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Guarda como borrador - se puede seguir editando</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleCompleteAll}
                        disabled={saving || !hasEvaluations}
                        className="flex items-center gap-2"
                      >
                        <Calculator className="h-4 w-4" />
                        Finalizar Todas las Evaluaciones
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Marca como completadas y bloquea la edición</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Quick navigation for evaluation context */}
              {evaluationNavigation?.hasEvaluationContext && (
                <div className="flex gap-2">
                  {evaluationNavigation.canGoToNext && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={evaluationNavigation.goToNext}
                    >
                      Siguiente Docente
                    </Button>
                  )}
                  
                  {evaluationNavigation.unevaluatedCount > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={saving}
                      onClick={evaluationNavigation.goToNextUnevaluated}
                    >
                      <SkipForward className="h-4 w-4 mr-1" />
                      Siguiente sin evaluar
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {allCompleted && (
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium">
                ✓ Todas las evaluaciones finalizadas - Total General: {groupedItems.reduce((total, group) => total + calculateTotal(group.evaluation), 0).toFixed(2)} puntos
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};