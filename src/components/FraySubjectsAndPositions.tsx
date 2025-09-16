import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Subject {
  id: string;
  name: string;
  specialty: string;
  school_id: string;
}

interface AdministrativePosition {
  id: string;
  name: string;
  school_id: string;
}

interface SubjectSelection {
  subjectId: string;
  positionType: 'titular' | 'suplente';
}

interface PositionSelection {
  positionId: string;
}

interface FraySubjectsAndPositionsProps {
  subjects: Subject[];
  positions: AdministrativePosition[];
  schools: School[];
  selectedSubjects: SubjectSelection[];
  selectedPositions: PositionSelection[];
  onSubjectSelectionChange: (selections: SubjectSelection[]) => void;
  onPositionSelectionChange: (selections: PositionSelection[]) => void;
  loading?: boolean;
}

interface School {
  id: string;
  name: string;
  teaching_level: string;
}

export const FraySubjectsAndPositions: React.FC<FraySubjectsAndPositionsProps> = ({
  subjects,
  positions,
  schools,
  selectedSubjects,
  selectedPositions,
  onSubjectSelectionChange,
  onPositionSelectionChange,
  loading
}) => {
  // Filter for FRAY school - get school ID first
  const fraySchool = schools.find(school => school.name?.includes('Fray'));
  const fraySubjects = subjects.filter(subject => subject.school_id === fraySchool?.id);
  const frayPositions = positions.filter(position => position.school_id === fraySchool?.id);

  // Group subjects by specialty
  const subjectsBySpecialty = fraySubjects.reduce((acc, subject) => {
    const specialty = subject.specialty || 'ciclo_basico';
    if (!acc[specialty]) acc[specialty] = [];
    acc[specialty].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  const isSubjectSelected = (subjectId: string, positionType: 'titular' | 'suplente'): boolean => {
    return selectedSubjects.some(sel => sel.subjectId === subjectId && sel.positionType === positionType);
  };

  const isPositionSelected = (positionId: string): boolean => {
    return selectedPositions.some(sel => sel.positionId === positionId);
  };

  const handleSubjectChange = (subjectId: string, positionType: 'titular' | 'suplente', checked: boolean) => {
    let newSelections = [...selectedSubjects];
    
    if (checked) {
      newSelections.push({ subjectId, positionType });
    } else {
      newSelections = newSelections.filter(sel => 
        !(sel.subjectId === subjectId && sel.positionType === positionType)
      );
    }
    
    onSubjectSelectionChange(newSelections);
  };

  const handlePositionChange = (positionId: string, checked: boolean) => {
    let newSelections = [...selectedPositions];
    
    if (checked) {
      newSelections.push({ positionId });
    } else {
      newSelections = newSelections.filter(sel => sel.positionId !== positionId);
    }
    
    onPositionSelectionChange(newSelections);
  };

  const getSpecialtyLabel = (specialty: string) => {
    switch (specialty) {
      case 'ciclo_basico': return 'Ciclo Básico';
      case 'electromecanica': return 'Electromecánica';
      case 'construccion': return 'Construcción';
      default: return specialty;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando materias y cargos de FRAY...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Subjects Section */}
      <Card>
        <CardHeader>
          <CardTitle>Materias - Fray M Esquiú</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(subjectsBySpecialty).map(([specialty, subjects]) => (
            <div key={specialty} className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                {getSpecialtyLabel(specialty)}
              </h4>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-4 p-2 rounded-lg border">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{subject.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <Checkbox
                          checked={isSubjectSelected(subject.id, 'titular')}
                          onCheckedChange={(checked) => 
                            handleSubjectChange(subject.id, 'titular', checked as boolean)
                          }
                        />
                        <span className="text-xs">Titular</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <Checkbox
                          checked={isSubjectSelected(subject.id, 'suplente')}
                          onCheckedChange={(checked) => 
                            handleSubjectChange(subject.id, 'suplente', checked as boolean)
                          }
                        />
                        <span className="text-xs">Suplente</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Positions Section */}
      {frayPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cargos Administrativos - Fray M Esquiú</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {frayPositions.map((position) => (
                <div key={position.id} className="flex items-center space-x-3 p-2 rounded-lg border">
                  <Checkbox
                    checked={isPositionSelected(position.id)}
                    onCheckedChange={(checked) => 
                      handlePositionChange(position.id, checked as boolean)
                    }
                  />
                  <span className="text-sm font-medium">{position.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {(selectedSubjects.length > 0 || selectedPositions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Selecciones - FRAY</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSubjects.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Materias seleccionadas:</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedSubjects.map((selection, index) => {
                    const subject = fraySubjects.find(s => s.id === selection.subjectId);
                    return (
                      <Badge key={index} variant="secondary">
                        {subject?.name} ({selection.positionType})
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            
            {selectedPositions.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Cargos seleccionados:</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedPositions.map((selection, index) => {
                    const position = frayPositions.find(p => p.id === selection.positionId);
                    return (
                      <Badge key={index} variant="outline">
                        {position?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};