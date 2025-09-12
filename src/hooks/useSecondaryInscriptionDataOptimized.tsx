import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface School {
  id: string;
  name: string;
  teaching_level: 'inicial' | 'primario' | 'secundario';
}

export interface Subject {
  id: string;
  name: string;
  school_id: string;
  school?: School;
}

export interface AdministrativePosition {
  id: string;
  name: string;
  school_id: string;
  school?: School;
}

export interface SubjectSelection {
  subject_id: string;
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
      setError(null);

      // Parallel fetch all data
      const [schoolsResult, subjectsResult, positionsResult] = await Promise.all([
        supabase
          .from('schools')
          .select('id, name, teaching_level')
          .eq('is_active', true)
          .eq('teaching_level', 'secundario'),
        
        supabase
          .from('subjects')
          .select('id, name, school_id')
          .eq('is_active', true),
        
        supabase
          .from('administrative_positions')
          .select('id, name, school_id')
          .eq('is_active', true)
      ]);

      if (schoolsResult.error) throw schoolsResult.error;
      if (subjectsResult.error) throw subjectsResult.error;
      if (positionsResult.error) throw positionsResult.error;

      const schoolsData = schoolsResult.data || [];
      const subjectsData = subjectsResult.data || [];
      const positionsData = positionsResult.data || [];

      // Filter subjects and positions by secondary schools only
      const schoolIds = schoolsData.map(school => school.id);
      const filteredSubjects = subjectsData.filter(subject => schoolIds.includes(subject.school_id));
      const filteredPositions = positionsData.filter(position => schoolIds.includes(position.school_id));

      setSchools(schoolsData);
      setSubjects(filteredSubjects);
      setAdministrativePositions(filteredPositions);
    } catch (err) {
      console.error('Error fetching secondary inscription data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSubjectsBySchool = (schoolId: string): Subject[] => {
    return subjects.filter(subject => subject.school_id === schoolId);
  };

  const getPositionsBySchool = (schoolId: string): AdministrativePosition[] => {
    return administrativePositions.filter(position => position.school_id === schoolId);
  };

  const saveSubjectSelections = async (inscriptionId: string, selections: SubjectSelection[]) => {
    try {
      // Delete existing selections
      await supabase
        .from('inscription_subject_selections')
        .delete()
        .eq('inscription_id', inscriptionId);

      // Insert new selections
      if (selections.length > 0) {
        const selectionsToInsert = selections.map(selection => ({
          inscription_id: inscriptionId,
          subject_id: selection.subject_id,
          position_type: 'profesor' // Default for secondary
        }));

        const { error } = await supabase
          .from('inscription_subject_selections')
          .insert(selectionsToInsert);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving subject selections:', error);
      throw error;
    }
  };

  const savePositionSelections = async (inscriptionId: string, selections: PositionSelection[]) => {
    try {
      // Delete existing selections
      await supabase
        .from('inscription_position_selections')
        .delete()
        .eq('inscription_id', inscriptionId);

      // Insert new selections
      if (selections.length > 0) {
        const selectionsToInsert = selections.map(selection => ({
          inscription_id: inscriptionId,
          administrative_position_id: selection.administrative_position_id
        }));

        const { error } = await supabase
          .from('inscription_position_selections')
          .insert(selectionsToInsert);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving position selections:', error);
      throw error;
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