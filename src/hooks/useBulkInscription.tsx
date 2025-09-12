import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkInscriptionResult {
  success: boolean;
  total: number;
  created: number;
  skipped: number;
  errors: string[];
}

export const useBulkInscription = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const checkExistingInscription = async (userId: string, periodId: string) => {
    const { data } = await supabase
      .from('inscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('inscription_period_id', periodId)
      .maybeSingle();
    
    return data;
  };

  const createBulkInscriptions = async (
    teachers: any[], 
    config: any
  ): Promise<BulkInscriptionResult> => {
    setLoading(true);
    setProgress(0);

    const result: BulkInscriptionResult = {
      success: false,
      total: teachers.length,
      created: 0,
      skipped: 0,
      errors: [],
    };

    try {
      for (let i = 0; i < teachers.length; i++) {
        const teacher = teachers[i];
        
        try {
          // Use profile.id as user_id for migrated teachers
          const userId = teacher.id;

          // Check if inscription already exists
          const existingInscription = await checkExistingInscription(userId, config.inscription_period_id);
          
          if (existingInscription) {
            result.skipped++;
            result.errors.push(`${teacher.first_name} ${teacher.last_name}: Ya tiene inscripción en este período`);
            continue;
          }

          // Create inscription
          const { error } = await supabase
            .from('inscriptions')
            .insert({
              user_id: userId,
              inscription_period_id: config.inscription_period_id,
              teaching_level: config.teaching_level,
              subject_area: config.subject_area,
              experience_years: parseInt(config.experience_years) || 0,
              availability: config.availability,
              motivational_letter: config.motivational_letter,
              status: 'submitted', // Admin-created inscriptions are submitted directly
            });

          if (error) throw error;

          result.created++;
        } catch (error: any) {
          console.error(`Error creating inscription for ${teacher.first_name} ${teacher.last_name}:`, error);
          result.errors.push(`${teacher.first_name} ${teacher.last_name}: ${error.message}`);
        }

        // Update progress
        const progressPercent = ((i + 1) / teachers.length) * 100;
        setProgress(progressPercent);
      }

      result.success = result.created > 0;

      // Show result toast
      if (result.created > 0) {
        toast({
          title: 'Inscripciones Creadas',
          description: `Se crearon ${result.created} de ${result.total} inscripciones exitosamente.`,
        });
      }

      if (result.skipped > 0) {
        toast({
          title: 'Inscripciones Omitidas',
          description: `${result.skipped} inscripciones ya existían y fueron omitidas.`,
          variant: 'destructive',
        });
      }

      if (result.errors.length > 0 && result.errors.length !== result.skipped) {
        toast({
          title: 'Algunos Errores',
          description: `${result.errors.length - result.skipped} inscripciones fallaron por errores.`,
          variant: 'destructive',
        });
      }

    } catch (error: any) {
      console.error('Error in bulk inscription:', error);
      toast({
        title: 'Error',
        description: 'Error general en la inscripción masiva',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setProgress(100);
    }

    return result;
  };

  return {
    loading,
    progress,
    createBulkInscriptions,
  };
};