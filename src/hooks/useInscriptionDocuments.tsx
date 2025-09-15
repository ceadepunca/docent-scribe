import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InscriptionDocument {
  id: string;
  inscription_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export const useInscriptionDocuments = (inscriptionId: string | null) => {
  const [documents, setDocuments] = useState<InscriptionDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!inscriptionId) {
      setDocuments([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inscription_documents')
        .select('*')
        .eq('inscription_id', inscriptionId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching inscription documents:', err);
      setError('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [inscriptionId]);

  const uploadDocument = async (
    file: File,
    documentType: string
  ): Promise<boolean> => {
    if (!inscriptionId || !user) {
      setError('No hay inscripción o usuario válido');
      return false;
    }

    try {
      setError(null);
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${inscriptionId}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('inscription-documents')  
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('inscription-documents')  
        .getPublicUrl(fileName);

      // Save document record to database
      const { error: dbError } = await supabase
        .from('inscription_documents')
        .insert({
          inscription_id: inscriptionId,
          document_type: documentType as 'diplomas' | 'certificates' | 'cv' | 'other',
          file_url: publicUrl,
          file_name: file.name,
        });

      if (dbError) throw dbError;

      // Refresh documents list
      await fetchDocuments();
      return true;
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Error al subir el documento');
      return false;
    }
  };

  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Get document info first
      const document = documents.find(doc => doc.id === documentId);
      if (!document) return false;

      // Extract file path from URL
      const url = new URL(document.file_url);
      const filePath = url.pathname.split('/').pop();

      // Delete from storage
      if (filePath) {
        await supabase.storage
          .from('inscription-documents')  
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('inscription_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      // Refresh documents list
      await fetchDocuments();
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Error al eliminar el documento');
      return false;
    }
  };

  const getDocumentsByType = (type: string) => {
    return documents.filter(doc => doc.document_type === type);
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments,
    getDocumentsByType,
  };
};