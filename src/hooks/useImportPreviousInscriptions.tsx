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

  const findTeacherByLegajo = async (legajoNumber: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('legajo_number', legajoNumber)
      .maybeSingle();

    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('inscriptions')
      .insert({
        user_id: teacherProfile.user_id,
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

  const createEvaluation = async (
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

    const { data, error } = await supabase
      .from('evaluations')
      .insert({
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
        status: 'completed'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const importInscriptions = async (
    excelData: ExcelInscriptionData[], 
    periodId: string
  ): Promise<ImportResult> => {
    if (!user) throw new Error('Usuario no autenticado');

    setImporting(true);
    setProgress(0);

    const result: ImportResult = {
      total: excelData.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      errorDetails: []
    };

    try {
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        setProgress((i / excelData.length) * 100);

        try {
          // Find teacher by legajo number
          const teacher = await findTeacherByLegajo(row.LEGAJO);
          
          if (!teacher) {
            result.skipped++;
            result.errorDetails.push(`Legajo ${row.LEGAJO}: Docente no encontrado`);
            continue;
          }

          if (!teacher.user_id) {
            result.skipped++;
            result.errorDetails.push(`Legajo ${row.LEGAJO}: Perfil sin usuario asociado`);
            continue;
          }

          // Check if inscription already exists
          const existingInscription = await checkExistingInscription(teacher.user_id, periodId);
          
          if (existingInscription) {
            result.skipped++;
            result.errorDetails.push(`Legajo ${row.LEGAJO}: Ya tiene inscripción en este período`);
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

          // Create inscription
          const inscription = await createInscription(teacher, periodId);

          // Create evaluation with imported scores
          await createEvaluation(inscription.id, user.id, row);

          result.imported++;

        } catch (error) {
          result.errors++;
          result.errorDetails.push(
            `Legajo ${row.LEGAJO}: ${error instanceof Error ? error.message : 'Error desconocido'}`
          );
        }
      }

      setProgress(100);
      
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