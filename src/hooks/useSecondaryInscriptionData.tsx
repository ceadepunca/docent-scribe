import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface School {
  id: string;
  name: string;
  teaching_level: 'inicial' | 'primario' | 'secundario';
}

interface Subject {
  id: string;
  name: string;
  school_id: string;
  school?: School;
}

interface AdministrativePosition {
  id: string;
  name: string;
  school_id: string;
  school?: School;
}

export interface SubjectSelection {
  subject_id: string;
  position_type: 'profesor' | 'suplente';
}

export interface PositionSelection {
  administrative_position_id: string;
}

export const useSecondaryInscriptionData = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [administrativePositions, setAdministrativePositions] = useState<AdministrativePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .eq('teaching_level', 'secundario')
        .eq('is_active', true)
        .order('name');

      if (schoolsError) throw schoolsError;

      // Fetch subjects with school data
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          *,
          school:schools(*)
        `)
        .eq('is_active', true)
        .order('name');

      if (subjectsError) throw subjectsError;

      // Fetch administrative positions with school data
      const { data: positionsData, error: positionsError } = await supabase
        .from('administrative_positions')
        .select(`
          *,
          school:schools(*)
        `)
        .eq('is_active', true)
        .order('name');

      if (positionsError) throw positionsError;

      setSchools(schoolsData || []);
      setSubjects(subjectsData || []);
      setAdministrativePositions(positionsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSubjectsBySchool = (schoolId: string) => {
    return subjects.filter(subject => subject.school_id === schoolId);
  };

  const getPositionsBySchool = (schoolId: string) => {
    return administrativePositions.filter(position => position.school_id === schoolId);
  };

  const saveSubjectSelections = async (inscriptionId: string, selections: SubjectSelection[]) => {
    // First, delete existing selections
    const { error: deleteError } = await supabase
      .from('inscription_subject_selections')
      .delete()
      .eq('inscription_id', inscriptionId);

    if (deleteError) throw deleteError;

    // Insert new selections if any
    if (selections.length > 0) {
      const { error: insertError } = await supabase
        .from('inscription_subject_selections')
        .insert(
          selections.map(selection => ({
            inscription_id: inscriptionId,
            ...selection
          }))
        );

      if (insertError) throw insertError;
    }
  };

  const savePositionSelections = async (inscriptionId: string, selections: PositionSelection[]) => {
    // First, delete existing selections
    const { error: deleteError } = await supabase
      .from('inscription_position_selections')
      .delete()
      .eq('inscription_id', inscriptionId);

    if (deleteError) throw deleteError;

    // Insert new selections if any
    if (selections.length > 0) {
      const { error: insertError } = await supabase
        .from('inscription_position_selections')
        .insert(
          selections.map(selection => ({
            inscription_id: inscriptionId,
            ...selection
          }))
        );

      if (insertError) throw insertError;
    }
  };

  return {
    schools,
    subjects,
    administrativePositions,
    loading,
    error,
    refetch: fetchData,
    getSubjectsBySchool,
    getPositionsBySchool,
    saveSubjectSelections,
    savePositionSelections,
  };
};