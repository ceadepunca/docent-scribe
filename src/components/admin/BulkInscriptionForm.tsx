import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, ArrowLeft } from 'lucide-react';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { useToast } from '@/hooks/use-toast';
import { SubjectSelectionGrid } from '@/components/SubjectSelectionGrid';
import { PositionSelectionGrid } from '@/components/PositionSelectionGrid';
import { SubjectSelection, PositionSelection } from '@/hooks/useSecondaryInscriptionData';

interface BulkInscriptionFormProps {
  selectedTeachersCount: number;
  onSubmit: (config: any) => void;
  onBack: () => void;
}

interface BulkInscriptionConfig {
  inscription_period_id: string;
  teaching_level: string;
  subject_area: string;
  experience_years: string;
  availability: string;
  motivational_letter: string;
  subjectSelections?: SubjectSelection[];
  positionSelections?: PositionSelection[];
}

export const BulkInscriptionForm: React.FC<BulkInscriptionFormProps> = ({
  selectedTeachersCount,
  onSubmit,
  onBack,
}) => {
  const { toast } = useToast();
  const { periods, fetchAllPeriods } = useInscriptionPeriods();
  
  const [formData, setFormData] = useState<BulkInscriptionConfig>({
    inscription_period_id: '',
    teaching_level: '',
    subject_area: '',
    experience_years: '0',
    availability: '',
    motivational_letter: '',
    subjectSelections: [],
    positionSelections: [],
  });

  useEffect(() => {
    fetchAllPeriods();
  }, [fetchAllPeriods]);

  const handleSubmit = () => {
    if (!formData.inscription_period_id || !formData.teaching_level) {
      toast({
        title: 'Error',
        description: 'Complete todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    // For secundario level, validate selections
    if (formData.teaching_level === 'secundario') {
      const hasSelections = (formData.subjectSelections?.length || 0) > 0 || 
                           (formData.positionSelections?.length || 0) > 0;
      
      if (!hasSelections) {
        toast({
          title: 'Error',
          description: 'Para nivel secundario debe seleccionar al menos una materia o cargo administrativo',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // For inicial/primario, require subject_area
      if (!formData.subject_area) {
        toast({
          title: 'Error',
          description: 'Complete el área temática',
          variant: 'destructive',
        });
        return;
      }
    }

    onSubmit(formData);
  };

  const handleSubjectSelectionChange = (selections: SubjectSelection[]) => {
    setFormData(prev => ({ ...prev, subjectSelections: selections }));
  };

  const handlePositionSelectionChange = (selections: PositionSelection[]) => {
    setFormData(prev => ({ ...prev, positionSelections: selections }));
  };

  const selectedPeriod = periods.find(p => p.id === formData.inscription_period_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Inscripción Masiva
        </CardTitle>
        <CardDescription>
          Configure los datos comunes para las {selectedTeachersCount} inscripciones que se crearán
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Selection */}
        <div>
          <Label htmlFor="period">Período de Inscripción *</Label>
          <Select
            value={formData.inscription_period_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, inscription_period_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name} {period.is_active ? '(Activo)' : '(Inactivo)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPeriod && (
            <p className="text-sm text-muted-foreground mt-1">
              Período: {new Date(selectedPeriod.start_date).toLocaleDateString()} - {new Date(selectedPeriod.end_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Teaching Level */}
        <div>
          <Label>Nivel Educativo *</Label>
          <RadioGroup
            value={formData.teaching_level}
            onValueChange={(value) => setFormData(prev => ({ ...prev, teaching_level: value }))}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inicial" id="inicial" />
              <Label htmlFor="inicial">Inicial</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="primario" id="primario" />
              <Label htmlFor="primario">Primario</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="secundario" id="secundario" />
              <Label htmlFor="secundario">Secundario</Label>
            </div>
          </RadioGroup>
          {selectedPeriod && formData.teaching_level && (
            <div className="mt-2">
              {selectedPeriod.available_levels.includes(formData.teaching_level as any) ? (
                <p className="text-sm text-green-600">✓ Nivel disponible en este período</p>
              ) : (
                <p className="text-sm text-red-600">⚠ Nivel no disponible en este período</p>
              )}
            </div>
          )}
        </div>

        {/* Subject Area - Only for inicial/primario */}
        {formData.teaching_level && formData.teaching_level !== 'secundario' && (
          <div>
            <Label htmlFor="subject_area">Área/Materia *</Label>
            <Input
              id="subject_area"
              placeholder="Ej: Matemática, Lengua, General, etc."
              value={formData.subject_area}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_area: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Se aplicará la misma área a todas las inscripciones
            </p>
          </div>
        )}

        {/* Experience Years */}
        <div>
          <Label htmlFor="experience_years">Años de Experiencia (Común)</Label>
          <Input
            id="experience_years"
            type="number"
            min="0"
            value={formData.experience_years}
            onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Se aplicará el mismo valor a todas las inscripciones
          </p>
        </div>

        {/* Availability */}
        <div>
          <Label htmlFor="availability">Disponibilidad (Común)</Label>
          <Input
            id="availability"
            placeholder="Ej: Mañana, Tarde, Completa"
            value={formData.availability}
            onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
          />
        </div>

        {/* Motivational Letter */}
        <div>
          <Label htmlFor="motivational_letter">Carta de Motivación (Común)</Label>
          <Textarea
            id="motivational_letter"
            placeholder="Texto común que se aplicará a todas las inscripciones..."
            value={formData.motivational_letter}
            onChange={(e) => setFormData(prev => ({ ...prev, motivational_letter: e.target.value }))}
            rows={4}
          />
        </div>

        {/* Secondary Level Selections */}
        {formData.teaching_level === 'secundario' && (
          <div className="space-y-6">
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Selecciones para Nivel Secundario</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Estas selecciones se aplicarán a todas las inscripciones de nivel secundario
              </p>
              
              <div className="space-y-6">
                <SubjectSelectionGrid
                  selectedSubjects={formData.subjectSelections || []}
                  onSelectionChange={handleSubjectSelectionChange}
                />
                
                <PositionSelectionGrid
                  selectedPositions={formData.positionSelections || []}
                  onSelectionChange={handlePositionSelectionChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Resumen de la Inscripción Masiva:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>{selectedTeachersCount}</strong> docentes serán inscritos</li>
            <li>• Período: {selectedPeriod?.name || 'No seleccionado'}</li>
            <li>• Nivel: {formData.teaching_level || 'No seleccionado'}</li>
            {formData.teaching_level === 'secundario' ? (
              <>
                <li>• Materias seleccionadas: {formData.subjectSelections?.length || 0}</li>
                <li>• Cargos administrativos: {formData.positionSelections?.length || 0}</li>
              </>
            ) : (
              <li>• Área: {formData.subject_area || 'No especificada'}</li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button onClick={handleSubmit}>
            Ver Vista Previa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};