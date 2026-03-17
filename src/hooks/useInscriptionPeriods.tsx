import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InscriptionPeriod {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  level: string | null;
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const fetchAllPeriods = async () => {
    const { data, error } = await supabase
      .from('inscription_periods')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    
    queryClient.setQueryData(['inscription-periods-all'], data || []);
    queryClient.setQueryData(['inscription-periods'], data || []);
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
      period.level === level
    ) || null;
  };

  const getAvailableLevelsForUser = (): ('inicial' | 'primario' | 'secundario')[] => {
    const allLevels: ('inicial' | 'primario' | 'secundario')[] = [];
    
    getCurrentPeriods().forEach(period => {
      const lvl = period.level as 'inicial' | 'primario' | 'secundario' | null;
      if (lvl && !allLevels.includes(lvl)) {
        allLevels.push(lvl);
      }
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
