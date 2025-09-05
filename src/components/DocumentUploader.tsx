import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, FileText, Image, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploaderProps {
  documentType: 'dni_frente' | 'dni_dorso' | 'titulo_pdf';
  label: string;
  acceptedFormats: string;
  maxSizeMB: number;
  existingDocument?: {
    id: string;
    file_url: string;
    file_name: string;
  };
  onUploadSuccess: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documentType,
  label,
  acceptedFormats,
  maxSizeMB,
  existingDocument,
  onUploadSuccess,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const getFileIcon = () => {
    return documentType === 'titulo_pdf' ? <FileText className="h-4 w-4" /> : <Image className="h-4 w-4" />;
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `El archivo es muy grande. Máximo ${maxSizeMB}MB permitido.`;
    }

    // Check file type
    const fileType = file.type;
    if (documentType === 'titulo_pdf' && fileType !== 'application/pdf') {
      return 'Solo se permiten archivos PDF para títulos.';
    }

    if (documentType !== 'titulo_pdf' && !fileType.startsWith('image/')) {
      return 'Solo se permiten imágenes para documentos de DNI.';
    }

    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setError(null);
    
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);

    try {
      // Create file path with user ID and timestamp for uniqueness
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${timestamp}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile-documents')
        .getPublicUrl(fileName);

      // Save document info to database (this will replace existing document if any)
      const { error: dbError } = await supabase
        .from('profile_documents')
        .upsert({
          user_id: user.id,
          document_type: documentType,
          file_url: urlData.publicUrl,
          file_name: file.name,
        });

      if (dbError) throw dbError;

      // If there was an existing document, delete the old file from storage
      if (existingDocument) {
        const oldFileName = existingDocument.file_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('profile-documents')
            .remove([`${user.id}/${oldFileName}`]);
        }
      }

      toast({
        title: "Documento subido exitosamente",
        description: `${label} ha sido actualizado.`,
      });

      onUploadSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Error al subir el documento. Intente nuevamente.');
      toast({
        title: "Error",
        description: "No se pudo subir el documento.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingDocument || !user) return;

    setUploading(true);

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('profile_documents')
        .delete()
        .eq('id', existingDocument.id);

      if (dbError) throw dbError;

      // Delete file from storage
      const fileName = existingDocument.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('profile-documents')
          .remove([`${user.id}/${fileName}`]);
      }

      toast({
        title: "Documento eliminado",
        description: `${label} ha sido eliminado.`,
      });

      onUploadSuccess();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              {getFileIcon()}
              {label}
            </Label>
            {existingDocument && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {existingDocument ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                <span className="text-sm text-green-800 truncate">
                  {existingDocument.file_name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={uploading}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                type="file"
                accept={acceptedFormats}
                onChange={handleFileUpload}
                disabled={uploading}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Seleccione un nuevo archivo para reemplazar el actual
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Haga clic para subir</span> o arrastre el archivo
                    </p>
                    <p className="text-xs text-gray-500">
                      {acceptedFormats.toUpperCase()} (máx. {maxSizeMB}MB)
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept={acceptedFormats}
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {uploading && (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm">Subiendo...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};