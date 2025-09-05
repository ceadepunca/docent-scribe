import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileDocument {
  id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export const useProfileDocuments = () => {
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching profile documents:', err);
      setError('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const getDocumentByType = (type: string) => {
    return documents.find(doc => doc.document_type === type);
  };

  const hasRequiredDNIDocuments = () => {
    const dniFrente = getDocumentByType('dni_frente');
    const dniDorso = getDocumentByType('dni_dorso');
    return dniFrente && dniDorso;
  };

  const getTituloDocuments = () => {
    return documents.filter(doc => doc.document_type === 'titulo_pdf');
  };

  const refreshDocuments = () => {
    fetchDocuments();
  };

  return {
    documents,
    loading,
    error,
    getDocumentByType,
    hasRequiredDNIDocuments,
    getTituloDocuments,
    refreshDocuments,
  };
};