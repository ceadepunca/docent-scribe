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
      // 1. Mostrar datos actuales
      const data = {
        inscription_id: inscriptionId,
        position: positionSelection,
        evaluation: evaluation
      };
      alert('Debug - Datos para eliminar: ' + JSON.stringify(data, null, 2));

      if (!window.confirm('¿Seguro que deseas eliminar esta materia/cargo y su evaluación? Esta acción no se puede deshacer.')) {
        return;
      }

      setSaving(true);

      // 2. Eliminar evaluación primero
      if (evaluation?.id) {
        const { error: evalError } = await supabase
          .from('evaluations')
          .delete()
          .eq('id', evaluation.id);
          
        if (evalError) {
          throw new Error(`Error eliminando evaluación: ${evalError.message}`);
        }
        alert('Debug - Evaluación eliminada con éxito');
      }

      // 3. Eliminar posición
      if (positionSelection?.id) {
        const { error: posError } = await supabase
          .from('inscription_position_selections')
          .delete()
          .eq('inscription_id', inscriptionId)
          .eq('administrative_position_id', positionSelection.administrative_position_id);
          
        if (posError) {
          throw new Error(`Error eliminando posición: ${posError.message}`);
        }
        alert('Debug - Posición eliminada con éxito');
      }

      setSaving(false);
      toast({ 
        title: 'Eliminación exitosa', 
        description: 'La materia/cargo y su evaluación fueron eliminados correctamente' 
      });
      
      // Forzar recarga completa sin caché
      window.location.href = window.location.href.split('#')[0];
    } catch (error) {
      setSaving(false);
      alert(`Error en la operación: ${error.message}`);
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive'
      });
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
                  className="ml-2 px-2 py-0 text-xs"
                  onClick={handleDelete}
                >
                  Eliminar materia/cargo
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