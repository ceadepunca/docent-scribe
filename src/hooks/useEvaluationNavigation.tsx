import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface InscriptionItem {
  id: string;
  user_id: string;
  teaching_level: string;
  inscription_period_id: string;
  evaluation_state: 'evaluada' | 'no_evaluada';
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    dni?: string;
  } | null;
  inscription_periods?: {
    name: string;
  };
}

export const useEvaluationNavigation = (currentInscriptionId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inscriptions, setInscriptions] = useState<InscriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);
  
  // Get context from URL params
  const periodId = searchParams.get('period');
  const fromEvaluations = searchParams.get('from') === 'evaluations';
  const levelFilter = searchParams.get('level');
  const statusFilter = searchParams.get('status');

  // Function to get period from current inscription
  const fetchCurrentInscriptionPeriod = useCallback(async (inscriptionId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('inscriptions')
        .select('inscription_period_id, teaching_level')
        .eq('id', inscriptionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching current inscription period:', error);
      return null;
    }
  }, [user]);

  const fetchPeriodInscriptions = useCallback(async (
    periodId: string, 
    level?: string, 
    status?: string
  ) => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all inscriptions for the period
      let query = supabase
        .from('inscriptions')
        .select(`
          id,
          user_id,
          teaching_level,
          inscription_period_id,
          inscription_periods!inner(
            name
          )
        `)
        .eq('inscription_period_id', periodId)
        .in('status', ['submitted', 'under_review', 'approved', 'rejected', 'requires_changes'])
        .order('created_at', { ascending: false });

      if (level && level !== 'all') {
        query = query.eq('teaching_level', level as 'inicial' | 'primario' | 'secundario');
      }

      const { data: inscriptionsData, error: inscriptionsError } = await query;
      if (inscriptionsError) throw inscriptionsError;

      if (!inscriptionsData || inscriptionsData.length === 0) {
        setInscriptions([]);
        return;
      }

      // Get evaluations for these inscriptions
      const inscriptionIds = inscriptionsData.map(i => i.id);
      const { data: evaluationsData, error: evalError } = await supabase
        .from('evaluations')
        .select('inscription_id')
        .in('inscription_id', inscriptionIds);

      if (evalError) throw evalError;

      const evaluationMap = new Set(evaluationsData?.map(e => e.inscription_id) || []);

      // Get user profiles
      const userIds = [...new Set(inscriptionsData.map(i => i.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, dni')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      // Combine data and apply status filter
      let processedInscriptions = inscriptionsData.map(inscription => ({
        ...inscription,
        evaluation_state: evaluationMap.has(inscription.id) ? 'evaluada' as const : 'no_evaluada' as const,
        profiles: profilesMap.get(inscription.user_id) || null
      }));

      if (status && status !== 'all') {
        processedInscriptions = processedInscriptions.filter(
          i => i.evaluation_state === status
        );
      }

      // Deduplicate: keep most recent per user/level
      const userLevelMap = new Map<string, InscriptionItem>();
      processedInscriptions.forEach(inscription => {
        const key = `${inscription.user_id}-${inscription.teaching_level}`;
        const existing = userLevelMap.get(key);
        
        if (!existing) {
          userLevelMap.set(key, inscription);
        }
      });

      const finalInscriptions = Array.from(userLevelMap.values());
      setInscriptions(finalInscriptions);

      // Find current inscription index
      const index = finalInscriptions.findIndex(i => i.id === currentInscriptionId);
      setCurrentIndex(index);

    } catch (error) {
      console.error('Error fetching period inscriptions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las inscripciones del período',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, currentInscriptionId, toast]);

  // Load inscriptions based on period context
  useEffect(() => {
    const loadInscriptionsForPeriod = async () => {
      if (periodId && fromEvaluations) {
        // Case 1: Explicit period from evaluations page
        setCurrentPeriodId(periodId);
        await fetchPeriodInscriptions(periodId, levelFilter || undefined, statusFilter || undefined);
      } else if (currentInscriptionId && !periodId) {
        // Case 2: Auto-detect period from current inscription
        const inscriptionData = await fetchCurrentInscriptionPeriod(currentInscriptionId);
        if (inscriptionData?.inscription_period_id) {
          setCurrentPeriodId(inscriptionData.inscription_period_id);
          await fetchPeriodInscriptions(
            inscriptionData.inscription_period_id, 
            inscriptionData.teaching_level || undefined
          );
        }
      } else if (periodId && !fromEvaluations) {
        // Case 3: Explicit period but not from evaluations
        setCurrentPeriodId(periodId);
        await fetchPeriodInscriptions(periodId, levelFilter || undefined, statusFilter || undefined);
      }
    };

    loadInscriptionsForPeriod();
  }, [periodId, fromEvaluations, levelFilter, statusFilter, currentInscriptionId, fetchPeriodInscriptions, fetchCurrentInscriptionPeriod]);

  const navigateToInscription = useCallback((targetId: string) => {
    const params = new URLSearchParams(searchParams);
    // Keep current context while navigating (client-side)
    navigate(`/inscriptions/${targetId}?${params.toString()}`);
  }, [searchParams, navigate]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const targetId = inscriptions[currentIndex - 1].id;
      navigateToInscription(targetId);
    }
  }, [currentIndex, inscriptions, navigateToInscription]);

  const goToNext = useCallback(() => {
    if (currentIndex < inscriptions.length - 1) {
      const targetId = inscriptions[currentIndex + 1].id;
      navigateToInscription(targetId);
    }
  }, [currentIndex, inscriptions, navigateToInscription]);

  const goToNextUnevaluated = useCallback(() => {
    const unevaluatedFromCurrent = inscriptions
      .slice(currentIndex + 1)
      .find(i => i.evaluation_state === 'no_evaluada');
    
    if (unevaluatedFromCurrent) {
      navigateToInscription(unevaluatedFromCurrent.id);
    } else {
      // Look from beginning
      const unevaluatedFromStart = inscriptions
        .find(i => i.evaluation_state === 'no_evaluada');
      
      if (unevaluatedFromStart) {
        navigateToInscription(unevaluatedFromStart.id);
      } else {
        toast({
          title: 'Sin pendientes',
          description: 'No hay más inscripciones sin evaluar en este período',
        });
      }
    }
  }, [currentIndex, inscriptions, navigateToInscription, toast]);

  const backToEvaluations = useCallback(() => {
    const params = new URLSearchParams();
    const activePeriodId = currentPeriodId || periodId;
    if (activePeriodId) params.set('period', activePeriodId);
    if (levelFilter) params.set('level', levelFilter);
    if (statusFilter) params.set('status', statusFilter);
    
    const queryString = params.toString();
    navigate(`/evaluations${queryString ? `?${queryString}` : ''}`);
  }, [currentPeriodId, periodId, levelFilter, statusFilter, navigate]);

  return {
    // State
    inscriptions,
    currentIndex,
    loading,
    
    // Context info
    hasEvaluationContext: !!(currentPeriodId || periodId),
    periodId: currentPeriodId || periodId,
    currentPeriodName: inscriptions[currentIndex]?.inscription_periods?.name,
    
    // Navigation
    canGoToPrevious: currentIndex > 0,
    canGoToNext: currentIndex < inscriptions.length - 1,
    goToPrevious,
    goToNext,
    goToNextUnevaluated,
    navigateToInscription,
    backToEvaluations,
    
    // Stats
    totalInscriptions: inscriptions.length,
    currentPosition: currentIndex + 1,
    unevaluatedCount: inscriptions.filter(i => i.evaluation_state === 'no_evaluada').length,
    evaluatedCount: inscriptions.filter(i => i.evaluation_state === 'evaluada').length,
  };
};
