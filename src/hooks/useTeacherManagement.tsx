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
  'NRO DE LEGAJO': string;
  'APELLIDO': string;
  'NOMBRES': string;
  'Nº DE DOCUMENTO': string;
  'TELEFONO CELULAR': string;
  'MAIL': string;
  'TITULO 1': string;
  'FECHA DE EGRESO': string;
  'PROMEDIO GRAL': string;
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

  const importTeachersFromExcel = useCallback(async (excelData: ExcelTeacher[]): Promise<{ imported: number; errors: number }> => {
    let imported = 0;
    let errors = 0;
    const adminDNI = '21325214';

    try {
      for (const row of excelData) {
        const cleanDNI = row['Nº DE DOCUMENTO']?.replace(/\./g, '');
        
        // Skip admin DNI
        if (cleanDNI === adminDNI) continue;

        // Skip if required fields are missing
        if (!row['APELLIDO'] || !row['NOMBRES'] || !cleanDNI || !row['MAIL']) {
          errors++;
          continue;
        }

        // Check if teacher already exists
        const existing = await searchTeacherByDNI(cleanDNI);
        if (existing) continue; // Skip existing teachers

        const teacherData = {
          first_name: row['NOMBRES'],
          last_name: row['APELLIDO'],
          email: row['MAIL'],
          dni: cleanDNI,
          phone: row['TELEFONO CELULAR'] || null,
          legajo_number: row['NRO DE LEGAJO'] || null,
          titulo_1_nombre: row['TITULO 1'] || null,
          titulo_1_fecha_egreso: row['FECHA DE EGRESO'] ? new Date(row['FECHA DE EGRESO']).toISOString().split('T')[0] : null,
          titulo_1_promedio: row['PROMEDIO GRAL'] ? parseFloat(row['PROMEDIO GRAL']) : null,
          migrated: true,
        };

        const created = await createTeacher(teacherData);
        if (created) {
          imported++;
        } else {
          errors++;
        }
      }

      toast({
        title: 'Importación completada',
        description: `${imported} docentes importados, ${errors} errores`,
      });

      return { imported, errors };
    } catch (error) {
      console.error('Error importing teachers:', error);
      toast({
        title: 'Error en importación',
        description: 'No se pudo completar la importación',
        variant: 'destructive',
      });
      return { imported, errors: excelData.length };
    }
  }, [searchTeacherByDNI, createTeacher, toast]);

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