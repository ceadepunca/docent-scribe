import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, BookOpen, UserCheck, FileText, Calendar } from 'lucide-react';
import { InicialSubjectsAndPositions } from './InicialSubjectsAndPositions';
import { InscriptionDocumentUploader } from './InscriptionDocumentUploader';
import { PeriodSelectionGrid } from './PeriodSelectionGrid';
import { SubjectSelection, PositionSelection, useSecondaryInscriptionData } from '@/hooks/useSecondaryInscriptionData';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { useSecondaryInscriptionSelections } from '@/hooks/useSecondaryInscriptionSelections';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface InicialInscriptionWizardProps {
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

export const InicialInscriptionWizard: React.FC<InicialInscriptionWizardProps> = ({
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
  const [activeTab, setActiveTab] = useState<'period' | 'inicial' | 'documents' | 'summary'>(
    inscriptionId ? 'inicial' : 'period'
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

  // Keyboard navigation setup
  const tabs: ('period' | 'inicial' | 'documents' | 'summary')[] = ['period', 'inicial', 'documents', 'summary'];
  const { navigateToTab } = useKeyboardNavigation<'period' | 'inicial' | 'documents' | 'summary'>({
    activeTab,
    onTabChange: (tab) => setActiveTab(tab),
    tabs,
    disabled: isLoading || autoSaving || loading || periodsLoading || selectionsLoading
  });

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
      setActiveTab('inicial');
    } else if (activeTab === 'inicial') {
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
    if (activeTab === 'inicial') {
      setActiveTab('period');
    } else if (activeTab === 'documents') {
      setActiveTab('inicial');
    } else if (activeTab === 'summary') {
      setActiveTab('documents');
    }
  };

  const handleComplete = () => {
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
          <CardTitle>Inscripción para Nivel Inicial</CardTitle>
          <p className="text-muted-foreground">
            Complete las selecciones de materias especiales y cargos docentes/directivos para el nivel inicial.
          </p>
          <div className="mt-2 p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              💡 <strong>Navegación rápida:</strong> Use <strong>Ctrl + ←/→</strong> para navegar entre las pestañas
            </p>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="period" className="flex items-center gap-2">
            {selectedPeriodId ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <Calendar className="h-4 w-4" />
            Período
          </TabsTrigger>
          <TabsTrigger value="inicial" className="flex items-center gap-2">
            {hasAnySelections ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <BookOpen className="h-4 w-4" />
            Inicial
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
            teachingLevel="inicial"
          />
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleNext}
              disabled={!selectedPeriodId || autoSaving}
            >
              {autoSaving ? 'Guardando...' : 'Continuar a Inicial'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="inicial" className="mt-6">
          <div className="space-y-6">
            <InicialSubjectsAndPositions
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
                Volver a Inicial
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
                Resumen de Inscripción - Nivel Inicial
              </CardTitle>
              <p className="text-muted-foreground">
                Revise sus selecciones antes de confirmar la inscripción.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Materias Especiales Seleccionadas ({subjectSelections.length})
                </h4>
                {subjectSelections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subjectSelections.map((selection, index) => {
                      const subject = subjects.find(s => s.id === selection.subject_id);
                      return (
                        <Badge key={index} variant="secondary">
                          {subject?.name}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No hay materias especiales seleccionadas</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Cargos Docentes y Directivos Seleccionados ({positionSelections.length})
                </h4>
                {positionSelections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {positionSelections.map((selection, index) => {
                      const position = administrativePositions.find(p => p.id === selection.administrative_position_id);
                      return (
                        <Badge key={index} variant="secondary">
                          {position?.name}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No hay cargos seleccionados</p>
                )}
              </div>

              {!hasAnySelections && (
                <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    ⚠️ No ha seleccionado ninguna materia ni cargo. 
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
