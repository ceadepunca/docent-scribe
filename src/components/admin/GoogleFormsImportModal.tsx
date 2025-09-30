import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, Users, BookOpen, AlertCircle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useGoogleFormsImport } from '@/hooks/useGoogleFormsImport';

interface GoogleFormsImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodId: string;
  periodName: string;
}

export const GoogleFormsImportModal: React.FC<GoogleFormsImportModalProps> = ({
  open,
  onOpenChange,
  periodId,
  periodName
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [createAsSubmitted, setCreateAsSubmitted] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { importing, progress, importFromGoogleForms } = useGoogleFormsImport();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    const result = await importFromGoogleForms(
      selectedFile, 
      periodId, 
      { createAsSubmitted },
      (progress) => console.log(`Import progress: ${progress}%`)
    );
    setImportResult(result);
  };

  const resetModal = () => {
    setSelectedFile(null);
    setImportResult(null);
    setDragActive(false);
    setCreateAsSubmitted(true);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar desde Google Forms
          </DialogTitle>
          <DialogDescription>
            Importar docentes e inscripciones desde archivo CSV de Google Forms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Período de Destino</CardTitle>
              <CardDescription>Las inscripciones se crearán en este período</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-sm">
                {periodName}
              </Badge>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato esperado del CSV:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• <strong>DNI/Documento:</strong> Número de documento sin puntos ni espacios</li>
                <li>• <strong>Email:</strong> Correo electrónico del docente</li>
                <li>• <strong>Nombre:</strong> Nombre del docente</li>
                <li>• <strong>Apellido:</strong> Apellido del docente</li>
                <li>• <strong>Materias:</strong> Lista de materias separadas por comas (opcional)</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                Los nombres de las materias deben coincidir exactamente con las registradas en el sistema.
              </p>
            </AlertDescription>
          </Alert>

          {!importResult && (
            <>
              {/* File Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Cambiar archivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-lg font-medium mb-2">
                        Arrastra tu archivo CSV aquí
                      </p>
                      <p className="text-sm text-muted-foreground">
                        o haz clic para seleccionar
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Seleccionar Archivo
                    </Button>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Import Progress */}
              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Importando...</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose} disabled={importing}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={!selectedFile || importing}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {importing ? 'Importando...' : 'Importar'}
                </Button>
              </div>
            </>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className="text-lg font-semibold">
                  {importResult.success ? 'Importación Completada' : 'Importación con Errores'}
                </h3>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Docentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Creados:</span>
                        <span className="font-medium text-green-600">
                          {importResult.teachersCreated}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ya existían:</span>
                        <span className="font-medium text-blue-600">
                          {importResult.teachersSkipped}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Inscripciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Creadas:</span>
                        <span className="font-medium text-green-600">
                          {importResult.inscriptionsCreated}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ya existían:</span>
                        <span className="font-medium text-blue-600">
                          {importResult.inscriptionsSkipped}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Errores encontrados:</strong>
                    <ul className="mt-2 space-y-1 text-sm max-h-40 overflow-y-auto">
                      {importResult.errors.map((error: string, index: number) => (
                        <li key={index} className="text-destructive">• {error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                {importResult.success && createAsSubmitted && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/inscription-management', '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver en Inscripciones y Evaluaciones
                  </Button>
                )}
                <Button onClick={handleClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};