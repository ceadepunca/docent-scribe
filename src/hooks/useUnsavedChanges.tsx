import { useCallback, useEffect, useState } from 'react';

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
}

export const useUnsavedChanges = (
  currentEvaluation: EvaluationData,
  originalEvaluation: EvaluationData
) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const calculateTotal = useCallback((evaluation: EvaluationData): number => {
    return Object.keys(evaluation)
      .filter(key => key.endsWith('_score'))
      .reduce((total, key) => total + (evaluation[key as keyof EvaluationData] as number), 0);
  }, []);

  const hasDataEntered = useCallback((evaluation: EvaluationData): boolean => {
    const total = calculateTotal(evaluation);
    const hasTitle = evaluation.title_type !== undefined;
    const hasNotes = (evaluation.notes || '').trim().length > 0;
    
    return total > 0 || hasTitle || hasNotes;
  }, [calculateTotal]);

  const detectChanges = useCallback(() => {
    // If evaluation is completed, no changes can be made
    if (currentEvaluation.status === 'completed') {
      setHasUnsavedChanges(false);
      return;
    }

    // Check if there's data entered but not saved
    const currentHasData = hasDataEntered(currentEvaluation);
    const originalHasData = hasDataEntered(originalEvaluation);
    
    // Compare current vs original to detect changes
    const hasChanges = JSON.stringify(currentEvaluation) !== JSON.stringify(originalEvaluation);
    
    // Has unsaved changes if there are changes AND there's data entered
    setHasUnsavedChanges(hasChanges && currentHasData);
  }, [currentEvaluation, originalEvaluation, hasDataEntered]);

  useEffect(() => {
    detectChanges();
  }, [detectChanges]);

  // Prevent browser navigation if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    hasUnsavedChanges,
    hasDataEntered: hasDataEntered(currentEvaluation),
    calculateTotal
  };
};