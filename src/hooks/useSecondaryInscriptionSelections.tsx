import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LoadedSubjectSelection {
  id: string;
  subject_id: string;
  position_type: string;
}

export interface LoadedPositionSelection {
  id: string;
  administrative_position_id: string;
}

export const useSecondaryInscriptionSelections = (inscriptionId?: string | null) => {
  const [subjectSelections, setSubjectSelections] = useState<LoadedSubjectSelection[]>([]);
  const [positionSelections, setPositionSelections] = useState<LoadedPositionSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSelections = async () => {
    if (!inscriptionId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Load subject selections
      const { data: subjectData, error: subjectError } = await supabase
        .from('inscription_subject_selections')
        .select('*')
        .eq('inscription_id', inscriptionId);

      if (subjectError) throw subjectError;

      // Load position selections
      const { data: positionData, error: positionError } = await supabase
        .from('inscription_position_selections')
        .select('*')
        .eq('inscription_id', inscriptionId);

      if (positionError) throw positionError;

      setSubjectSelections(subjectData || []);
      setPositionSelections(positionData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading selections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSelections();
  }, [inscriptionId]);

  return {
    subjectSelections,
    positionSelections,
    loading,
    error,
    refetch: loadSelections,
  };
};