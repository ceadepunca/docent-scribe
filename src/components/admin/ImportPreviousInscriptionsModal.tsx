import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { useImportPreviousInscriptions } from '@/hooks/useImportPreviousInscriptions';
import * as XLSX from 'xlsx';

interface ImportPreviousInscriptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface ExcelInscriptionData {
  NRO_LEGAJO: string;
  TITULO: number;
  ANTIGUEDAD_TITULO: number;
  ANTIGUEDAD_DOCENTE: number; 
  CONCEPTO: number;
  PROMEDIO_TITULO: number;
  TRABAJO_PUBLICO: number;
  BECAS_OTROS: number;
  CONCURSO: number;
  OTROS_ANTECEDENTES: number;
  RED_FEDERAL: number;
}

export const ImportPreviousInscriptionsModal = ({ open, onOpenChange, onImportComplete }: ImportPreviousInscriptionsModalProps) => {
  const { toast } = useToast();
  const { periods, fetchAllPeriods } = useInscriptionPeriods();
  const { importInscriptions, importing, progress } = useImportPreviousInscriptions();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelInscriptionData[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  React.useEffect(() => {
    if (open) {
      fetchAllPeriods();
    }
  }, [open, fetchAllPeriods]);

  const getTitleType = (tituloScore: number): string => {
    if (tituloScore === 9) return 'docente';
    if (tituloScore === 6) return 'habilitante';
    if (tituloScore === 3) return 'supletorio';
    return 'desconocido';
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo Excel (.xlsx o .xls)",
        variant: "destructive"
      });
      return;
    }

    setFile(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Validate and process data
      const processedData: ExcelInscriptionData[] = jsonData.map((row: any) => ({
        NRO_LEGAJO: String(row.NRO_LEGAJO || '').trim(),
        TITULO: Number(row.TITULO || 0),
        ANTIGUEDAD_TITULO: Number(row.ANTIGUEDAD_TITULO || 0),
        ANTIGUEDAD_DOCENTE: Number(row.ANTIGUEDAD_DOCENTE || 0),
        CONCEPTO: Number(row.CONCEPTO || 0),
        PROMEDIO_TITULO: Number(row.PROMEDIO_TITULO || 0),
        TRABAJO_PUBLICO: Number(row.TRABAJO_PUBLICO || 0),
        BECAS_OTROS: Number(row.BECAS_OTROS || 0),
        CONCURSO: Number(row.CONCURSO || 0),
        OTROS_ANTECEDENTES: Number(row.OTROS_ANTECEDENTES || 0),
        RED_FEDERAL: Number(row.RED_FEDERAL || 0),
      })).filter(row => row.NRO_LEGAJO); // Filter out empty rows

      setPreview(processedData.slice(0, 10)); // Show first 10 rows
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al procesar el archivo Excel",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!file || !selectedPeriodId) {
      toast({
        title: "Error",
        description: "Seleccione un archivo y un período de inscripción",
        variant: "destructive"
      });
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const processedData: ExcelInscriptionData[] = jsonData.map((row: any) => ({
        NRO_LEGAJO: String(row.NRO_LEGAJO || '').trim(),
        TITULO: Number(row.TITULO || 0),
        ANTIGUEDAD_TITULO: Number(row.ANTIGUEDAD_TITULO || 0),
        ANTIGUEDAD_DOCENTE: Number(row.ANTIGUEDAD_DOCENTE || 0),
        CONCEPTO: Number(row.CONCEPTO || 0),
        PROMEDIO_TITULO: Number(row.PROMEDIO_TITULO || 0),
        TRABAJO_PUBLICO: Number(row.TRABAJO_PUBLICO || 0),
        BECAS_OTROS: Number(row.BECAS_OTROS || 0),
        CONCURSO: Number(row.CONCURSO || 0),
        OTROS_ANTECEDENTES: Number(row.OTROS_ANTECEDENTES || 0),
        RED_FEDERAL: Number(row.RED_FEDERAL || 0),
      })).filter(row => row.NRO_LEGAJO);

      const result = await importInscriptions(processedData, selectedPeriodId);
      setImportResult(result);

      if (result.imported > 0) {
        toast({
          title: "Importación exitosa",
          description: `Se importaron ${result.imported} inscripciones de ${result.total} registros procesados.`
        });
        onImportComplete?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error durante la importación",
        variant: "destructive"
      });
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreview([]);
    setSelectedPeriodId('');
    setImportResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Inscripciones Anteriores</DialogTitle>
          <DialogDescription>
            Importe puntajes de inscripciones anteriores desde un archivo Excel. 
            Los docentes podrán luego agregar las materias y cargos específicos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Selection */}
          <div>
            <Label htmlFor="period">Período de Inscripción de Destino</Label>
            <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar período..." />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          {!importResult && (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {file ? file.name : 'Arrastra el archivo Excel aquí'}
                </p>
                <p className="text-muted-foreground">
                  O haz clic para seleccionar un archivo (.xlsx, .xls)
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                  id="excel-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('excel-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Archivo
                </Button>
              </div>
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importando inscripciones...</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Importadas</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Omitidas</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Errores</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{importResult.total}</p>
                </div>
              </div>

              {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-destructive">Errores encontrados:</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {importResult.errorDetails.map((error: string, index: number) => (
                      <p key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Vista previa (primeras 10 filas)</h4>
                <Badge variant="outline">{preview.length} registros mostrados</Badge>
              </div>
              
              <div className="border rounded-lg overflow-x-auto max-h-60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Legajo</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ant. Título</TableHead>
                      <TableHead>Ant. Docente</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Promedio</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, index) => {
                      const total = row.TITULO + row.ANTIGUEDAD_TITULO + row.ANTIGUEDAD_DOCENTE + 
                                  row.CONCEPTO + row.PROMEDIO_TITULO + row.TRABAJO_PUBLICO + 
                                  row.BECAS_OTROS + row.CONCURSO + row.OTROS_ANTECEDENTES + row.RED_FEDERAL;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{row.NRO_LEGAJO}</TableCell>
                          <TableCell>{row.TITULO}</TableCell>
                          <TableCell>
                            <Badge variant={row.TITULO === 9 ? 'default' : row.TITULO === 6 ? 'secondary' : 'outline'}>
                              {getTitleType(row.TITULO)}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.ANTIGUEDAD_TITULO}</TableCell>
                          <TableCell>{row.ANTIGUEDAD_DOCENTE}</TableCell>
                          <TableCell>{row.CONCEPTO}</TableCell>
                          <TableCell>{row.PROMEDIO_TITULO}</TableCell>
                          <TableCell className="font-semibold">{total}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={resetModal}>
              {importResult ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!importResult && (
              <Button 
                onClick={handleImport}
                disabled={!file || !selectedPeriodId || importing}
              >
                {importing ? 'Importando...' : 'Importar Inscripciones'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};