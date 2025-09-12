import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useBulkInscription } from '@/hooks/useBulkInscription';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';

interface InscriptionPreviewProps {
  selectedTeachers: any[];
  inscriptionConfig: any;
  onBack: () => void;
  onComplete: () => void;
}

export const InscriptionPreview: React.FC<InscriptionPreviewProps> = ({
  selectedTeachers,
  inscriptionConfig,
  onBack,
  onComplete,
}) => {
  const { createBulkInscriptions, loading, progress } = useBulkInscription();
  const { periods } = useInscriptionPeriods();

  const selectedPeriod = periods.find(p => p.id === inscriptionConfig.inscription_period_id);

  const handleConfirmInscriptions = async () => {
    const result = await createBulkInscriptions(selectedTeachers, inscriptionConfig);
    
    if (result.success) {
      onComplete();
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'inicial': return 'bg-blue-100 text-blue-800';
      case 'primario': return 'bg-green-100 text-green-800';
      case 'secundario': return 'bg-purple-100 text-purple-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Vista Previa de Inscripciones
        </CardTitle>
        <CardDescription>
          Revise los datos antes de crear las inscripciones masivas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Configuración de Inscripción:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Período:</span>
              <p className="text-muted-foreground">{selectedPeriod?.name}</p>
            </div>
            <div>
              <span className="font-medium">Nivel:</span>
              <Badge className={getLevelBadgeColor(inscriptionConfig.teaching_level)}>
                {inscriptionConfig.teaching_level}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Área:</span>
              <p className="text-muted-foreground">{inscriptionConfig.subject_area}</p>
            </div>
            <div>
              <span className="font-medium">Experiencia:</span>
              <p className="text-muted-foreground">{inscriptionConfig.experience_years} años</p>
            </div>
            <div>
              <span className="font-medium">Disponibilidad:</span>
              <p className="text-muted-foreground">{inscriptionConfig.availability || 'No especificada'}</p>
            </div>
            <div>
              <span className="font-medium">Docentes:</span>
              <p className="text-muted-foreground">{selectedTeachers.length} seleccionados</p>
            </div>
          </div>
        </div>

        {/* Level Validation */}
        {selectedPeriod && inscriptionConfig.teaching_level && (
          <div className="flex items-center gap-2 p-3 rounded-lg border">
            {selectedPeriod.available_levels.includes(inscriptionConfig.teaching_level) ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">
                  El nivel seleccionado está disponible en este período
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600 font-medium">
                  ⚠ El nivel seleccionado no está disponible en este período
                </span>
              </>
            )}
          </div>
        )}

        {/* Teachers List */}
        <div>
          <h4 className="font-medium mb-3">Docentes a Inscribir:</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Legajo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      {teacher.first_name} {teacher.last_name}
                    </TableCell>
                    <TableCell>{teacher.dni || '-'}</TableCell>
                    <TableCell>{teacher.legajo_number || '-'}</TableCell>
                    <TableCell>{teacher.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Migrado</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Progress Bar (if loading) */}
        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Procesando inscripciones...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} disabled={loading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button 
            onClick={handleConfirmInscriptions} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Procesando...' : `Crear ${selectedTeachers.length} Inscripciones`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};