import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoogleFormsCSVRow {
  dni: string;
  email: string;
  nombre: string;
  apellido: string;
  materias?: string[];
  [key: string]: any;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  teachersCreated: number;
  teachersSkipped: number;
  inscriptionsCreated: number;
  inscriptionsSkipped: number;
  errors: string[];
}

export const useGoogleFormsImport = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const normalizeValue = (value: string): string => {
    return value?.toString().trim().toLowerCase().replace(/\s+/g, ' ') || '';
  };

  const normalizeDNI = (dni: string): string => {
    return dni?.toString().replace(/[^\d]/g, '') || '';
  };

  const parseCSVData = (csvText: string): GoogleFormsCSVRow[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: GoogleFormsCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      // Map specific columns based on the provided format
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        if (header === 'email') {
          row.email = value;
        } else if (header === 'DNI') {
          row.dni = normalizeDNI(value);
        } else if (header === 'APELLIDO Y NOMBRES') {
          // Parse combined last name and first name
          const parts = value.split(',').map(p => p.trim());
          if (parts.length >= 2) {
            row.apellido = parts[0];
            row.nombre = parts[1];
          } else {
            // If no comma, try to split by space and assume last word is first name
            const words = value.split(' ').filter(w => w);
            if (words.length >= 2) {
              row.nombre = words.pop();
              row.apellido = words.join(' ');
            } else {
              row.apellido = value;
              row.nombre = '';
            }
          }
        } else if (header === 'DOMICILIO') {
          row.domicilio = value;
        } else if (header === 'telefono') {
          row.telefono = value;
        } else if (header.startsWith('Materia ')) {
          if (!row.materias) row.materias = [];
          if (value) row.materias.push(value);
        } else if (header.startsWith('Cargo ')) {
          if (!row.cargos) row.cargos = [];
          if (value) row.cargos.push(value);
        } else {
          row[header] = value;
        }
      });

      if (row.dni && row.email && (row.nombre || row.apellido)) {
        rows.push(row);
      }
    }

    return rows;
  };

  const findTeacherByDNI = async (dni: string) => {
    const normalizedDNI = normalizeDNI(dni);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('dni', normalizedDNI)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  };

  const createTeacher = async (csvRow: GoogleFormsCSVRow) => {
    // Generate a UUID for the profile
    const profileId = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: profileId,
        email: csvRow.email.toLowerCase(),
        first_name: csvRow.nombre,
        last_name: csvRow.apellido,
        dni: normalizeDNI(csvRow.dni),
        migrated: true,
        data_complete: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const checkExistingInscription = async (userId: string, periodId: string) => {
    const { data } = await supabase
      .from('inscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('inscription_period_id', periodId)
      .maybeSingle();

    return data;
  };

  const createInscription = async (teacherId: string, periodId: string) => {
    const { data, error } = await supabase
      .from('inscriptions')
      .insert({
        user_id: teacherId,
        inscription_period_id: periodId,
        teaching_level: 'secundario',
        subject_area: 'General',
        experience_years: 0,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const findSubjectsByNames = async (subjectNames: string[]) => {
    if (!subjectNames.length) return [];

    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .in('name', subjectNames)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  };

  const createSubjectSelections = async (inscriptionId: string, subjectIds: string[]) => {
    if (!subjectIds.length) return;

    const selections = subjectIds.map(subjectId => ({
      inscription_id: inscriptionId,
      subject_id: subjectId,
      position_type: 'titular'
    }));

    const { error } = await supabase
      .from('inscription_subject_selections')
      .insert(selections);

    if (error) throw error;
  };


  const importFromGoogleForms = async (
    csvFile: File, 
    periodId: string,
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> => {
    setImporting(true);
    setProgress(0);

    const result: ImportResult = {
      success: false,
      totalRows: 0,
      teachersCreated: 0,
      teachersSkipped: 0,
      inscriptionsCreated: 0,
      inscriptionsSkipped: 0,
      errors: []
    };

    try {
      // Read and parse CSV
      const csvText = await csvFile.text();
      const csvData = parseCSVData(csvText);
      result.totalRows = csvData.length;

      if (csvData.length === 0) {
        result.errors.push('No se encontraron datos válidos en el archivo CSV');
        return result;
      }

      // Process each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const currentProgress = Math.round(((i + 1) / csvData.length) * 100);
        setProgress(currentProgress);
        onProgress?.(currentProgress);

        try {
          // Check if teacher exists
          let teacher = await findTeacherByDNI(row.dni);
          
          if (!teacher) {
            // Create new teacher
            teacher = await createTeacher(row);
            result.teachersCreated++;
          } else {
            result.teachersSkipped++;
          }

          // Check if inscription already exists for this period
          const existingInscription = await checkExistingInscription(teacher.id, periodId);
          
          if (existingInscription) {
            result.inscriptionsSkipped++;
            continue;
          }

          // Create inscription
          const inscription = await createInscription(teacher.id, periodId);
          result.inscriptionsCreated++;

          // Process subjects if provided
          if (row.materias && Array.isArray(row.materias) && row.materias.length > 0) {
            try {
              // Filter out empty values and trim
              const subjectNames = row.materias
                .filter(materia => materia && materia.trim())
                .map(materia => materia.trim());

              if (subjectNames.length > 0) {
                const subjects = await findSubjectsByNames(subjectNames);
                const foundSubjectIds = subjects.map(s => s.id);
                
                if (foundSubjectIds.length > 0) {
                  await createSubjectSelections(inscription.id, foundSubjectIds);
                }

                // Log subjects not found
                const foundSubjectNames = subjects.map(s => s.name);
                const notFoundSubjects = subjectNames.filter(name => 
                  !foundSubjectNames.some(foundName => 
                    normalizeValue(foundName) === normalizeValue(name)
                  )
                );
                
                if (notFoundSubjects.length > 0) {
                  result.errors.push(
                    `Docente ${row.nombre} ${row.apellido}: materias no encontradas: ${notFoundSubjects.join(', ')}`
                  );
                }
              }
            } catch (subjectError: any) {
              result.errors.push(
                `Error procesando materias para ${row.nombre} ${row.apellido}: ${subjectError.message}`
              );
            }
          }

        } catch (error: any) {
          result.errors.push(
            `Error procesando fila ${i + 1} (${row.nombre} ${row.apellido}): ${error.message}`
          );
        }
      }

      result.success = result.inscriptionsCreated > 0 || result.teachersCreated > 0;

      toast({
        title: result.success ? 'Importación completada' : 'Importación con errores',
        description: `${result.teachersCreated} docentes creados, ${result.inscriptionsCreated} inscripciones creadas`,
        variant: result.success ? 'default' : 'destructive'
      });

    } catch (error: any) {
      result.errors.push(`Error general: ${error.message}`);
      toast({
        title: 'Error en importación',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }

    return result;
  };

  return {
    importing,
    progress,
    importFromGoogleForms
  };
};