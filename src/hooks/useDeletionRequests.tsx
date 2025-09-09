import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DeletionRequest {
  id: string;
  user_id: string;
  inscription_id: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
}

export const useDeletionRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inscription_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as DeletionRequest[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inscription_deletion_requests')
        .select(`
          *,
          inscriptions (
            id,
            teaching_level,
            subject_area,
            profiles (
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createDeletionRequest = async (inscriptionId: string, reason?: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('inscription_deletion_requests')
      .insert({
        user_id: user.id,
        inscription_id: inscriptionId,
        reason: reason || 'Solicitud de eliminación para nueva inscripción'
      })
      .select()
      .single();

    if (error) throw error;
    await fetchUserRequests();
    return data;
  };

  const respondToRequest = async (requestId: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await supabase
      .from('inscription_deletion_requests')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes
      })
      .eq('id', requestId);

    if (error) throw error;

    // Si se aprueba, eliminar la inscripción
    if (status === 'approved') {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        const { error: deleteError } = await supabase
          .from('inscriptions')
          .delete()
          .eq('id', request.inscription_id);

        if (deleteError) throw deleteError;
      }
    }

    await fetchAllRequests();
  };

  const getPendingRequestForInscription = (inscriptionId: string) => {
    return requests.find(r => 
      r.inscription_id === inscriptionId && 
      r.status === 'pending'
    );
  };

  useEffect(() => {
    if (user) {
      fetchUserRequests();
    }
  }, [user]);

  return {
    requests,
    loading,
    error,
    createDeletionRequest,
    respondToRequest,
    fetchAllRequests,
    getPendingRequestForInscription,
    refetch: fetchUserRequests
  };
};