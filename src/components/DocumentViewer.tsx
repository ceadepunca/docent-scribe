import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Download, FileText, Image } from 'lucide-react';

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
                  onClick={() => handleView(doc.file_url)}
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
    </Card>
  );
};