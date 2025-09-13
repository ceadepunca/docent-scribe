import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Download, FileText, Image, X } from 'lucide-react';

interface DocumentViewerProps {
  documents: Array<{
    id: string;
    document_type: string;
    file_url: string;
    file_name: string;
    uploaded_at: string;
  }>;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ documents }) => {
  const [selectedDocument, setSelectedDocument] = useState<{url: string, name: string, type: string} | null>(null);

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'dni_frente':
        return 'DNI - Frente';
      case 'dni_dorso':
        return 'DNI - Dorso';
      case 'titulo_pdf':
        return 'Título Académico';
      default:
        return type;
    }
  };

  const getDocumentIcon = (type: string) => {
    return type === 'titulo_pdf' ? <FileText className="h-4 w-4" /> : <Image className="h-4 w-4" />;
  };

  const handleView = (fileUrl: string, fileName: string, fileType: string) => {
    setSelectedDocument({ url: fileUrl, name: fileName, type: fileType });
  };

  const handleViewExternal = (fileUrl: string) => {
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

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No hay documentos subidos aún.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Documentos Subidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-3">
                {getDocumentIcon(doc.document_type)}
                <div>
                  <p className="text-sm font-medium">
                    {getDocumentTypeLabel(doc.document_type)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-48">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Subido: {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(doc.file_url, doc.file_name, doc.document_type)}
                  title="Ver documento"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc.file_url, doc.file_name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Internal Document Viewer Modal */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{selectedDocument?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocument(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-4 pt-0">
            {selectedDocument && (
              <div className="w-full h-[70vh]">
                {selectedDocument.type === 'titulo_pdf' || selectedDocument.name.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={selectedDocument.url}
                    className="w-full h-full border rounded"
                    title={selectedDocument.name}
                  />
                ) : (
                  <img
                    src={selectedDocument.url}
                    alt={selectedDocument.name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => selectedDocument && handleViewExternal(selectedDocument.url)}
              >
                Abrir en nueva pestaña
              </Button>
              <Button
                onClick={() => selectedDocument && handleDownload(selectedDocument.url, selectedDocument.name)}
              >
                Descargar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};