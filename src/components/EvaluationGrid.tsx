import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  id?: string;
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
    unevaluatedCount: number;
  };
}

export const EvaluationGrid: React.FC<EvaluationGridProps> = ({ 
  inscriptionId, 
  teachingLevel, 
  subjectSelection, 
  positionSelection,
  evaluationNavigation
}) => {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<EvaluationData>();
  const [saving, setSaving] = useState(false);

  const handleDelete = async () => {
    try {
      if (!window.confirm('¿Seguro que deseas eliminar esta materia/cargo y su evaluación? Esta acción no se puede deshacer.')) {
        return;
      }

      setSaving(true);

      // 1. Si hay materia seleccionada
      if (subjectSelection?.id) {
        // Eliminar evaluación asociada a la materia
        const { error: evalError } = await supabase
          .from('evaluations')
          .delete()
          .eq('subject_selection_id', subjectSelection.id);
          
        if (evalError) {
          throw new Error(`Error eliminando evaluación: ${evalError.message}`);
        }

        // Eliminar selección de materia
        const { error: subjectError } = await supabase
          .from('inscription_subject_selections')
          .delete()
          .eq('id', subjectSelection.id);
          
        if (subjectError) {
          throw new Error(`Error eliminando materia: ${subjectError.message}`);
        }
      }

      // 2. Si hay cargo seleccionado
      if (positionSelection?.id) {
        // Eliminar evaluación asociada al cargo
        const { error: evalError } = await supabase
          .from('evaluations')
          .delete()
          .eq('position_selection_id', positionSelection.id);
          
        if (evalError) {
          throw new Error(`Error eliminando evaluación: ${evalError.message}`);
        }

        // Eliminar selección de cargo
        const { error: posError } = await supabase
          .from('inscription_position_selections')
          .delete()
          .eq('id', positionSelection.id);
          
        if (posError) {
          throw new Error(`Error eliminando cargo: ${posError.message}`);
        }
      }

      toast({ 
        title: 'Eliminación exitosa', 
        description: 'La materia/cargo y su evaluación fueron eliminados correctamente' 
      });
      
      // Recargar la página para actualizar la vista
      window.location.reload();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card data-evaluation-grid>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Grilla de Evaluación
              {isSuperAdmin && (subjectSelection || positionSelection) && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-2"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {saving ? 'Eliminando...' : 'Eliminar materia/cargo'}
                </Button>
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      {/* Aquí va el resto del JSX del componente */}
    </Card>
  );
};