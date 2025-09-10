import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ExcelInscriptionData {
  NRO_LEGAJO: string;
  TITULO: number;
  ANTIGUEDAD_TITULO: number;
  ANTIGUEDAD_DOCENTE: number; 
  CONCEPTO: number;
  PROMEDIO_TITULO: number;
  TRABAJO_PUBLICO: number;
  BECAS_OTROS: number;
  CONCURSO: number;
  OTROS_ANTECEDENTES: number;
  RED_FEDERAL: number;
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
    const titleType = getTitleTypeFromScore(excelData.TITULO);
    const totalScore = excelData.TITULO + excelData.ANTIGUEDAD_TITULO + excelData.ANTIGUEDAD_DOCENTE + 
                      excelData.CONCEPTO + excelData.PROMEDIO_TITULO + excelData.TRABAJO_PUBLICO + 
                      excelData.BECAS_OTROS + excelData.CONCURSO + excelData.OTROS_ANTECEDENTES + 
                      excelData.RED_FEDERAL;

    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        inscription_id: inscriptionId,
        evaluator_id: evaluatorId,
        title_type: titleType,
        titulo_score: excelData.TITULO,
        antiguedad_titulo_score: excelData.ANTIGUEDAD_TITULO,
        antiguedad_docente_score: excelData.ANTIGUEDAD_DOCENTE,
        concepto_score: excelData.CONCEPTO,
        promedio_titulo_score: excelData.PROMEDIO_TITULO,
        trabajo_publico_score: excelData.TRABAJO_PUBLICO,
        becas_otros_score: excelData.BECAS_OTROS,
        concurso_score: excelData.CONCURSO,
        otros_antecedentes_score: excelData.OTROS_ANTECEDENTES,
        red_federal_score: excelData.RED_FEDERAL,
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
          const teacher = await findTeacherByLegajo(row.NRO_LEGAJO);
          
          if (!teacher) {
            result.skipped++;
            result.errorDetails.push(`Legajo ${row.NRO_LEGAJO}: Docente no encontrado`);
            continue;
          }

          if (!teacher.user_id) {
            result.skipped++;
            result.errorDetails.push(`Legajo ${row.NRO_LEGAJO}: Perfil sin usuario asociado`);
            continue;
          }

          // Check if inscription already exists
          const existingInscription = await checkExistingInscription(teacher.user_id, periodId);
          
          if (existingInscription) {
            result.skipped++;
            result.errorDetails.push(`Legajo ${row.NRO_LEGAJO}: Ya tiene inscripción en este período`);
            continue;
          }

          // Validate scores are within reasonable ranges
          if (row.TITULO < 0 || row.TITULO > 10 || 
              row.ANTIGUEDAD_TITULO < 0 || row.ANTIGUEDAD_TITULO > 10 ||
              row.ANTIGUEDAD_DOCENTE < 0 || row.ANTIGUEDAD_DOCENTE > 10) {
            result.errors++;
            result.errorDetails.push(`Legajo ${row.NRO_LEGAJO}: Puntajes fuera de rango válido`);
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
            `Legajo ${row.NRO_LEGAJO}: ${error instanceof Error ? error.message : 'Error desconocido'}`
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