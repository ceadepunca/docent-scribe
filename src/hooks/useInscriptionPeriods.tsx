import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InscriptionPeriod {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  available_levels: ('inicial' | 'primario' | 'secundario')[];
  is_active: boolean;
}

export const useInscriptionPeriods = () => {
  const queryClient = useQueryClient();

  const {
    data: periods = [],
    isLoading: loading,
    error: queryError
  } = useQuery({
    queryKey: ['inscription-periods'],
    queryFn: async (): Promise<InscriptionPeriod[]> => {
      const { data, error } = await supabase
        .from('inscription_periods')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const fetchAllPeriods = async () => {
    const { data, error } = await supabase
      .from('inscription_periods')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    
    // Update the cache with all periods
    queryClient.setQueryData(['inscription-periods-all'], data || []);
    return data || [];
  };

  const error = queryError instanceof Error ? queryError.message : null;

  const getCurrentPeriods = (): InscriptionPeriod[] => {
    const now = new Date();
    return periods.filter(period => {
      const startDate = new Date(period.start_date);
      const endDate = new Date(period.end_date);
      return now >= startDate && now <= endDate;
    });
  };

  const getPeriodForLevel = (level: 'inicial' | 'primario' | 'secundario'): InscriptionPeriod | null => {
    const currentPeriods = getCurrentPeriods();
    return currentPeriods.find(period => 
      period.available_levels.includes(level)
    ) || null;
  };

  const getAvailableLevelsForUser = (): ('inicial' | 'primario' | 'secundario')[] => {
    const allLevels: ('inicial' | 'primario' | 'secundario')[] = [];
    
    getCurrentPeriods().forEach(period => {
      period.available_levels.forEach(level => {
        if (!allLevels.includes(level)) {
          allLevels.push(level);
        }
      });
    });

    return allLevels;
  };

  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ['inscription-periods'] });
  };

  return {
    periods,
    loading,
    error,
    refetch,
    fetchAllPeriods,
    availableLevels: getAvailableLevelsForUser(),
    getCurrentPeriods,
    getPeriodForLevel,
  };
};