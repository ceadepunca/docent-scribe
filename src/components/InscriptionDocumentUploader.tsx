import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Eye,
  GraduationCap,
  Award,
  FileUser,
  File
} from 'lucide-react';
import { useInscriptionDocuments } from '@/hooks/useInscriptionDocuments';

interface InscriptionDocumentUploaderProps {
  inscriptionId: string | null;
  disabled?: boolean;
}

const DOCUMENT_TYPES = {
  diplomas: {
    label: 'Títulos Académicos',
    description: 'Diplomas, certificados de grado, títulos universitarios',
    icon: GraduationCap,
    acceptedFormats: '.pdf,.jpg,.jpeg,.png',
    maxSizeMB: 10
  },
  certificates: {
    label: 'Certificados y Constancias',
    description: 'Antigüedad docente, capacitaciones, becas, trabajo público',
    icon: Award,
    acceptedFormats: '.pdf,.jpg,.jpeg,.png',
    maxSizeMB: 10
  },
  cv: {
    label: 'Curriculum Vitae',
    description: 'CV actualizado con experiencia profesional',
    icon: FileUser,
    acceptedFormats: '.pdf,.doc,.docx',
    maxSizeMB: 5
  },
  other: {
    label: 'Otros Antecedentes',
    description: 'Documentación adicional relevante para la evaluación',
    icon: File,
    acceptedFormats: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    maxSizeMB: 10
  }
};

export const InscriptionDocumentUploader: React.FC<InscriptionDocumentUploaderProps> = ({
  inscriptionId,
  disabled = false
}) => {
  const { documents, loading, error, uploadDocument, deleteDocument } = useInscriptionDocuments(inscriptionId);
  const [uploadingTypes, setUploadingTypes] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string>('');

  const validateFile = (file: File, documentType: string): boolean => {
    const config = DOCUMENT_TYPES[documentType as keyof typeof DOCUMENT_TYPES];
    
    // Check file size
    if (file.size > config.maxSizeMB * 1024 * 1024) {
      setValidationError(`El archivo excede el tamaño máximo de ${config.maxSizeMB}MB`);
      return false;
    }

    // Check file type
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.acceptedFormats.includes(fileExt)) {
      setValidationError(`Formato no válido. Formatos permitidos: ${config.acceptedFormats}`);
      return false;
    }

    return true;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setValidationError('');

    if (!inscriptionId) {
      setValidationError('Debe guardar la inscripción primero para poder subir documentos');
      return;
    }

    if (!validateFile(file, documentType)) {
      return;
    }

    setUploadingTypes(prev => new Set([...prev, documentType]));
    
    try {
      const success = await uploadDocument(file, documentType);
      if (success) {
        // Reset the file input
        event.target.value = '';
      }
    } finally {
      setUploadingTypes(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentType);
        return newSet;
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este documento?')) {
      await deleteDocument(documentId);
    }
  };

  const handleView = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show informational message when inscription is not saved yet
  const showInscriptionPendingMessage = !inscriptionId;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Documentos de Antecedentes
        </h3>
        <p className="text-sm text-muted-foreground">
          Adjunte documentación que respalde su evaluación (opcional)
        </p>
      </div>

      {showInscriptionPendingMessage && (
        <Alert>
          <AlertDescription>
            Puede seleccionar archivos ahora. Se subirán automáticamente al guardar la inscripción.
          </AlertDescription>
        </Alert>
      )}

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {Object.entries(DOCUMENT_TYPES).map(([type, config]) => {
          const Icon = config.icon;
          const typeDocuments = documents.filter(doc => doc.document_type === type);
          const isUploading = uploadingTypes.has(type);

          return (
            <Card key={type} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-5 w-5 text-primary" />
                  {config.label}
                  {typeDocuments.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {typeDocuments.length}
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Upload section */}
                {!disabled && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept={config.acceptedFormats}
                      onChange={(e) => handleFileUpload(e, type)}
                      disabled={isUploading}
                      className="flex-1"
                    />
                    {isUploading && (
                      <span className="text-sm text-muted-foreground">
                        Subiendo...
                      </span>
                    )}
                  </div>
                )}

                {/* Documents list */}
                {typeDocuments.length > 0 && (
                  <div className="space-y-2">
                    {typeDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {doc.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.uploaded_at).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(doc.file_url)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc.file_url, doc.file_name)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {!disabled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {typeDocuments.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No hay documentos adjuntos
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Formatos: {config.acceptedFormats} • Tamaño máx: {config.maxSizeMB}MB
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {documents.length > 0 && (
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-medium">{documents.length} documentos adjuntos</span>
          </p>
        </div>
      )}
    </div>
  );
};