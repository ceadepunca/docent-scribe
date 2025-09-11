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
  LEGAJO: string;
  TÍTULO: number;
  'ANTIGÜEDAD TÍTULO': number;
  'ANTIGÜEDAD DOCEN': number; 
  CONCEPTO: number;
  'PROM.GRAL.TIT.DOCEN.': number;
  'TRAB.PUBLIC.': number;
  'BECAS Y OTROS EST.': number;
  CONCURSOS: number;
  'OTROS ANTEC. DOC.': number;
  'RED FEDERAL MAX. 3': number;
  TOTAL?: number; // Optional, will be recalculated
}

// Column mapping to handle variations in Excel headers
const COLUMN_MAPPING = {
  // Legajo variations
  LEGAJO: ['LEGAJO', 'NRO_LEGAJO', 'NRO LEGAJO', 'NUMERO LEGAJO'],
  
  // Título variations  
  TÍTULO: ['TÍTULO', 'TITULO', 'TITLE'],
  
  // Antigüedad Título variations
  'ANTIGÜEDAD TÍTULO': ['ANTIGÜEDAD TÍTULO', 'ANTIGUEDAD TITULO', 'ANTIGUEDAD_TITULO', 'ANT TITULO', 'ANT. TÍTULO'],
  
  // Antigüedad Docente variations
  'ANTIGÜEDAD DOCEN': ['ANTIGÜEDAD DOCEN', 'ANTIGUEDAD DOCENTE', 'ANTIGUEDAD_DOCENTE', 'ANT DOCENTE', 'ANT. DOCENTE'],
  
  // Concepto variations
  CONCEPTO: ['CONCEPTO', 'CONCEPT'],
  
  // Promedio variations
  'PROM.GRAL.TIT.DOCEN.': ['PROM.GRAL.TIT.DOCEN.', 'PROMEDIO_TITULO', 'PROMEDIO TITULO', 'PROM TITULO', 'PROMEDIO'],
  
  // Trabajo Público variations
  'TRAB.PUBLIC.': ['TRAB.PUBLIC.', 'TRABAJO_PUBLICO', 'TRABAJO PUBLICO', 'TRAB PUBLICO'],
  
  // Becas variations
  'BECAS Y OTROS EST.': ['BECAS Y OTROS EST.', 'BECAS_OTROS', 'BECAS OTROS', 'BECAS Y OTROS'],
  
  // Concursos variations
  CONCURSOS: ['CONCURSOS', 'CONCURSO', 'CONTESTS'],
  
  // Otros Antecedentes variations
  'OTROS ANTEC. DOC.': ['OTROS ANTEC. DOC.', 'OTROS_ANTECEDENTES', 'OTROS ANTECEDENTES', 'OTROS ANT'],
  
  // Red Federal variations
  'RED FEDERAL MAX. 3': ['RED FEDERAL MAX. 3', 'RED_FEDERAL', 'RED FEDERAL', 'RED FED'],
  
  // Total variations (optional)
  TOTAL: ['TOTAL', 'SUMA', 'SUM']
};

