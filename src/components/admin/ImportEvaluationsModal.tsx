import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ImportEvaluationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface CSVEvaluationData {
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
  TOTAL?: number;
}

interface ImportResult {
  success: boolean;
  legajo: string;
  teacherName?: string;
  message: string;
}

export const ImportEvaluationsModal: React.FC<ImportEvaluationsModalProps> = ({
  open,
  onOpenChange,
  onImportComplete
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVEvaluationData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Botón azul destacado para importar
  const BlueImportButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <Button
      onClick={onClick}
      disabled={disabled}
      style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 600, fontSize: 16, margin: '16px 0' }}
      className="w-full hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    >
      Importar Evaluaciones (.xlsx)
    </Button>
  );

  const resetModal = useCallback(() => {
    setFile(null);
    setCsvData([]);
    setIsProcessing(false);
    setProgress(0);
    setImportResults([]);
    setShowPreview(false);
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onOpenChange(false);
  }, [resetModal, onOpenChange]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv') && !uploadedFile.name.endsWith('.xlsx')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo CSV o Excel (.xlsx)",
        variant: "destructive"
      });
      return;
    }

    setFile(uploadedFile);
    parseFile(uploadedFile);
  }, [toast]);

  const parseFile = useCallback(async (file: File) => {
    try {
      setParseError(null);
      const data = await file.arrayBuffer();
      
      // Configure XLSX to handle different number formats
      const workbook = XLSX.read(data, { 
        cellDates: false,
        cellNF: false,
        cellText: false,
        raw: false,
        dateNF: 'dd/mm/yyyy'
      });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false, // This ensures we get formatted values
        defval: '' // Default value for empty cells
      });

      if (jsonData.length < 2) {
        setParseError("El archivo no contiene datos válidos o no tiene filas suficientes.");
        toast({
          title: "Error",
          description: "El archivo no contiene datos válidos",
          variant: "destructive"
        });
        return;
      }

      // Get headers from first row
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];

      // Helper function to parse numbers with better decimal handling
      const parseNumber = (value: any): number => {
        if (value === null || value === undefined || value === '') {
          return 0;
        }
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // Reemplazar coma por punto para decimales
          const clean = value.replace(',', '.').replace(/[^\d.-]/g, '');
          const num = parseFloat(clean);
          return isNaN(num) ? 0 : num;
        }
        return 0;
      };

      // Map data to our interface
      const parsedData: CSVEvaluationData[] = dataRows
        .filter(row => row[0]) // Filter out empty rows
        .map(row => {
          const rowData: any = {};
          headers.forEach((header, index) => {
            const value = row[index];
            if (header) {
              rowData[header] = parseNumber(value);
            }
          });
          // Calculate total if not provided or if it's 0
          if (!rowData.TOTAL || rowData.TOTAL === 0) {
            const total = Object.keys(rowData).reduce((sum, key) => {
              if (key !== 'LEGAJO' && key !== 'TOTAL' && typeof rowData[key] === 'number') {
                return sum + rowData[key];
              }
              return sum;
            }, 0);
            rowData.TOTAL = Math.round(total * 100) / 100; // Round to 2 decimal places
          }
          return rowData as CSVEvaluationData;
        });
      setCsvData(parsedData);
      setShowPreview(true);
      setParseError(null);
      
      toast({
        title: "Archivo procesado",
        description: `Se encontraron ${parsedData.length} registros de evaluación. Los totales se calcularon automáticamente.`,
      });

    } catch (error) {
      console.error('Error parsing file:', error);
      setParseError("Error al procesar el archivo. Verifica el formato y las columnas.");
      toast({
        title: "Error",
        description: "Error al procesar el archivo. Verifica el formato.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const importEvaluations = useCallback(async () => {
    if (csvData.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setImportResults([]);

    const results: ImportResult[] = [];
    const batchSize = 10; // Process in batches to avoid overwhelming the database

    try {
      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        
        for (const evaluationData of batch) {
          try {
            // Buscar docente por legajo_number en profiles
            const { data: teacherData, error: teacherError } = await supabase
              .from('profiles')
              .select('*')
              .eq('legajo_number', evaluationData.LEGAJO)
              .maybeSingle();

            const teacher = teacherData || null;

            if (teacherError || !teacher) {
              results.push({
                success: false,
                legajo: evaluationData.LEGAJO,
                message: `Docente con LEGAJO ${evaluationData.LEGAJO} no encontrado`
              });
              continue;
            }

            // Find inscription for this teacher using direct query
            const { data: inscriptionData, error: inscriptionError } = await supabase
              .from('inscriptions')
              .select('id, user_id, teaching_level')
              .eq('user_id', teacher.id)
              .eq('teaching_level', 'secundario')
              .maybeSingle();
            
            const inscription = inscriptionData;

            if (inscriptionError || !inscription) {
              results.push({
                success: false,
                legajo: evaluationData.LEGAJO,
                teacherName: `${teacher.first_name} ${teacher.last_name}`,
                message: `No se encontró inscripción para el docente`
              });
              continue;
            }

            // Find PRECEPTOR/A position selection using direct query
            const { data: positionData, error: positionError } = await supabase
              .from('inscription_position_selections')
              .select(`
                id,
                inscription_id,
                administrative_position_id,
                administrative_positions!inner(name, schools!inner(name))
              `)
              .eq('inscription_id', inscription.id)
              .eq('administrative_positions.name', 'PRECEPTOR/A')
              .eq('administrative_positions.schools.name', 'Fray M Esquiú')
              .maybeSingle();
            
            const positionSelection = positionData;

            if (positionError || !positionSelection) {
              results.push({
                success: false,
                legajo: evaluationData.LEGAJO,
                teacherName: `${teacher.first_name} ${teacher.last_name}`,
                message: `No se encontró posición PRECEPTOR/A para el docente`
              });
              continue;
            }

            // Skip existing evaluation check - we'll use upsert function
            const existingEvaluation = null;

            // Get current user for evaluator_id
            const currentUser = (await supabase.auth.getUser()).data.user;
            if (!currentUser) {
              results.push({
                success: false,
                legajo: evaluationData.LEGAJO,
                message: `Usuario no autenticado`
              });
              continue;
            }

            // Use upsert to create or update evaluation
            const upsertPayload = {
              inscription_id: inscription.id,
              evaluator_id: currentUser.id,
              position_selection_id: positionSelection.id,
              titulo_score: evaluationData.TÍTULO ?? 0,
              antiguedad_titulo_score: evaluationData['ANTIGÜEDAD TÍTULO'] ?? 0,
              antiguedad_docente_score: evaluationData['ANTIGÜEDAD DOCEN'] ?? 0,
              concepto_score: evaluationData.CONCEPTO ?? 0,
              promedio_titulo_score: evaluationData['PROM.GRAL.TIT.DOCEN.'] ?? 0,
              trabajo_publico_score: evaluationData['TRAB.PUBLIC.'] ?? 0,
              becas_otros_score: evaluationData['BECAS Y OTROS EST.'] ?? 0,
              concurso_score: evaluationData.CONCURSOS ?? 0,
              otros_antecedentes_score: evaluationData['OTROS ANTEC. DOC.'] ?? 0,
              red_federal_score: evaluationData['RED FEDERAL MAX. 3'] ?? 0,
              total_score: evaluationData.TOTAL ?? 0,
              status: 'draft',
              title_type: 'docente'
            };
            // Log para depuración
            console.log('Payload enviado a evaluations upsert:', upsertPayload);
            if (!upsertPayload.inscription_id || !upsertPayload.evaluator_id || !upsertPayload.position_selection_id) {
              console.error('Missing key data for upsert:', upsertPayload);
              results.push({
                success: false,
                legajo: evaluationData.LEGAJO,
                teacherName: `${teacher.first_name} ${teacher.last_name}`,
                message: `Faltan datos clave para la evaluación (inscription_id, evaluator_id o position_selection_id)`
              });
              continue;
            }
            const { data: evaluationResult, error: evaluationError } = await supabase
              .from('evaluations')
              .upsert(upsertPayload, {
                onConflict: 'inscription_id,position_selection_id'
              })
              .select('id')
              .single();
            
            console.log(`Upsert result for ${teacher.first_name} ${teacher.last_name}:`, { 
              evaluationResult, 
              error: evaluationError 
            });
            if (evaluationError) {
              // Mostrar el mensaje de error detallado en consola
              console.error('Supabase/Postgres error:', evaluationError);
              results.push({
                success: false,
                legajo: evaluationData.LEGAJO,
                teacherName: `LEGAJO ${evaluationData.LEGAJO}`,
                message: `Error al crear evaluación: ${evaluationError.message}`
              });
            } else {
              results.push({
                success: true,
                legajo: evaluationData.LEGAJO,
                teacherName: `LEGAJO ${evaluationData.LEGAJO}`,
                message: `Evaluación creada exitosamente`
              });
            }

          } catch (error) {
            results.push({
              success: false,
              legajo: evaluationData.LEGAJO,
              message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
            });
          }
        }

        // Update progress
        const currentProgress = Math.round(((i + batchSize) / csvData.length) * 100);
        setProgress(Math.min(currentProgress, 100));
        setImportResults([...results]);

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      toast({
        title: "Importación completada",
        description: `${successCount} evaluaciones importadas exitosamente, ${errorCount} errores`,
      });

      if (onImportComplete) {
        onImportComplete();
      }

    } catch (error) {
      console.error('Error during import:', error);
      toast({
        title: "Error",
        description: "Error durante la importación",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [csvData, toast, onImportComplete]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Botón azul destacado en la parte superior */}
        <div className="w-full flex flex-col items-center mb-4">
          <Button
            onClick={importEvaluations}
            disabled={isProcessing || !showPreview || csvData.length === 0}
            style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 700, fontSize: 18, padding: '16px 32px' }}
            className="hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-lg"
          >
            Importar Evaluaciones (.xlsx)
          </Button>
          {parseError && (
            <div className="mt-2 text-red-600 font-semibold text-center">
              {parseError}
            </div>
          )}
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Importar Evaluaciones desde CSV
          </DialogTitle>
          <DialogDescription>
            Importe puntajes de evaluaciones desde un archivo Excel (.xlsx) o CSV. 
            <strong>Recomendamos usar Excel</strong> para evitar problemas con los decimales.
            Solo se importarán evaluaciones para docentes que ya tienen inscripciones con posición PRECEPTOR/A.
          </DialogDescription>
        </DialogHeader>

        {/* RLS Fixed Notice */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>RLS Corregido:</strong> Las políticas de Row Level Security han sido actualizadas. 
            La importación ahora debería funcionar correctamente y guardar los datos en la base de datos.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* Expected CSV Structure Documentation */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Estructura esperada del archivo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              El archivo Excel (.xlsx) o CSV debe contener las siguientes columnas:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>• LEGAJO</div>
              <div>• TÍTULO</div>
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
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Para evitar problemas con los decimales, recomendamos usar archivos Excel (.xlsx). 
                El sistema calculará automáticamente los totales si no están incluidos.
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <Label htmlFor="file-upload">Seleccionar archivo Excel (.xlsx) o CSV</Label>
            <div className="flex items-center gap-4">
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {file ? file.name : 'Seleccionar archivo'}
              </Button>
            </div>

            {showPreview && (
              <div className="border rounded-lg max-h-60 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>LEGAJO</TableHead>
                      <TableHead>TÍTULO</TableHead>
                      <TableHead>ANT. TÍTULO</TableHead>
                      <TableHead>ANT. DOCEN</TableHead>
                      <TableHead>CONCEPTO</TableHead>
                      <TableHead>PROMEDIO</TableHead>
                      <TableHead>TRAB. PÚBLICO</TableHead>
                      <TableHead>BECAS</TableHead>
                      <TableHead>CONCURSOS</TableHead>
                      <TableHead>OTROS ANT.</TableHead>
                      <TableHead>RED FEDERAL</TableHead>
                      <TableHead>TOTAL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.LEGAJO}</TableCell>
                        <TableCell>{row.TÍTULO}</TableCell>
                        <TableCell>{row['ANTIGÜEDAD TÍTULO']}</TableCell>
                        <TableCell>{row['ANTIGÜEDAD DOCEN']}</TableCell>
                        <TableCell>{row.CONCEPTO}</TableCell>
                        <TableCell>{row['PROM.GRAL.TIT.DOCEN.']}</TableCell>
                        <TableCell>{row['TRAB.PUBLIC.']}</TableCell>
                        <TableCell>{row['BECAS Y OTROS EST.']}</TableCell>
                        <TableCell>{row.CONCURSOS}</TableCell>
                        <TableCell>{row['OTROS ANTEC. DOC.']}</TableCell>
                        <TableCell>{row['RED FEDERAL MAX. 3']}</TableCell>
                        <TableCell>{row.TOTAL}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {csvData.length > 10 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    ... y {csvData.length - 10} registros más
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando evaluaciones...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {importResults.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Resultados de la importación</h4>
              <div className="border rounded-lg max-h-60 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead>LEGAJO</TableHead>
                      <TableHead>Docente</TableHead>
                      <TableHead>Mensaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {result.success ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Éxito
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{result.legajo}</TableCell>
                        <TableCell>{result.teacherName || '-'}</TableCell>
                        <TableCell className="text-sm">{result.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              {isProcessing ? 'Procesando...' : 'Cerrar'}
            </Button>
          </div>
        </div> {/* <-- cierre agregado */}
      </DialogContent>
    </Dialog>
  );
};
