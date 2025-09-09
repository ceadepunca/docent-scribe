import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ListingItem {
  inscription_id: string;
  teacher_name: string;
  teacher_dni: string;
  school_name: string;
  item_name: string; // subject or position name
  item_type: 'subject' | 'position';
  total_score: number | null;
  evaluation_status: 'completed' | 'draft';
  evaluation_id: string | null;
}

export interface ListingFilters {
  schoolId: string;
  listingType: 'all' | 'subjects' | 'positions' | 'specific-subject' | 'specific-position';
  specificItemId?: string;
  evaluationStatus: 'all' | 'completed' | 'draft';
}

export const useListingData = () => {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [schoolsRes, subjectsRes, positionsRes] = await Promise.all([
          supabase.from('schools').select('*').eq('is_active', true).eq('teaching_level', 'secundario'),
          supabase.from('subjects').select('*, schools(name)').eq('is_active', true),
          supabase.from('administrative_positions').select('*, schools(name)').eq('is_active', true)
        ]);

        if (schoolsRes.error) throw schoolsRes.error;
        if (subjectsRes.error) throw subjectsRes.error;
        if (positionsRes.error) throw positionsRes.error;

        setSchools(schoolsRes.data || []);
        setSubjects(subjectsRes.data || []);
        setPositions(positionsRes.data || []);
      } catch (err) {
        console.error('Error fetching reference data:', err);
        setError('Error al cargar datos de referencia');
      }
    };

    fetchReferenceData();
  }, []);

  const fetchListings = async (filters: ListingFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Base query for subject selections
      let subjectQuery = supabase
        .from('inscription_subject_selections')
        .select(`
          inscription_id,
          subject_id,
          inscriptions!inner(
            user_id,
            teaching_level,
            profiles!inner(
              first_name,
              last_name,
              dni
            )
          ),
          subjects!inner(
            name,
            school_id,
            schools!inner(name)
          ),
          evaluations(
            id,
            total_score,
            status
          )
        `)
        .eq('inscriptions.teaching_level', 'secundario');

      // Base query for position selections
      let positionQuery = supabase
        .from('inscription_position_selections')
        .select(`
          inscription_id,
          administrative_position_id,
          inscriptions!inner(
            user_id,
            teaching_level,
            profiles!inner(
              first_name,
              last_name,
              dni
            )
          ),
          administrative_positions!inner(
            name,
            school_id,
            schools!inner(name)
          ),
          evaluations(
            id,
            total_score,
            status
          )
        `)
        .eq('inscriptions.teaching_level', 'secundario');

      // Apply school filter
      if (filters.schoolId !== 'all') {
        subjectQuery = subjectQuery.eq('subjects.school_id', filters.schoolId);
        positionQuery = positionQuery.eq('administrative_positions.school_id', filters.schoolId);
      }

      const results: ListingItem[] = [];

      // Fetch subjects data if needed
      if (filters.listingType === 'all' || filters.listingType === 'subjects' || filters.listingType === 'specific-subject') {
        if (filters.listingType === 'specific-subject' && filters.specificItemId) {
          subjectQuery = subjectQuery.eq('subject_id', filters.specificItemId);
        }

        const { data: subjectSelections, error: subjectError } = await subjectQuery;
        if (subjectError) throw subjectError;

        subjectSelections?.forEach((selection: any) => {
          const evaluation = selection.evaluations?.[0];
          results.push({
            inscription_id: selection.inscription_id,
            teacher_name: `${selection.inscriptions.profiles.last_name}, ${selection.inscriptions.profiles.first_name}`,
            teacher_dni: selection.inscriptions.profiles.dni || 'Sin DNI',
            school_name: selection.subjects.schools.name,
            item_name: selection.subjects.name,
            item_type: 'subject',
            total_score: evaluation?.total_score || null,
            evaluation_status: evaluation?.status || 'draft',
            evaluation_id: evaluation?.id || null
          });
        });
      }

      // Fetch positions data if needed
      if (filters.listingType === 'all' || filters.listingType === 'positions' || filters.listingType === 'specific-position') {
        if (filters.listingType === 'specific-position' && filters.specificItemId) {
          positionQuery = positionQuery.eq('administrative_position_id', filters.specificItemId);
        }

        const { data: positionSelections, error: positionError } = await positionQuery;
        if (positionError) throw positionError;

        positionSelections?.forEach((selection: any) => {
          const evaluation = selection.evaluations?.[0];
          results.push({
            inscription_id: selection.inscription_id,
            teacher_name: `${selection.inscriptions.profiles.last_name}, ${selection.inscriptions.profiles.first_name}`,
            teacher_dni: selection.inscriptions.profiles.dni || 'Sin DNI',
            school_name: selection.administrative_positions.schools.name,
            item_name: selection.administrative_positions.name,
            item_type: 'position',
            total_score: evaluation?.total_score || null,
            evaluation_status: evaluation?.status || 'draft',
            evaluation_id: evaluation?.id || null
          });
        });
      }

      // Apply evaluation status filter
      const filteredResults = results.filter(item => {
        if (filters.evaluationStatus === 'all') return true;
        return item.evaluation_status === filters.evaluationStatus;
      });

      setListings(filteredResults);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Error al cargar listados');
    } finally {
      setLoading(false);
    }
  };

  return {
    listings,
    schools,
    subjects,
    positions,
    loading,
    error,
    fetchListings
  };
};