export const ImportPreviousInscriptionsModal = ({ open, onOpenChange, onImportComplete }: ImportPreviousInscriptionsModalProps) => {
  const { toast } = useToast();
  const { periods, fetchAllPeriods } = useInscriptionPeriods();
  const { importInscriptions, importing, progress } = useImportPreviousInscriptions();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelInscriptionData[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [columnValidation, setColumnValidation] = useState<{found: string[], missing: string[], suggestions: string[]}>({
    found: [], missing: [], suggestions: []
  });

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

  // Function to map Excel column names to our expected format
  const mapColumns = (excelHeaders: string[]): { [key: string]: string } => {
    const mapping: { [key: string]: string } = {};
    
    Object.entries(COLUMN_MAPPING).forEach(([targetColumn, variations]) => {
      const found = excelHeaders.find(header => 
        variations.some(variation => 
          header.trim().toUpperCase() === variation.toUpperCase()
        )
      );
      if (found) {
        mapping[found] = targetColumn;
      }
    });
    
    return mapping;
  };

  const validateColumns = (excelHeaders: string[]) => {
    const columnMap = mapColumns(excelHeaders);
    const foundColumns = Object.keys(columnMap);
    const requiredColumns = Object.keys(COLUMN_MAPPING).filter(col => col !== 'TOTAL');
    
    const missing = requiredColumns.filter(col => !foundColumns.some(found => columnMap[found] === col));
    
    // Filter out empty columns and __EMPTY columns from suggestions
    const suggestions = excelHeaders.filter(header => 
      !foundColumns.includes(header) && 
      !header.startsWith('__EMPTY') && 
      header.trim() !== '' &&
      header.trim() !== '__EMPTY'
    );
    
    setColumnValidation({
      found: foundColumns,
      missing,
      suggestions
    });
    
    return missing.length === 0;
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
    // Normalize file name and type for case-insensitive validation
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // Accept .xlsx, .xls, .xlsm files (case-insensitive) and relevant MIME types
    const validExtensions = ['.xlsx', '.xls', '.xlsm'];
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = validMimeTypes.some(mime => fileType.includes(mime));
    
    if (!hasValidExtension && !hasValidMimeType) {
      console.log('File validation failed:', {
        fileName: file.name,
        fileType: file.type,
        size: file.size
      });
      
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo Excel (.xlsx, .xls, .xlsm)",
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

      if (jsonData.length === 0) {
        toast({
          title: "Error",
          description: "El archivo Excel está vacío o no contiene datos válidos",
          variant: "destructive"
        });
        return;
      }

      // Get headers from first row
      const firstRow = jsonData[0] as any;
      const excelHeaders = Object.keys(firstRow);
      
      // Validate columns
      const isValid = validateColumns(excelHeaders);
      
      if (!isValid) {
        toast({
          title: "Columnas faltantes",
          description: "El archivo no contiene todas las columnas requeridas. Verifique la estructura.",
          variant: "destructive"
        });
        return;
      }

      // Create column mapping
      const columnMap = mapColumns(excelHeaders);

      // Process data with flexible mapping
      const processedData: ExcelInscriptionData[] = jsonData.map((row: any) => {
        const mappedRow: any = {};
        
        // Map each column using our flexible mapping
        Object.entries(columnMap).forEach(([excelCol, targetCol]) => {
          if (targetCol === 'LEGAJO') {
            mappedRow[targetCol] = String(row[excelCol] || '').trim();
          } else if (targetCol === 'TOTAL') {
            mappedRow[targetCol] = Number(row[excelCol] || 0);
          } else {
            mappedRow[targetCol] = Number(row[excelCol] || 0);
          }
        });

        // Calculate total if not provided
        if (!mappedRow.TOTAL) {
          mappedRow.TOTAL = (mappedRow['TÍTULO'] || 0) + 
                           (mappedRow['ANTIGÜEDAD TÍTULO'] || 0) + 
                           (mappedRow['ANTIGÜEDAD DOCEN'] || 0) + 
                           (mappedRow.CONCEPTO || 0) + 
                           (mappedRow['PROM.GRAL.TIT.DOCEN.'] || 0) + 
                           (mappedRow['TRAB.PUBLIC.'] || 0) + 
                           (mappedRow['BECAS Y OTROS EST.'] || 0) + 
                           (mappedRow.CONCURSOS || 0) + 
                           (mappedRow['OTROS ANTEC. DOC.'] || 0) + 
                           (mappedRow['RED FEDERAL MAX. 3'] || 0);
        }

        return mappedRow;
      }).filter(row => row.LEGAJO); // Filter out empty rows

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

      // Get headers and create mapping
      const firstRow = jsonData[0] as any;
      const excelHeaders = Object.keys(firstRow);
      const columnMap = mapColumns(excelHeaders);

      // Process data with flexible mapping
      const processedData: ExcelInscriptionData[] = jsonData.map((row: any) => {
        const mappedRow: any = {};
        
        Object.entries(columnMap).forEach(([excelCol, targetCol]) => {
          if (targetCol === 'LEGAJO') {
            mappedRow[targetCol] = String(row[excelCol] || '').trim();
          } else {
            mappedRow[targetCol] = Number(row[excelCol] || 0);
          }
        });

        return mappedRow;
      }).filter(row => row.LEGAJO);

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
    setColumnValidation({ found: [], missing: [], suggestions: [] });
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
          {/* Expected Excel Structure Documentation */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Estructura esperada del Excel</h4>
            <p className="text-sm text-muted-foreground mb-3">
              El archivo Excel debe contener las siguientes columnas (los nombres pueden variar):
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>• LEGAJO</div>
              <div>• TÍTULO (9, 6, o 3)</div>
              <div>• ANTIGÜEDAD TÍTULO</div>
              <div>• ANTIGÜEDAD DOCEN</div>
              <div>• CONCEPTO</div>
              <div>• PROM.GRAL.TIT.DOCEN.</div>
              <div>• TRAB.PUBLIC.</div>
              <div>• BECAS Y OTROS EST.</div>
              <div>• CONCURSOS</div>
              <div>• OTROS ANTEC. DOC.</div>
              <div>• RED FEDERAL MAX. 3</div>
              <div>• TOTAL (opcional)</div>
            </div>
          </div>

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

          {/* Column Validation Results */}
          {(columnValidation.found.length > 0 || columnValidation.missing.length > 0) && (
            <div className="space-y-3">
              {columnValidation.found.length > 0 && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Columnas detectadas</span>
                  </div>
                  <div className="text-xs text-green-700">
                    {columnValidation.found.join(', ')}
                  </div>
                </div>
              )}
              
              {columnValidation.missing.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Columnas faltantes</span>
                  </div>
                  <div className="text-xs text-red-700">
                    {columnValidation.missing.join(', ')}
                  </div>
                </div>
              )}
              
              {columnValidation.suggestions.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Columnas no reconocidas</span>
                  </div>
                  <div className="text-xs text-yellow-700">
                    {columnValidation.suggestions.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

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
                  O haz clic para seleccionar un archivo (.xlsx, .xls, .xlsm)
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
                      const calculatedTotal = (row['TÍTULO'] || 0) + 
                                            (row['ANTIGÜEDAD TÍTULO'] || 0) + 
                                            (row['ANTIGÜEDAD DOCEN'] || 0) + 
                                            (row.CONCEPTO || 0) + 
                                            (row['PROM.GRAL.TIT.DOCEN.'] || 0) + 
                                            (row['TRAB.PUBLIC.'] || 0) + 
                                            (row['BECAS Y OTROS EST.'] || 0) + 
                                            (row.CONCURSOS || 0) + 
                                            (row['OTROS ANTEC. DOC.'] || 0) + 
                                            (row['RED FEDERAL MAX. 3'] || 0);
                      
                      const excelTotal = row.TOTAL || calculatedTotal;
                      const totalMismatch = excelTotal !== calculatedTotal;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{row.LEGAJO}</TableCell>
                          <TableCell>{row['TÍTULO']}</TableCell>
                          <TableCell>
                            <Badge variant={row['TÍTULO'] === 9 ? 'default' : row['TÍTULO'] === 6 ? 'secondary' : 'outline'}>
                              {getTitleType(row['TÍTULO'])}
                            </Badge>
                          </TableCell>
                          <TableCell>{row['ANTIGÜEDAD TÍTULO']}</TableCell>
                          <TableCell>{row['ANTIGÜEDAD DOCEN']}</TableCell>
                          <TableCell>{row.CONCEPTO}</TableCell>
                          <TableCell>{row['PROM.GRAL.TIT.DOCEN.']}</TableCell>
                          <TableCell className={`font-semibold ${totalMismatch ? 'text-yellow-600' : ''}`}>
                            {calculatedTotal}
                            {totalMismatch && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (Excel: {excelTotal})
                              </span>
                            )}
                          </TableCell>
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