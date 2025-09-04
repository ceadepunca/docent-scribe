import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PositionType {
  id: string;
  code: string;
  name: string;
  teaching_level: 'inicial' | 'primario' | 'secundario';
}

export const usePositionTypes = (teachingLevel?: 'inicial' | 'primario' | 'secundario') => {
  const [positionTypes, setPositionTypes] = useState<PositionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositionTypes = async () => {
    try {
      setLoading(true);
      let query = supabase.from('position_types').select('*');
      
      if (teachingLevel) {
        query = query.eq('teaching_level', teachingLevel);
      }
      
      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      setPositionTypes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositionTypes();
  }, [teachingLevel]);

  return {
    positionTypes,
    loading,
    error,
    refetch: fetchPositionTypes,
  };
};