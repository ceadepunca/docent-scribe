import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ExcelInscriptionData {
  LEGAJO: string;
  TÍTULO: number;
  'ANTIGÜEDAD TÍTULO': number;
  'ANTIGÜEDAD DOCEN': number; 
  CONCEPTO: number;
  'PROM.GRAL.TIT.DOCEN.': number;
  'TRAB.PUBLIC.': number;
  'BECAS Y OTROS EST.': number;
  CONCURSOS: number;
  'OTROS ANTEC. DOC.': number;
  'RED FEDERAL MAX. 3': number;
  TOTAL?: number;
}

interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

export const useImportPreviousInscriptions = () => {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const getTitleTypeFromScore = (tituloScore: number): string => {
    if (tituloScore === 9) return 'docente';
    if (tituloScore === 6) return 'habilitante';  
    if (tituloScore === 3) return 'supletorio';
    return 'docente'; // Default fallback
  };

  // Normalize values for better matching
  const normalizeValue = (value: string): string => {
    if (!value) return '';
    return value.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^\w@.-]/g, ''); // Keep alphanumeric, email chars
  };

  const normalizeNumeric = (value: string): string => {
    if (!value) return '';
    return value.toString()
      .replace(/\D/g, ''); // Keep only digits
  };

  // Enhanced teacher finding with multiple strategies
  const findTeacher = async (legajoNumber: string, profile?: any) => {
    const searches = [];

    // Strategy 1: Exact legajo match
    if (legajoNumber) {
      searches.push(
        supabase.from('profiles')
          .select('*')
          .eq('legajo_number', legajoNumber)
          .maybeSingle()
      );
    }

    // Strategy 2: Normalized legajo match
    if (legajoNumber) {
      const normalizedLegajo = normalizeNumeric(legajoNumber);
      if (normalizedLegajo !== legajoNumber) {
        searches.push(
          supabase.from('profiles')
            .select('*')
            .ilike('legajo_number', `%${normalizedLegajo}%`)
            .maybeSingle()
        );
      }
    }

    // Strategy 3: DNI match (if available in profile data)
    if (profile?.dni) {
      const normalizedDNI = normalizeNumeric(profile.dni);
      searches.push(
        supabase.from('profiles')
          .select('*')
          .eq('dni', normalizedDNI)
          .maybeSingle()
      );
    }

    // Execute all searches
    for (const search of searches) {
      try {
        const { data, error } = await search;
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Search strategy failed:', err);
      }
    }

    return null;
  };

  const checkExistingInscription = async (userId: string, periodId: string) => {
    const { data, error } = await supabase
      .from('inscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('inscription_period_id', periodId)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  const createInscription = async (teacherProfile: any, periodId: string) => {
    // Use user_id if available, otherwise use profile.id for migrated profiles
    const userId = teacherProfile.user_id || teacherProfile.id;
    
    const { data, error } = await supabase
      .from('inscriptions')
      .insert({
        user_id: userId,
        inscription_period_id: periodId,
        teaching_level: 'secundario', // Default for import
        subject_area: 'General', // Default for import
        status: 'submitted',
        experience_years: 0 // Default
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const createOrUpdateEvaluation = async (
    inscriptionId: string, 
    evaluatorId: string, 
    excelData: ExcelInscriptionData
  ) => {
    const titleType = getTitleTypeFromScore(excelData['TÍTULO']);
    const totalScore = excelData['TÍTULO'] + 
                      excelData['ANTIGÜEDAD TÍTULO'] + 
                      excelData['ANTIGÜEDAD DOCEN'] + 
                      excelData.CONCEPTO + 
                      excelData['PROM.GRAL.TIT.DOCEN.'] + 
                      excelData['TRAB.PUBLIC.'] + 
                      excelData['BECAS Y OTROS EST.'] + 
                      excelData.CONCURSOS + 
                      excelData['OTROS ANTEC. DOC.'] + 
                      excelData['RED FEDERAL MAX. 3'];

    const evaluationData = {
      inscription_id: inscriptionId,
      evaluator_id: evaluatorId,
      title_type: titleType,
      titulo_score: excelData['TÍTULO'],
      antiguedad_titulo_score: excelData['ANTIGÜEDAD TÍTULO'],
      antiguedad_docente_score: excelData['ANTIGÜEDAD DOCEN'],
      concepto_score: excelData.CONCEPTO,
      promedio_titulo_score: excelData['PROM.GRAL.TIT.DOCEN.'],
      trabajo_publico_score: excelData['TRAB.PUBLIC.'],
      becas_otros_score: excelData['BECAS Y OTROS EST.'],
      concurso_score: excelData.CONCURSOS,
      otros_antecedentes_score: excelData['OTROS ANTEC. DOC.'],
      red_federal_score: excelData['RED FEDERAL MAX. 3'],
      total_score: totalScore,
      status: 'draft', // Keep as draft for editability
      last_modified_by: evaluatorId
    };

    console.log('Creating evaluation with data:', evaluationData);

    // Check if evaluation already exists
    const { data: existingEval } = await supabase
      .from('evaluations')
      .select('id, status')
      .eq('inscription_id', inscriptionId)
      .eq('evaluator_id', evaluatorId)
      .maybeSingle();

    if (existingEval) {
      // Update existing evaluation
      const { data, error } = await supabase
        .from('evaluations')
        .update(evaluationData)
        .eq('id', existingEval.id)
        .select()
        .single();

      if (error) throw error;
      return { data, isUpdate: true };
    } else {
      // Create new evaluation
      const { data, error } = await supabase
        .from('evaluations')
        .insert(evaluationData)
        .select()
        .single();

      if (error) throw error;
      return { data, isUpdate: false };
    }
  };

  const importInscriptions = async (
    excelData: ExcelInscriptionData[], 
    periodId: string,
    onImportComplete?: () => void
  ): Promise<ImportResult> => {
    if (!user) throw new Error('Usuario no autenticado');

    setImporting(true);
    setProgress(0);

    const result: ImportResult = {
      total: excelData.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      errorDetails: []
    };

    try {
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        setProgress((i / excelData.length) * 100);

        try {
          // Find teacher using enhanced matching
          const teacher = await findTeacher(row.LEGAJO);
          
          if (!teacher) {
            result.skipped++;
            result.errorDetails.push(`Legajo ${row.LEGAJO}: Docente no encontrado (intentado: legajo exacto, normalizado)`);
            continue;
          }

          // Use profile.id for migrated profiles without user_id
          const userId = teacher.user_id || teacher.id;
          if (!userId) {
            result.skipped++;
            result.errorDetails.push(`Legajo ${row.LEGAJO}: Perfil sin identificador válido`);
            continue;
          }

          // Validate scores are within reasonable ranges
          if (row['TÍTULO'] < 0 || row['TÍTULO'] > 10 || 
              row['ANTIGÜEDAD TÍTULO'] < 0 || row['ANTIGÜEDAD TÍTULO'] > 10 ||
              row['ANTIGÜEDAD DOCEN'] < 0 || row['ANTIGÜEDAD DOCEN'] > 10) {
            result.errors++;
            result.errorDetails.push(`Legajo ${row.LEGAJO}: Puntajes fuera de rango válido`);
            continue;
          }

          // Validate title score is valid (3, 6, or 9)
          if (![3, 6, 9].includes(row['TÍTULO'])) {
            result.errors++;
            result.errorDetails.push(`Legajo ${row.LEGAJO}: Puntaje de título debe ser 3, 6 o 9 (actual: ${row['TÍTULO']})`);
            continue;
          }

          // Check if inscription already exists
          let inscription = await checkExistingInscription(userId, periodId);
          let inscriptionCreated = false;
          
          if (!inscription) {
            // Create new inscription if it doesn't exist
            inscription = await createInscription(teacher, periodId);
            inscriptionCreated = true;
          }

          // Create or update evaluation with imported scores
          console.log(`Creating evaluation for inscription ${inscription.id}, legajo: ${row.LEGAJO}`);
          const evaluationResult = await createOrUpdateEvaluation(inscription.id, user.id, row);
          console.log(`Evaluation result:`, evaluationResult);

          if (inscriptionCreated) {
            result.imported++;
          } else if (evaluationResult.isUpdate) {
            result.updated++;
          } else {
            result.imported++; // New evaluation for existing inscription
          }

        } catch (error) {
          result.errors++;
          result.errorDetails.push(
            `Legajo ${row.LEGAJO}: ${error instanceof Error ? error.message : 'Error desconocido'}`
          );
        }
      }

      setProgress(100);
      
      // Trigger callback if provided
      if (onImportComplete) {
        onImportComplete();
      }
      
    } finally {
      setImporting(false);
    }

    return result;
  };

  return {
    importing,
    progress,
    importInscriptions
  };
};