import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, BookOpen, UserCheck, FileText, Calendar } from 'lucide-react';
import { FraySubjectsAndPositions } from './FraySubjectsAndPositions';
import { EnetSubjectsAndPositions } from './EnetSubjectsAndPositions';
import { InscriptionDocumentUploader } from './InscriptionDocumentUploader';
import { PeriodSelectionGrid } from './PeriodSelectionGrid';
import { SubjectSelection, PositionSelection, useSecondaryInscriptionData } from '@/hooks/useSecondaryInscriptionData';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { useSecondaryInscriptionSelections } from '@/hooks/useSecondaryInscriptionSelections';

interface SecondaryInscriptionWizardProps {
  onComplete: (data: {
    subjectSelections: SubjectSelection[];
    positionSelections: PositionSelection[];
    inscriptionPeriodId: string;
  }) => void;
  onAutoSave?: (inscriptionPeriodId: string) => Promise<string | null>;
  initialSubjectSelections?: SubjectSelection[];
  initialPositionSelections?: PositionSelection[];
  initialInscriptionPeriodId?: string;
  isLoading?: boolean;
  onSubjectSelectionsChange?: (selections: SubjectSelection[]) => void;
  onPositionSelectionsChange?: (selections: PositionSelection[]) => void;
  inscriptionId?: string | null;
}

