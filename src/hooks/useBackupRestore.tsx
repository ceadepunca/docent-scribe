import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BackupData {
  timestamp: string;
  version: string;
  tables: {
    profiles: any[];
    inscriptions: any[];
    evaluations: any[];
    inscription_periods: any[];
    subjects: any[];
    administrative_positions: any[];
    schools: any[];
    position_types: any[];
    inscription_subject_selections: any[];
    inscription_position_selections: any[];
    profile_documents: any[];
    inscription_documents: any[];
    user_roles: any[];
  };
}

export const useBackupRestore = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const exportBackup = async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      const totalTables = 13;
      let currentTable = 0;

      const updateProgress = () => {
        currentTable++;
        setProgress(Math.round((currentTable / totalTables) * 100));
      };

      // Fetch all data from tables
      const [
        profiles,
        inscriptions,
        evaluations,
        inscription_periods,
        subjects,
        administrative_positions,
        schools,
        position_types,
        inscription_subject_selections,
        inscription_position_selections,
        profile_documents,
        inscription_documents,
        user_roles,
      ] = await Promise.all([
        supabase.from('profiles').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('inscriptions').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('evaluations').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('inscription_periods').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('subjects').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('administrative_positions').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('schools').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('position_types').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('inscription_subject_selections').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('inscription_position_selections').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('profile_documents').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('inscription_documents').select('*').then(r => { updateProgress(); return r; }),
        supabase.from('user_roles').select('*').then(r => { updateProgress(); return r; }),
      ]);

      // Check for errors
      const errors = [
        profiles.error,
        inscriptions.error,
        evaluations.error,
        inscription_periods.error,
        subjects.error,
        administrative_positions.error,
        schools.error,
        position_types.error,
        inscription_subject_selections.error,
        inscription_position_selections.error,
        profile_documents.error,
        inscription_documents.error,
        user_roles.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error('Error al exportar algunas tablas');
      }

      const backup: BackupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        tables: {
          profiles: profiles.data || [],
          inscriptions: inscriptions.data || [],
          evaluations: evaluations.data || [],
          inscription_periods: inscription_periods.data || [],
          subjects: subjects.data || [],
          administrative_positions: administrative_positions.data || [],
          schools: schools.data || [],
          position_types: position_types.data || [],
          inscription_subject_selections: inscription_subject_selections.data || [],
          inscription_position_selections: inscription_position_selections.data || [],
          profile_documents: profile_documents.data || [],
          inscription_documents: inscription_documents.data || [],
          user_roles: user_roles.data || [],
        },
      };

      // Create and download JSON file
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.href = url;
      link.download = `backup_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Backup Exportado',
        description: `Se han exportado ${Object.values(backup.tables).reduce((acc, arr) => acc + arr.length, 0)} registros exitosamente.`,
      });
    } catch (error) {
      console.error('Error exporting backup:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar el backup. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  const importBackup = async (file: File, mode: 'replace' | 'merge' = 'merge') => {
    setIsImporting(true);
    setProgress(0);

    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);

      if (!backup.tables || !backup.timestamp) {
        throw new Error('Formato de backup inválido');
      }

      const totalTables = Object.keys(backup.tables).length;
      let currentTable = 0;

      const updateProgress = () => {
        currentTable++;
        setProgress(Math.round((currentTable / totalTables) * 100));
      };

      // If replace mode, delete existing data
      if (mode === 'replace') {
        toast({
          title: 'Limpiando datos existentes',
          description: 'Esto puede tardar unos momentos...',
        });

        // Delete in correct order (respecting foreign keys)
        await supabase.from('evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('inscription_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('profile_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('inscription_subject_selections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('inscription_position_selections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('inscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('user_roles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // Import data in correct order
      const tableOrder = [
        'profiles',
        'user_roles',
        'inscription_periods',
        'schools',
        'subjects',
        'administrative_positions',
        'position_types',
        'inscriptions',
        'inscription_subject_selections',
        'inscription_position_selections',
        'evaluations',
        'profile_documents',
        'inscription_documents',
      ] as const;

      for (const tableName of tableOrder) {
        const data = backup.tables[tableName];
        if (data && data.length > 0) {
          const { error } = await supabase
            .from(tableName)
            .upsert(data, { onConflict: 'id' });

          if (error) {
            console.error(`Error importing ${tableName}:`, error);
            throw new Error(`Error al importar tabla ${tableName}: ${error.message}`);
          }
        }
        updateProgress();
      }

      const totalRecords = Object.values(backup.tables).reduce((acc, arr) => acc + arr.length, 0);

      toast({
        title: 'Backup Restaurado',
        description: `Se han importado ${totalRecords} registros exitosamente.`,
      });

      return true;
    } catch (error) {
      console.error('Error importing backup:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo importar el backup.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  return {
    exportBackup,
    importBackup,
    isExporting,
    isImporting,
    progress,
  };
};
