import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeacherProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  dni?: string;
  phone?: string;
  legajo_number?: string;
  migrated: boolean;
  data_complete: boolean;
  titulo_1_nombre?: string;
  titulo_1_fecha_egreso?: string;
  titulo_1_promedio?: number;
  user_id?: string;
}

interface ExcelTeacher {
  'Nº DE LEGAJO': string;
  'APELLIDO': string;
  'NOMBRES': string;
  'Nº DE DOCUMENTO': string;
  'TELEFONO CELULAR': string;
  'MAIL': string;
  'TITULO 1': string;
  'FECHA DE EGRESO': string;
  'PROMEDIO GRAL': string;
}

interface ImportOptions {
  overwriteExisting?: boolean;
  batchSize?: number;
  onProgress?: (current: number, total: number) => void;
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

export const useTeacherManagement = () => {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los docentes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const searchTeacherByDNI = useCallback(async (dni: string): Promise<TeacherProfile | null> => {
    try {
      const cleanDNI = dni.replace(/\./g, '');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('dni', cleanDNI)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching teacher by DNI:', error);
      return null;
    }
  }, []);

  const createTeacher = useCallback(async (teacherData: Partial<TeacherProfile>): Promise<TeacherProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          first_name: teacherData.first_name,
          last_name: teacherData.last_name,
          email: teacherData.email,
          dni: teacherData.dni?.replace(/\./g, ''),
          phone: teacherData.phone,
          legajo_number: teacherData.legajo_number,
          titulo_1_nombre: teacherData.titulo_1_nombre,
          titulo_1_fecha_egreso: teacherData.titulo_1_fecha_egreso,
          titulo_1_promedio: teacherData.titulo_1_promedio,
          migrated: teacherData.migrated || false,
          data_complete: true,
          user_id: teacherData.user_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Docente creado',
        description: `Se creó el perfil de ${teacherData.first_name} ${teacherData.last_name}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      if (error.code === '23505') {
        toast({
          title: 'Error',
          description: 'Ya existe un docente con ese DNI',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo crear el docente',
          variant: 'destructive',
        });
      }
      return null;
    }
  }, [toast]);

  const updateTeacher = useCallback(async (id: string, updates: Partial<TeacherProfile>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Docente actualizado',
        description: 'Los datos del docente han sido actualizados',
      });

      return true;
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el docente',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Helper function to normalize column headers
  const normalizeHeaders = useCallback((data: any[]): ExcelTeacher[] => {
    return data.map(row => {
      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.trim().toUpperCase();
        if (normalizedKey.includes('LEGAJO')) {
          normalizedRow['Nº DE LEGAJO'] = row[key];
        } else if (normalizedKey === 'APELLIDO' || normalizedKey === 'APELLIDOS') {
          normalizedRow['APELLIDO'] = row[key];
        } else if (normalizedKey === 'NOMBRES' || normalizedKey === 'NOMBRE') {
          normalizedRow['NOMBRES'] = row[key];
        } else if (normalizedKey.includes('DOCUMENTO') || normalizedKey === 'DNI') {
          normalizedRow['Nº DE DOCUMENTO'] = row[key];
        } else if (normalizedKey.includes('TELEFONO') || normalizedKey.includes('CELULAR')) {
          normalizedRow['TELEFONO CELULAR'] = row[key];
        } else if (normalizedKey === 'MAIL' || normalizedKey === 'EMAIL') {
          normalizedRow['MAIL'] = row[key];
        } else if (normalizedKey.includes('TITULO')) {
          normalizedRow['TITULO 1'] = row[key];
        } else if (normalizedKey.includes('EGRESO') || normalizedKey.includes('FECHA')) {
          normalizedRow['FECHA DE EGRESO'] = row[key];
        } else if (normalizedKey.includes('PROMEDIO')) {
          normalizedRow['PROMEDIO GRAL'] = row[key];
        }
      });
      return normalizedRow as ExcelTeacher;
    });
  }, []);

  const importTeachersFromExcel = useCallback(async (
    excelData: any[], 
    options: ImportOptions = {}
  ): Promise<ImportResult> => {
    const { overwriteExisting = false, batchSize = 10, onProgress } = options;
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    const adminDNI = '21325214';

    try {
      const normalizedData = normalizeHeaders(excelData);
      const total = normalizedData.length;

      // Process in batches for better performance
      for (let i = 0; i < normalizedData.length; i += batchSize) {
        const batch = normalizedData.slice(i, i + batchSize);
        
        for (const row of batch) {
          try {
            const cleanDNI = row['Nº DE DOCUMENTO']?.toString().replace(/\./g, '');
            
            // Skip admin DNI
            if (cleanDNI === adminDNI) {
              skipped++;
              continue;
            }

            // Skip if required fields are missing
            if (!row['APELLIDO'] || !row['NOMBRES'] || !cleanDNI || !row['MAIL']) {
              errors++;
              errorDetails.push(`Fila ${i + batch.indexOf(row) + 2}: Campos requeridos faltantes`);
              continue;
            }

            // Check if teacher already exists
            const existing = await searchTeacherByDNI(cleanDNI);
            
            const teacherData = {
              first_name: row['NOMBRES'],
              last_name: row['APELLIDO'],
              email: row['MAIL'],
              dni: cleanDNI,
              phone: row['TELEFONO CELULAR'] || null,
              legajo_number: row['Nº DE LEGAJO'] || null,
              titulo_1_nombre: row['TITULO 1'] || null,
              titulo_1_fecha_egreso: row['FECHA DE EGRESO'] ? 
                new Date(row['FECHA DE EGRESO']).toISOString().split('T')[0] : null,
              titulo_1_promedio: row['PROMEDIO GRAL'] ? 
                parseFloat(row['PROMEDIO GRAL'].toString()) : null,
              migrated: true,
            };

            if (existing && overwriteExisting) {
              // Update existing teacher
              const success = await updateTeacher(existing.id, teacherData);
              if (success) {
                updated++;
              } else {
                errors++;
                errorDetails.push(`Error actualizando: ${teacherData.first_name} ${teacherData.last_name}`);
              }
            } else if (existing && !overwriteExisting) {
              // Skip existing teacher
              skipped++;
            } else {
              // Create new teacher
              const created = await createTeacher(teacherData);
              if (created) {
                imported++;
              } else {
                errors++;
                errorDetails.push(`Error creando: ${teacherData.first_name} ${teacherData.last_name}`);
              }
            }
          } catch (rowError) {
            errors++;
            errorDetails.push(`Error procesando fila ${i + batch.indexOf(row) + 2}: ${rowError}`);
          }
        }

        // Report progress
        if (onProgress) {
          onProgress(Math.min(i + batchSize, total), total);
        }

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const resultMessage = overwriteExisting 
        ? `${imported} nuevos, ${updated} actualizados, ${skipped} omitidos, ${errors} errores`
        : `${imported} importados, ${skipped} omitidos, ${errors} errores`;

      toast({
        title: 'Importación completada',
        description: resultMessage,
        variant: errors > 0 ? 'destructive' : 'default',
      });

      return { imported, updated, skipped, errors, errorDetails };
    } catch (error) {
      console.error('Error importing teachers:', error);
      toast({
        title: 'Error en importación',
        description: 'No se pudo completar la importación',
        variant: 'destructive',
      });
      return { imported, updated, skipped, errors: excelData.length, errorDetails: [error as string] };
    }
  }, [searchTeacherByDNI, createTeacher, updateTeacher, normalizeHeaders, toast]);

  const getTeacherStats = useCallback(() => {
    const registered = teachers.filter(t => t.user_id && t.data_complete).length;
    const migrated = teachers.filter(t => !t.user_id && t.migrated && t.data_complete).length;
    const incomplete = teachers.filter(t => !t.data_complete).length;

    return { registered, migrated, incomplete, total: teachers.length };
  }, [teachers]);

  return {
    teachers,
    loading,
    fetchTeachers,
    searchTeacherByDNI,
    createTeacher,
    updateTeacher,
    importTeachersFromExcel,
    getTeacherStats,
  };
};