export const SecondaryInscriptionWizard: React.FC<SecondaryInscriptionWizardProps> = ({
  onComplete,
  onAutoSave,
  initialSubjectSelections = [],
  initialPositionSelections = [],
  initialInscriptionPeriodId,
  isLoading = false,
  onSubjectSelectionsChange,
  onPositionSelectionsChange,
  inscriptionId = null,
}) => {
  const [activeTab, setActiveTab] = useState<'period' | 'fray' | 'enet' | 'documents' | 'summary'>(
    inscriptionId ? 'fray' : 'period'
  );
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelection[]>([]);
  const [positionSelections, setPositionSelections] = useState<PositionSelection[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(initialInscriptionPeriodId || null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [savedInscriptionId, setSavedInscriptionId] = useState<string | null>(inscriptionId);
  
  const { schools, subjects, administrativePositions, loading } = useSecondaryInscriptionData();
  const { periods, loading: periodsLoading } = useInscriptionPeriods();
  const { 
    subjectSelections: loadedSubjectSelections, 
    positionSelections: loadedPositionSelections, 
    loading: selectionsLoading 
  } = useSecondaryInscriptionSelections(inscriptionId);

  // Load existing selections when editing
  useEffect(() => {
    if (inscriptionId && loadedSubjectSelections.length > 0) {
      const mappedSubjects = loadedSubjectSelections.map(sel => ({
        subject_id: sel.subject_id
      }));
      setSubjectSelections(mappedSubjects);
    }
  }, [loadedSubjectSelections, inscriptionId]);

  useEffect(() => {
    if (inscriptionId && loadedPositionSelections.length > 0) {
      const mappedPositions = loadedPositionSelections.map(sel => ({
        administrative_position_id: sel.administrative_position_id
      }));
      setPositionSelections(mappedPositions);
    }
  }, [loadedPositionSelections, inscriptionId]);

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

  const handleNext = async () => {
    if (activeTab === 'period') {
      setActiveTab('fray');
    } else if (activeTab === 'fray') {
      setActiveTab('enet');
    } else if (activeTab === 'enet') {
      // Auto-save when accessing documents for the first time
      if (!savedInscriptionId && selectedPeriodId && onAutoSave) {
        setAutoSaving(true);
        try {
          const newInscriptionId = await onAutoSave(selectedPeriodId);
          if (newInscriptionId) {
            setSavedInscriptionId(newInscriptionId);
          }
        } finally {
          setAutoSaving(false);
        }
      }
      setActiveTab('documents');
    } else if (activeTab === 'documents') {
      setActiveTab('summary');
    }
  };

  const handleBack = () => {
    if (activeTab === 'fray') {
      setActiveTab('period');
    } else if (activeTab === 'enet') {
      setActiveTab('fray');
    } else if (activeTab === 'documents') {
      setActiveTab('enet');
    } else if (activeTab === 'summary') {
      setActiveTab('documents');
    }
  };

  const handleComplete = () => {
    // When editing an existing inscription, use the original period ID
    // When creating a new inscription, use the selected period ID
    const periodIdToUse = inscriptionId ? initialInscriptionPeriodId : selectedPeriodId;
    
    if (!periodIdToUse) return;
    
    onComplete({
      subjectSelections,
      positionSelections,
      inscriptionPeriodId: periodIdToUse,
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="period" className="flex items-center gap-2">
            {selectedPeriodId ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <Calendar className="h-4 w-4" />
            Período
          </TabsTrigger>
          <TabsTrigger value="fray" className="flex items-center gap-2">
            {hasSubjectSelections ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <BookOpen className="h-4 w-4" />
            FRAY
          </TabsTrigger>
          <TabsTrigger value="enet" className="flex items-center gap-2">
            {hasPositionSelections ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <UserCheck className="h-4 w-4" />
            ENET
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
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

        <TabsContent value="period" className="mt-6">
          <PeriodSelectionGrid
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            onPeriodSelect={setSelectedPeriodId}
            loading={periodsLoading}
            teachingLevel="secundario"
          />
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleNext}
              disabled={!selectedPeriodId || autoSaving}
            >
              {autoSaving ? 'Guardando...' : 'Continuar a FRAY'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="fray" className="mt-6">
          <div className="space-y-6">
            <FraySubjectsAndPositions
              subjects={subjects}
              positions={administrativePositions}
              schools={schools}
              selectedSubjects={subjectSelections.map(sel => ({ subjectId: sel.subject_id, positionType: 'titular' }))}
              selectedPositions={positionSelections.map(sel => ({ positionId: sel.administrative_position_id }))}
              onSubjectSelectionChange={(selections) => {
                const mapped = selections.map(sel => ({ subject_id: sel.subjectId }));
                handleSubjectSelectionsChange(mapped);
              }}
              onPositionSelectionChange={(selections) => {
                const mapped = selections.map(sel => ({ administrative_position_id: sel.positionId }));
                handlePositionSelectionsChange(mapped);
              }}
              loading={loading}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Volver a Período
              </Button>
              <Button onClick={handleNext}>
                Continuar a ENET
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="enet" className="mt-6">
          <div className="space-y-6">
            <EnetSubjectsAndPositions
              subjects={subjects}
              positions={administrativePositions}
              schools={schools}
              selectedSubjects={subjectSelections.map(sel => ({ subjectId: sel.subject_id, positionType: 'titular' }))}
              selectedPositions={positionSelections.map(sel => ({ positionId: sel.administrative_position_id }))}
              onSubjectSelectionChange={(selections) => {
                const mapped = selections.map(sel => ({ subject_id: sel.subjectId }));
                handleSubjectSelectionsChange(mapped);
              }}
              onPositionSelectionChange={(selections) => {
                const mapped = selections.map(sel => ({ administrative_position_id: sel.positionId }));
                handlePositionSelectionsChange(mapped);
              }}
              loading={loading}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Volver a FRAY
              </Button>
              <Button onClick={handleNext}>
                Continuar a Documentos
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <div className="space-y-6">
            <InscriptionDocumentUploader 
              inscriptionId={savedInscriptionId}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Volver a ENET
              </Button>
              <Button 
                onClick={handleNext}
                disabled={autoSaving}
              >
                {autoSaving ? 'Guardando borrador...' : 'Ver Resumen'}
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
                  Volver a Documentos
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={!hasAnySelections || !selectedPeriodId || isLoading || autoSaving}
                >
                  {isLoading ? 'Guardando...' : autoSaving ? 'Preparando...' : 'Confirmar Inscripción'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};