import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, BookOpen, UserCheck, FileText } from 'lucide-react';
import { SubjectSelectionGrid } from './SubjectSelectionGrid';
import { PositionSelectionGrid } from './PositionSelectionGrid';
import { SubjectSelection, PositionSelection, useSecondaryInscriptionData } from '@/hooks/useSecondaryInscriptionData';

interface SecondaryInscriptionWizardProps {
  onComplete: (data: {
    subjectSelections: SubjectSelection[];
    positionSelections: PositionSelection[];
  }) => void;
  initialSubjectSelections?: SubjectSelection[];
  initialPositionSelections?: PositionSelection[];
  isLoading?: boolean;
  onSubjectSelectionsChange?: (selections: SubjectSelection[]) => void;
  onPositionSelectionsChange?: (selections: PositionSelection[]) => void;
}

export const SecondaryInscriptionWizard: React.FC<SecondaryInscriptionWizardProps> = ({
  onComplete,
  initialSubjectSelections = [],
  initialPositionSelections = [],
  isLoading = false,
  onSubjectSelectionsChange,
  onPositionSelectionsChange,
}) => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'positions' | 'summary'>('subjects');
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelection[]>(initialSubjectSelections);
  const [positionSelections, setPositionSelections] = useState<PositionSelection[]>(initialPositionSelections);
  
  const { schools, subjects, administrativePositions, loading } = useSecondaryInscriptionData();

  const handleSubjectSelectionsChange = (selections: SubjectSelection[]) => {
    setSubjectSelections(selections);
    onSubjectSelectionsChange?.(selections);
  };

  const handlePositionSelectionsChange = (selections: PositionSelection[]) => {
    setPositionSelections(selections);
    onPositionSelectionsChange?.(selections);
  };

  const hasSubjectSelections = subjectSelections.length > 0;
  const hasPositionSelections = positionSelections.length > 0;
  const hasAnySelections = hasSubjectSelections || hasPositionSelections;

  const handleNext = () => {
    if (activeTab === 'subjects') {
      setActiveTab('positions');
    } else if (activeTab === 'positions') {
      setActiveTab('summary');
    }
  };

  const handleBack = () => {
    if (activeTab === 'positions') {
      setActiveTab('subjects');
    } else if (activeTab === 'summary') {
      setActiveTab('positions');
    }
  };

  const handleComplete = () => {
    onComplete({
      subjectSelections,
      positionSelections,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inscripción para Nivel Secundario</CardTitle>
          <p className="text-muted-foreground">
            Complete las selecciones de materias y cargos administrativos para las escuelas secundarias.
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            {hasSubjectSelections ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <BookOpen className="h-4 w-4" />
            Materias
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            {hasPositionSelections ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <UserCheck className="h-4 w-4" />
            Cargos
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            {hasAnySelections ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <FileText className="h-4 w-4" />
            Resumen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-6">
          <div className="space-y-6">
                  <SubjectSelectionGrid
                    selectedSubjects={subjectSelections}
                    onSelectionChange={handleSubjectSelectionsChange}
                    schools={schools}
                    subjects={subjects}
                    loading={loading}
                  />
            <div className="flex justify-end">
              <Button onClick={handleNext}>
                Continuar a Cargos Administrativos
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="mt-6">
          <div className="space-y-6">
                  <PositionSelectionGrid
                    selectedPositions={positionSelections}
                    onSelectionChange={handlePositionSelectionsChange}
                    schools={schools}
                    administrativePositions={administrativePositions}
                    loading={loading}
                  />
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Volver a Materias
              </Button>
              <Button onClick={handleNext}>
                Ver Resumen
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumen de Inscripción
              </CardTitle>
              <p className="text-muted-foreground">
                Revise sus selecciones antes de confirmar la inscripción.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Materias Seleccionadas ({subjectSelections.length})
                </h4>
                {subjectSelections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subjectSelections.map((selection, index) => {
                      const subject = subjects.find(s => s.id === selection.subject_id);
                      const school = schools.find(s => s.id === subject?.school_id);
                      return (
                        <Badge key={index} variant="secondary">
                          {subject?.name} - {school?.name}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No hay materias seleccionadas</p>
                )}
              </div>

              {/* Position Selections Summary */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Cargos Administrativos Seleccionados ({positionSelections.length})
                </h4>
                {positionSelections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {positionSelections.map((selection, index) => {
                      const position = administrativePositions.find(p => p.id === selection.administrative_position_id);
                      const school = schools.find(s => s.id === position?.school_id);
                      return (
                        <Badge key={index} variant="secondary">
                          {position?.name} - {school?.name}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No hay cargos administrativos seleccionados</p>
                )}
              </div>

              {!hasAnySelections && (
                <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    ⚠️ No ha seleccionado ninguna materia ni cargo administrativo. 
                    Debe seleccionar al menos uno para continuar con la inscripción.
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Volver a Cargos
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={!hasAnySelections || isLoading}
                >
                  {isLoading ? 'Guardando...' : 'Confirmar Inscripción'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};