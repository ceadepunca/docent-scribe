import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useTeacherManagement } from '@/hooks/useTeacherManagement';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TeacherImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const TeacherImportModal: React.FC<TeacherImportModalProps> = ({
  open,
  onOpenChange,
  onImportComplete,
}) => {
  const { importTeachersFromExcel } = useTeacherManagement();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
    errorDetails: string[];
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor seleccione un archivo Excel (.xlsx o .xls)');
      return;
    }

    setFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setPreview(jsonData.slice(0, 5)); // Show first 5 rows for preview
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const result = await importTeachersFromExcel(jsonData as any[], {
          overwriteExisting,
          batchSize: 5, // Smaller batches for better UX
          onProgress: (current, total) => {
            setProgress(Math.round((current / total) * 100));
          }
        });
        
        setImportResult(result);
        onImportComplete();
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error during import:', error);
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreview([]);
    setImportResult(null);
    setProgress(0);
    setOverwriteExisting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetModal}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Docentes desde Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          {!file && (
            <Card>
              <CardContent className="p-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Subir archivo Excel</h3>
                  <p className="text-muted-foreground mb-4">
                    Arrastra y suelta tu archivo aquí, o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-input"
                  />
                  <Button onClick={() => document.getElementById('file-input')?.click()}>
                    Seleccionar Archivo
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Formato esperado (se auto-detecta):</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• <strong>Nº DE LEGAJO / NRO DE LEGAJO / LEGAJO</strong>: Número de legajo</p>
                    <p>• <strong>APELLIDO / APELLIDOS</strong>: Apellido del docente</p>
                    <p>• <strong>NOMBRES / NOMBRE</strong>: Nombres del docente</p>
                    <p>• <strong>Nº DE DOCUMENTO / DNI</strong>: DNI (se limpiarán los puntos automáticamente)</p>
                    <p>• <strong>TELEFONO CELULAR / CELULAR</strong>: Teléfono</p>
                    <p>• <strong>MAIL / EMAIL</strong>: Email</p>
                    <p>• <strong>TITULO 1 / TITULO</strong>: Título académico</p>
                    <p>• <strong>FECHA DE EGRESO</strong>: Fecha de egreso</p>
                    <p>• <strong>PROMEDIO GRAL / PROMEDIO</strong>: Promedio general</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    Se excluirá automáticamente el DNI 21325214 (administrador)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {preview.length > 0 && !importResult && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium mb-4">Vista previa (primeras 5 filas):</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted/50">
                        {Object.keys(preview[0] || {}).map((key) => (
                          <th key={key} className="border border-border p-2 text-left">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value: any, colIdx) => (
                            <td key={colIdx} className="border border-border p-2">
                              {String(value || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="space-y-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="overwrite" 
                      checked={overwriteExisting}
                      onCheckedChange={(checked) => setOverwriteExisting(checked as boolean)}
                    />
                    <label htmlFor="overwrite" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Actualizar docentes existentes (útil para actualizar antigüedad y otros datos)
                    </label>
                  </div>
                  
                  {importing && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Procesando... {progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button onClick={handleImport} disabled={importing}>
                      {importing ? `Importando... ${progress}%` : 'Confirmar Importación'}
                    </Button>
                    <Button variant="outline" onClick={() => setFile(null)} disabled={importing}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Result */}
          {importResult && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium">Importación Completada</h4>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                      <div className="text-sm text-green-700">Nuevos</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                      <div className="text-sm text-blue-700">Actualizados</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                      <div className="text-sm text-yellow-700">Omitidos</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                      <div className="text-sm text-red-700">Errores</div>
                    </div>
                  </div>
                  
                  {importResult.errorDetails.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <h5 className="font-medium text-red-800 mb-2">Detalles de errores:</h5>
                      <div className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errorDetails.slice(0, 10).map((error, idx) => (
                          <div key={idx}>• {error}</div>
                        ))}
                        {importResult.errorDetails.length > 10 && (
                          <div>... y {importResult.errorDetails.length - 10} errores más</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Button onClick={resetModal} className="mt-4">
                  Cerrar
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};