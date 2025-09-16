import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

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

interface EnetSubjectsAndPositionsProps {
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

export const EnetSubjectsAndPositions: React.FC<EnetSubjectsAndPositionsProps> = ({
  subjects,
  positions,
  schools,
  selectedSubjects,
  selectedPositions,
  onSubjectSelectionChange,
  onPositionSelectionChange,
  loading
}) => {
  // Filter for ENET school - get school ID first
  const enetSchool = schools.find(school => school.name?.includes('ENET'));
  const enetSubjects = subjects.filter(subject => subject.school_id === enetSchool?.id);
  const enetPositions = positions.filter(position => position.school_id === enetSchool?.id);

  // Group subjects by specialty
  const subjectsBySpecialty = enetSubjects.reduce((acc, subject) => {
    const specialty = subject.specialty || 'ciclo_basico';
    if (!acc[specialty]) acc[specialty] = [];
    acc[specialty].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  const isSubjectSelected = (subjectId: string): boolean => {
    return selectedSubjects.some(sel => sel.subjectId === subjectId);
  };

  const isPositionSelected = (positionId: string): boolean => {
    return selectedPositions.some(sel => sel.positionId === positionId);
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    let newSelections = [...selectedSubjects];
    
    if (checked) {
      newSelections.push({ subjectId, positionType: 'titular' });
    } else {
      newSelections = newSelections.filter(sel => sel.subjectId === subjectId);
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
    return <div className="text-center py-8">Cargando materias y cargos de ENET...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Subjects Section */}
      <Card>
        <CardHeader>
          <CardTitle>Materias - ENET nro 1</CardTitle>
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
                    <div className="flex items-center">
                      <Checkbox
                        checked={isSubjectSelected(subject.id)}
                        onCheckedChange={(checked) => 
                          handleSubjectChange(subject.id, checked as boolean)
                        }
                      />
                      <span className="ml-2 text-xs">Inscribirse</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Positions Section */}
      {enetPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cargos Administrativos - ENET nro 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {enetPositions.map((position) => (
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
            <CardTitle>Resumen de Selecciones - ENET</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSubjects.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Materias seleccionadas:</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedSubjects.map((selection, index) => {
                    const subject = enetSubjects.find(s => s.id === selection.subjectId);
                    return (
                      <Badge key={index} variant="secondary">
                        {subject?.name}
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
                    const position = enetPositions.find(p => p.id === selection.positionId);
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