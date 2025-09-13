import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ListingItem {
  inscription_id: string;
  teacher_name: string;
  teacher_dni: string;
  school_name: string;
  item_name: string; // subject or position name
  item_type: 'subject' | 'position';
  specialty?: 'ciclo_basico' | 'electromecanica' | 'construccion'; // only for subjects
  total_score: number | null;
  evaluation_status: 'completed' | 'draft';
  evaluation_id: string | null;
  
  // Detailed evaluation scores
  titulo_score: number | null;
  antiguedad_titulo_score: number | null;
  antiguedad_docente_score: number | null;
  concepto_score: number | null;
  promedio_titulo_score: number | null;
  trabajo_publico_score: number | null;
  becas_otros_score: number | null;
  concurso_score: number | null;
  otros_antecedentes_score: number | null;
  red_federal_score: number | null;
  title_type: 'docente' | 'habilitante' | 'supletorio' | null;
  
  // Additional teacher information
  teacher_email: string;
  teacher_titles: string;
}

export interface ListingFilters {
  schoolId: string;
  listingType: 'all' | 'subjects' | 'positions' | 'specific-subject' | 'specific-position';
  specificItemId?: string;
  evaluationStatus: 'all' | 'completed' | 'draft';
  periodId?: string;
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
          id,
          inscription_id,
          subject_id,
          inscriptions!inner(
            user_id,
            teaching_level,
            profiles!inner(
              first_name,
              last_name,
              dni,
              email,
              titulo_1_nombre,
              titulo_1_promedio,
              titulo_2_nombre,
              titulo_2_promedio,
              titulo_3_nombre,
              titulo_3_promedio,
              titulo_4_nombre,
              titulo_4_promedio
            )
          ),
          subjects!inner(
            name,
            specialty,
            school_id,
            schools!inner(name)
          )
        `)
        .eq('inscriptions.teaching_level', 'secundario');

      // Separate query for evaluations with subject_selection_id
      const evaluationsQuery = supabase
        .from('evaluations')
        .select(`
          subject_selection_id,
          position_selection_id,
          id,
          total_score,
          status,
          titulo_score,
          antiguedad_titulo_score,
          antiguedad_docente_score,
          concepto_score,
          promedio_titulo_score,
          trabajo_publico_score,
          becas_otros_score,
          concurso_score,
          otros_antecedentes_score,
          red_federal_score,
          title_type
        `);

      // Apply period filter if specified
      if (filters.periodId) {
        subjectQuery = subjectQuery.eq('inscriptions.inscription_period_id', filters.periodId);
      }

      // Base query for position selections
      let positionQuery = supabase
        .from('inscription_position_selections')
        .select(`
          id,
          inscription_id,
          administrative_position_id,
          inscriptions!inner(
            user_id,
            teaching_level,
            profiles!inner(
              first_name,
              last_name,
              dni,
              email,
              titulo_1_nombre,
              titulo_1_promedio,
              titulo_2_nombre,
              titulo_2_promedio,
              titulo_3_nombre,
              titulo_3_promedio,
              titulo_4_nombre,
              titulo_4_promedio
            )
          ),
          administrative_positions!inner(
            name,
            school_id,
            schools!inner(name)
          )
        `)
        .eq('inscriptions.teaching_level', 'secundario');

      // Apply period filter if specified
      if (filters.periodId) {
        positionQuery = positionQuery.eq('inscriptions.inscription_period_id', filters.periodId);
      }

      // Apply school filter
      if (filters.schoolId !== 'all') {
        subjectQuery = subjectQuery.eq('subjects.school_id', filters.schoolId);
        positionQuery = positionQuery.eq('administrative_positions.school_id', filters.schoolId);
      }

      const results: ListingItem[] = [];

      // Fetch evaluations data once
      const { data: evaluations, error: evaluationsError } = await evaluationsQuery;
      if (evaluationsError) throw evaluationsError;

      // Create lookup maps for evaluations
      const subjectEvaluationsMap = new Map();
      const positionEvaluationsMap = new Map();
      
      evaluations?.forEach((evaluation: any) => {
        if (evaluation.subject_selection_id) {
          subjectEvaluationsMap.set(evaluation.subject_selection_id, evaluation);
        }
        if (evaluation.position_selection_id) {
          positionEvaluationsMap.set(evaluation.position_selection_id, evaluation);
        }
      });

      // Fetch subjects data if needed
      if (filters.listingType === 'all' || filters.listingType === 'subjects' || filters.listingType === 'specific-subject') {
        if (filters.listingType === 'specific-subject' && filters.specificItemId) {
          subjectQuery = subjectQuery.eq('subject_id', filters.specificItemId);
        }

        const { data: subjectSelections, error: subjectError } = await subjectQuery;
        if (subjectError) throw subjectError;

        subjectSelections?.forEach((selection: any) => {
          const evaluation = subjectEvaluationsMap.get(selection.id);
          const profile = selection.inscriptions.profiles;
          const titles = [
            profile.titulo_1_nombre && `${profile.titulo_1_nombre} (${profile.titulo_1_promedio || 'N/A'})`,
            profile.titulo_2_nombre && `${profile.titulo_2_nombre} (${profile.titulo_2_promedio || 'N/A'})`,
            profile.titulo_3_nombre && `${profile.titulo_3_nombre} (${profile.titulo_3_promedio || 'N/A'})`,
            profile.titulo_4_nombre && `${profile.titulo_4_nombre} (${profile.titulo_4_promedio || 'N/A'})`
          ].filter(Boolean).join(' • ') || 'Sin títulos';

          results.push({
            inscription_id: selection.inscription_id,
            teacher_name: `${profile.last_name}, ${profile.first_name}`,
            teacher_dni: profile.dni || 'Sin DNI',
            school_name: selection.subjects.schools.name,
            item_name: selection.subjects.name,
            item_type: 'subject',
            specialty: selection.subjects.specialty as 'ciclo_basico' | 'electromecanica' | 'construccion',
            total_score: evaluation?.total_score || null,
            evaluation_status: evaluation?.status || 'draft',
            evaluation_id: evaluation?.id || null,
            
            // Detailed evaluation scores
            titulo_score: evaluation?.titulo_score || null,
            antiguedad_titulo_score: evaluation?.antiguedad_titulo_score || null,
            antiguedad_docente_score: evaluation?.antiguedad_docente_score || null,
            concepto_score: evaluation?.concepto_score || null,
            promedio_titulo_score: evaluation?.promedio_titulo_score || null,
            trabajo_publico_score: evaluation?.trabajo_publico_score || null,
            becas_otros_score: evaluation?.becas_otros_score || null,
            concurso_score: evaluation?.concurso_score || null,
            otros_antecedentes_score: evaluation?.otros_antecedentes_score || null,
            red_federal_score: evaluation?.red_federal_score || null,
            title_type: evaluation?.title_type || null,
            
            // Additional teacher information
            teacher_email: profile.email || 'Sin email',
            teacher_titles: titles
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
          const evaluation = positionEvaluationsMap.get(selection.id);
          const profile = selection.inscriptions.profiles;
          const titles = [
            profile.titulo_1_nombre && `${profile.titulo_1_nombre} (${profile.titulo_1_promedio || 'N/A'})`,
            profile.titulo_2_nombre && `${profile.titulo_2_nombre} (${profile.titulo_2_promedio || 'N/A'})`,
            profile.titulo_3_nombre && `${profile.titulo_3_nombre} (${profile.titulo_3_promedio || 'N/A'})`,
            profile.titulo_4_nombre && `${profile.titulo_4_nombre} (${profile.titulo_4_promedio || 'N/A'})`
          ].filter(Boolean).join(' • ') || 'Sin títulos';

          results.push({
            inscription_id: selection.inscription_id,
            teacher_name: `${profile.last_name}, ${profile.first_name}`,
            teacher_dni: profile.dni || 'Sin DNI',
            school_name: selection.administrative_positions.schools.name,
            item_name: selection.administrative_positions.name,
            item_type: 'position',
            total_score: evaluation?.total_score || null,
            evaluation_status: evaluation?.status || 'draft',
            evaluation_id: evaluation?.id || null,
            
            // Detailed evaluation scores
            titulo_score: evaluation?.titulo_score || null,
            antiguedad_titulo_score: evaluation?.antiguedad_titulo_score || null,
            antiguedad_docente_score: evaluation?.antiguedad_docente_score || null,
            concepto_score: evaluation?.concepto_score || null,
            promedio_titulo_score: evaluation?.promedio_titulo_score || null,
            trabajo_publico_score: evaluation?.trabajo_publico_score || null,
            becas_otros_score: evaluation?.becas_otros_score || null,
            concurso_score: evaluation?.concurso_score || null,
            otros_antecedentes_score: evaluation?.otros_antecedentes_score || null,
            red_federal_score: evaluation?.red_federal_score || null,
            title_type: evaluation?.title_type || null,
            
            // Additional teacher information
            teacher_email: profile.email || 'Sin email',
            teacher_titles: titles
          });
        });
      }

      // Apply evaluation status filter
      const filteredResults = results.filter(item => {
        if (filters.evaluationStatus === 'all') return true;
        return item.evaluation_status === filters.evaluationStatus;
      });

      // Sort with new hierarchical structure
      const sortListingItems = (items: ListingItem[]) => {
        // First separate by item type
        const subjects = items.filter(item => item.item_type === 'subject');
        const positions = items.filter(item => item.item_type === 'position');
        
        // Sort subjects by specialty and name
        subjects.sort((a, b) => {
          // First by specialty
          const specialtyOrder = { 'ciclo_basico': 0, 'electromecanica': 1, 'construccion': 2 };
          const aSpecialty = specialtyOrder[a.specialty || 'ciclo_basico'];
          const bSpecialty = specialtyOrder[b.specialty || 'ciclo_basico'];
          
          if (aSpecialty !== bSpecialty) return aSpecialty - bSpecialty;
          
          // Then by name
          if (a.item_name !== b.item_name) return a.item_name.localeCompare(b.item_name);
          
          // Finally by evaluation status and score
          if (a.evaluation_status === 'completed' && b.evaluation_status !== 'completed') return -1;
          if (a.evaluation_status !== 'completed' && b.evaluation_status === 'completed') return 1;
          
          if (a.evaluation_status === 'completed' && b.evaluation_status === 'completed') {
            const scoreA = a.total_score || 0;
            const scoreB = b.total_score || 0;
            if (scoreA !== scoreB) return scoreB - scoreA;
          }
          
          return a.teacher_name.localeCompare(b.teacher_name);
        });
        
        // Sort positions hierarchically
        positions.sort((a, b) => {
          const hierarchyOrder = ['Director', 'Vice Director', 'Secretario', 'Pro Secretario'];
          
          const aIndex = hierarchyOrder.findIndex(title => a.item_name.toLowerCase().includes(title.toLowerCase()));
          const bIndex = hierarchyOrder.findIndex(title => b.item_name.toLowerCase().includes(title.toLowerCase()));
          
          // First by hierarchy
          if (aIndex !== -1 && bIndex !== -1) {
            if (aIndex !== bIndex) return aIndex - bIndex;
          } else if (aIndex !== -1) return -1;
          else if (bIndex !== -1) return 1;
          
          // Then by name
          if (a.item_name !== b.item_name) return a.item_name.localeCompare(b.item_name);
          
          // Finally by evaluation status and score
          if (a.evaluation_status === 'completed' && b.evaluation_status !== 'completed') return -1;
          if (a.evaluation_status !== 'completed' && b.evaluation_status === 'completed') return 1;
          
          if (a.evaluation_status === 'completed' && b.evaluation_status === 'completed') {
            const scoreA = a.total_score || 0;
            const scoreB = b.total_score || 0;
            if (scoreA !== scoreB) return scoreB - scoreA;
          }
          
          return a.teacher_name.localeCompare(b.teacher_name);
        });
        
        return [...subjects, ...positions];
      };

      setListings(sortListingItems(filteredResults));
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