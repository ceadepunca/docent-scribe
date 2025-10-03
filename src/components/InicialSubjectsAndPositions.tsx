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

interface InicialSubjectsAndPositionsProps {
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

export const InicialSubjectsAndPositions: React.FC<InicialSubjectsAndPositionsProps> = ({
  subjects,
  positions,
  schools,
  selectedSubjects,
  selectedPositions,
  onSubjectSelectionChange,
  onPositionSelectionChange,
  loading
}) => {
  // Filter for Fray M Esquiú school with inicial level
  const inicialSchool = schools.find(school => 
    school.name?.includes('Fray') && school.teaching_level === 'inicial'
  );
  
  // Get subjects for inicial level (materias especiales)
  const inicialSubjects = subjects
    .filter(subject => subject.school_id === inicialSchool?.id)
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Get administrative positions (cargos docentes y directivos)
  const inicialPositions = positions
    .filter(position => position.school_id === inicialSchool?.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const isSubjectSelected = (subjectId: string): boolean => {
    return selectedSubjects.some(sel => sel.subjectId === subjectId);
  };

  const isPositionSelected = (positionId: string): boolean => {
    return selectedPositions.some(sel => sel.positionId === positionId);
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    const otherSchoolsSelections = selectedSubjects.filter(
      sel => !inicialSubjects.some(subj => subj.id === sel.subjectId)
    );
    let inicialSelections = selectedSubjects.filter(
      sel => inicialSubjects.some(subj => subj.id === sel.subjectId)
    );
    
    if (checked) {
      inicialSelections.push({ subjectId, positionType: 'titular' });
    } else {
      inicialSelections = inicialSelections.filter(sel => sel.subjectId !== subjectId);
    }
    
    onSubjectSelectionChange([...otherSchoolsSelections, ...inicialSelections]);
  };

  const handlePositionChange = (positionId: string, checked: boolean) => {
    const otherSchoolsSelections = selectedPositions.filter(
      sel => !inicialPositions.some(pos => pos.id === sel.positionId)
    );
    let inicialSelections = selectedPositions.filter(
      sel => inicialPositions.some(pos => pos.id === sel.positionId)
    );
    
    if (checked) {
      inicialSelections.push({ positionId });
    } else {
      inicialSelections = inicialSelections.filter(sel => sel.positionId !== positionId);
    }
    
    onPositionSelectionChange([...otherSchoolsSelections, ...inicialSelections]);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando materias y cargos de Nivel Inicial...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Special Subjects Section (EDUCACIÓN FÍSICA, MÚSICA) */}
      {inicialSubjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>MATERIAS ESPECIALES - Fray M Esquiú (Nivel Inicial)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {inicialSubjects.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-3 p-2 rounded-lg border">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={isSubjectSelected(subject.id)}
                    onCheckedChange={(checked) => 
                      handleSubjectChange(subject.id, checked as boolean)
                    }
                  />
                  <label htmlFor={`subject-${subject.id}`} className="text-sm font-medium flex-1 cursor-pointer">
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Administrative Positions Section (MAESTRO/A DE SALA, PSICOPEDAGOGO/A, etc.) */}
      {inicialPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CARGOS DOCENTES Y DIRECTIVOS - Fray M Esquiú (Nivel Inicial)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {inicialPositions.map((position) => (
                <div key={position.id} className="flex items-center space-x-3 p-2 rounded-lg border">
                  <Checkbox
                    id={`position-${position.id}`}
                    checked={isPositionSelected(position.id)}
                    onCheckedChange={(checked) => 
                      handlePositionChange(position.id, checked as boolean)
                    }
                  />
                  <label htmlFor={`position-${position.id}`} className="text-sm font-medium flex-1 cursor-pointer">
                    {position.name}
                  </label>
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
            <CardTitle>Resumen de Selecciones - Nivel Inicial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSubjects.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Materias Especiales seleccionadas:</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedSubjects.map((selection, index) => {
                    const subject = inicialSubjects.find(s => s.id === selection.subjectId);
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
                <h5 className="font-medium mb-2">Cargos Docentes y Directivos seleccionados:</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedPositions.map((selection, index) => {
                    const position = inicialPositions.find(p => p.id === selection.positionId);
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
