import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailChangeRequest {
  id: string;
  user_id: string;
  current_email: string;
  new_email: string;
  reason: string | null;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
    dni: string;
  };
}

export const useEmailChangeRequests = () => {
  const [requests, setRequests] = useState<EmailChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch requests first
      const { data: requestsData, error: requestsError } = await supabase
        .from('email_change_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(requestsData.map(r => r.user_id))];

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, dni')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Could not fetch profiles:', profilesError);
      }

      // Combine data
      const combined = requestsData.map(request => ({
        ...request,
        profiles: profilesData?.find(p => p.id === request.user_id) || null
      }));

      setRequests(combined);
    } catch (error) {
      console.error('Error fetching email change requests:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes de cambio de email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string, newEmail: string, userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('approve-email-change', {
        body: { requestId, newEmail, userId }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to approve request');
      }

      toast({
        title: 'Cambio aprobado',
        description: 'El email ha sido actualizado correctamente',
      });

      await fetchRequests();
    } catch (error) {
      console.error('Error approving email change:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aprobar el cambio de email',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const rejectRequest = async (requestId: string, adminNotes: string) => {
    try {
      const { error } = await supabase
        .from('email_change_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Solicitud rechazada',
        description: 'La solicitud ha sido rechazada',
      });

      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting email change:', error);
      toast({
        title: 'Error',
        description: 'No se pudo rechazar la solicitud',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    loading,
    fetchRequests,
    approveRequest,
    rejectRequest
  };
};