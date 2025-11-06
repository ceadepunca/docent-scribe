import { useState, useCallback, useEffect } from 'react';
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

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export const usePeriodInscriptions = () => {
  const [inscriptions, setInscriptions] = useState<PeriodInscription[]>([]);
  const [stats, setStats] = useState<PeriodStats>({ total: 0, evaluated: 0, pending: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({ 
    currentPage: 1, 
    pageSize: 50, 
    totalPages: 0, 
    totalItems: 0 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);

  const fetchPeriodStats = useCallback(async (periodId: string) => {
    try {
      // Total inscriptions
      const { count: totalCount } = await supabase
        .from('inscriptions_with_evaluation_status')
        .select('*', { count: 'exact', head: true })
        .eq('inscription_period_id', periodId);

      // Evaluated inscriptions
      const { count: evaluatedCount } = await supabase
        .from('inscriptions_with_evaluation_status')
        .select('*', { count: 'exact', head: true })
        .eq('inscription_period_id', periodId)
        .eq('status_evaluacion', 'completed');

      // Pending inscriptions
      const { count: pendingCount } = await supabase
        .from('inscriptions_with_evaluation_status')
        .select('*', { count: 'exact', head: true })
        .eq('inscription_period_id', periodId)
        .eq('status_evaluacion', 'draft');

      setStats({
        total: totalCount || 0,
        evaluated: evaluatedCount || 0,
        pending: pendingCount || 0
      });
    } catch (err) {
      console.error('Error fetching period stats:', err);
    }
  }, []);

  const fetchInscriptionsByPeriod = useCallback(async (
    periodId: string, 
    page: number = 1, 
    searchTerm: string = '',
    statusFilter: 'all' | 'evaluated' | 'pending' = 'all'
  ) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPeriodId(periodId);

      const pageSize = 50;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build base query for count
      let countQuery = supabase
        .from('inscriptions_with_evaluation_status')
        .select('*', { count: 'exact', head: true })
        .eq('inscription_period_id', periodId);

      // Build base query for data
      let dataQuery = supabase
        .from('inscriptions_with_evaluation_status')
        .select('inscription_id, user_id, first_name, last_name, dni, teaching_level, inscription_status, created_at, status_evaluacion, subject_area')
        .eq('inscription_period_id', periodId);

      // Apply search filters if searchTerm is provided
      if (searchTerm.trim()) {
        const searchPattern = `%${searchTerm.trim()}%`;
        countQuery = countQuery.or(
          `first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},dni.ilike.${searchPattern}`
        );
        dataQuery = dataQuery.or(
          `first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},dni.ilike.${searchPattern}`
        );
      }

      // Apply status filter
      if (statusFilter === 'evaluated') {
        countQuery = countQuery.eq('status_evaluacion', 'completed');
        dataQuery = dataQuery.eq('status_evaluacion', 'completed');
      } else if (statusFilter === 'pending') {
        countQuery = countQuery.eq('status_evaluacion', 'draft');
        dataQuery = dataQuery.eq('status_evaluacion', 'draft');
      }

      // Get total count with filters
      const { count: totalCount, error: countError } = await countQuery;
      if (countError) throw countError;

      const totalItems = totalCount || 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      // Fetch inscriptions with pagination and filters
      const { data: inscriptionsData, error: inscriptionsError } = await dataQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      if (inscriptionsError) throw inscriptionsError;

      // Map the view data to the expected shape
      const inscriptionsList: PeriodInscription[] = (inscriptionsData || []).map((row: any) => ({
        id: row.inscription_id,
        user_id: row.user_id,
        subject_area: row.subject_area || '',
        teaching_level: row.teaching_level,
        status: row.inscription_status,
        created_at: row.created_at,
        inscription_period_id: periodId,
        evaluation_state: row.status_evaluacion === 'completed' ? 'evaluada' : 'pendiente',
        profiles: {
          first_name: row.first_name,
          last_name: row.last_name,
          email: '',
          dni: row.dni
        }
      }));

      setInscriptions(inscriptionsList);
      setPagination({
        currentPage: page,
        pageSize,
        totalPages,
        totalItems
      });

      // Fetch global stats for the period
      await fetchPeriodStats(periodId);

    } catch (err) {
      console.error('Error fetching period inscriptions:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [fetchPeriodStats]);

  const refreshInscriptions = useCallback((searchTerm: string = '', statusFilter: 'all' | 'evaluated' | 'pending' = 'all') => {
    if (currentPeriodId) {
      fetchInscriptionsByPeriod(currentPeriodId, pagination.currentPage, searchTerm, statusFilter);
    }
  }, [currentPeriodId, pagination.currentPage, fetchInscriptionsByPeriod]);

  const goToPage = useCallback((page: number, searchTerm: string = '', statusFilter: 'all' | 'evaluated' | 'pending' = 'all') => {
    if (currentPeriodId && page >= 1 && page <= pagination.totalPages) {
      fetchInscriptionsByPeriod(currentPeriodId, page, searchTerm, statusFilter);
    }
  }, [currentPeriodId, pagination.totalPages, fetchInscriptionsByPeriod]);

  // Realtime subscription for inscriptions and evaluations
  useEffect(() => {
    if (!currentPeriodId) return;

    const channel = supabase
      .channel('inscriptions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inscriptions',
          filter: `inscription_period_id=eq.${currentPeriodId}`
        },
        () => {
          refreshInscriptions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluations'
        },
        () => {
          refreshInscriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPeriodId, refreshInscriptions]);

  return {
    inscriptions,
    stats,
    pagination,
    loading,
    error,
    fetchInscriptionsByPeriod,
    refreshInscriptions,
    goToPage
  };
};