import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PeriodInscription {
  id: string;
  user_id: string;
  subject_area: string;
  teaching_level: string;
  status: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    dni: string;
  } | null;
}

interface PeriodStats {
  total: number;
  evaluated: number;
  pending: number;
}

export const usePeriodInscriptions = () => {
  const [inscriptions, setInscriptions] = useState<PeriodInscription[]>([]);
  const [stats, setStats] = useState<PeriodStats>({ total: 0, evaluated: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInscriptionsByPeriod = useCallback(async (periodId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch inscriptions for the period
      const { data: inscriptionsData, error: inscriptionsError } = await supabase
        .from('inscriptions')
        .select(`
          id,
          user_id,
          subject_area,
          teaching_level,
          status,
          created_at,
          profiles:user_id (
            first_name,
            last_name,
            email,
            dni
          )
        `)
        .eq('inscription_period_id', periodId)
        .order('created_at', { ascending: false });

      if (inscriptionsError) throw inscriptionsError;

      const inscriptionsList = (inscriptionsData as any[]) || [];
      setInscriptions(inscriptionsList);

      // Calculate stats
      const total = inscriptionsList.length;
      let evaluated = 0;
      let pending = 0;

      // Count evaluations for each inscription
      for (const inscription of inscriptionsList) {
        const { data: evaluations, error: evalError } = await supabase
          .from('evaluations')
          .select('status')
          .eq('inscription_id', inscription.id);

        if (!evalError && evaluations && evaluations.length > 0) {
          const hasCompletedEvaluation = evaluations.some(evaluation => evaluation.status === 'completed');
          if (hasCompletedEvaluation) {
            evaluated++;
          } else {
            pending++;
          }
        } else {
          pending++;
        }
      }

      setStats({ total, evaluated, pending });

    } catch (err) {
      console.error('Error fetching period inscriptions:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    inscriptions,
    stats,
    loading,
    error,
    fetchInscriptionsByPeriod
  };
};