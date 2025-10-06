import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PeriodInscription {
  id: string;
  user_id: string;
  subject_area: string;
  teaching_level: string;
  status: string;
  created_at: string;
  inscription_period_id?: string;
  evaluation_state: 'evaluada' | 'pendiente';
  evaluations?: { status: string }[];
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
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);

  const fetchInscriptionsByPeriod = useCallback(async (periodId: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPeriodId(periodId);

      // Fetch inscriptions for the period with explicit join using correct foreign key
      const { data: inscriptionsData, error: inscriptionsError } = await supabase
        .from('inscriptions')
        .select(`
          id,
          user_id,
          subject_area,
          teaching_level,
          status,
          experience_years,
          created_at,
          profiles!fk_inscriptions_user_profile(
            first_name,
            last_name,
            email,
            dni,
            user_id
          )
        `)
        .eq('inscription_period_id', periodId)
        .order('created_at', { ascending: false });

      if (inscriptionsError) throw inscriptionsError;

      const inscriptionsList = (inscriptionsData as any[]) || [];
      const total = inscriptionsList.length;

      // Fetch all evaluations for these inscriptions in a single query
      let evaluated = 0;
      let pending = 0;
      const evaluationsMap = new Map<string, { status: string }[]>();

      if (inscriptionsList.length > 0) {
        const ids = inscriptionsList.map((i) => i.id);
        const { data: evaluationsData, error: evaluationsError } = await supabase
          .from('evaluations')
          .select('inscription_id, status')
          .in('inscription_id', ids);

        if (!evaluationsError && evaluationsData) {
          evaluationsData.forEach((ev) => {
            const arr = evaluationsMap.get(ev.inscription_id) || [];
            arr.push({ status: ev.status });
            evaluationsMap.set(ev.inscription_id, arr);
          });
        }
      }

      const inscriptionsWithEvaluations: PeriodInscription[] = inscriptionsList.map((inscription) => {
        const evaluations = evaluationsMap.get(inscription.id) || [];
        const hasCompleted = evaluations.some((e) => e.status === 'completed');
        const evaluation_state = hasCompleted ? 'evaluada' : 'pendiente';
        if (hasCompleted) evaluated++; else pending++;
        return { ...inscription, evaluations, evaluation_state } as PeriodInscription;
      });

      setInscriptions(inscriptionsWithEvaluations);
      setStats({ total, evaluated, pending });

    } catch (err) {
      console.error('Error fetching period inscriptions:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshInscriptions = useCallback(() => {
    if (currentPeriodId) {
      fetchInscriptionsByPeriod(currentPeriodId);
    }
  }, [currentPeriodId, fetchInscriptionsByPeriod]);

  return {
    inscriptions,
    stats,
    loading,
    error,
    fetchInscriptionsByPeriod,
    refreshInscriptions
  };
};