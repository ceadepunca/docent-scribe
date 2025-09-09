import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTeacherManagement } from '@/hooks/useTeacherManagement';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [importResult, setImportResult] = useState<{ imported: number; errors: number } | null>(null);

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
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const result = await importTeachersFromExcel(jsonData as any[]);
        setImportResult(result);
        onImportComplete();
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error during import:', error);
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreview([]);
    setImportResult(null);
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
                  <h4 className="font-medium mb-2">Formato esperado:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• <strong>NRO DE LEGAJO</strong>: Número de legajo</p>
                    <p>• <strong>APELLIDO</strong>: Apellido del docente</p>
                    <p>• <strong>NOMBRES</strong>: Nombres del docente</p>
                    <p>• <strong>Nº DE DOCUMENTO</strong>: DNI (se limpiarán los puntos automáticamente)</p>
                    <p>• <strong>TELEFONO CELULAR</strong>: Teléfono</p>
                    <p>• <strong>MAIL</strong>: Email</p>
                    <p>• <strong>TITULO 1</strong>: Título académico</p>
                    <p>• <strong>FECHA DE EGRESO</strong>: Fecha de egreso</p>
                    <p>• <strong>PROMEDIO GRAL</strong>: Promedio general</p>
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
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleImport} disabled={importing}>
                    {importing ? 'Importando...' : 'Confirmar Importación'}
                  </Button>
                  <Button variant="outline" onClick={() => setFile(null)}>
                    Cancelar
                  </Button>
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
                  <p>✅ <strong>{importResult.imported}</strong> docentes importados exitosamente</p>
                  {importResult.errors > 0 && (
                    <p>⚠️ <strong>{importResult.errors}</strong> registros con errores (duplicados, campos faltantes o DNI admin)</p>
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