import { useState, useEffect } from 'react';
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
  const [periods, setPeriods] = useState<InscriptionPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivePeriods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inscription_periods')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setPeriods(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPeriods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inscription_periods')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPeriods(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivePeriods();
  }, []);

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

  return {
    periods,
    loading,
    error,
    refetch: fetchActivePeriods,
    fetchAllPeriods,
    availableLevels: getAvailableLevelsForUser(),
    getCurrentPeriods,
    getPeriodForLevel,
  };
};