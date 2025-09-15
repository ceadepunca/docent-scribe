import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap } from 'lucide-react';
import { SubjectSelection, School, Subject } from '@/hooks/useSecondaryInscriptionData';
import { getSubjectGroupName, areSubjectsEquivalent } from '@/utils/subjectEquivalences';

interface SubjectSelectionGridProps {
  selectedSubjects: SubjectSelection[];
  onSelectionChange: (selections: SubjectSelection[]) => void;
  schools: School[];
  subjects: Subject[];
  loading: boolean;
}

export const SubjectSelectionGrid: React.FC<SubjectSelectionGridProps> = ({
  selectedSubjects,
  onSelectionChange,
  schools,
  subjects,
  loading,
}) => {

  const isSelected = (subjectId: string) => {
    return selectedSubjects.some(
      selection => selection.subject_id === subjectId
    );
  };

  const handleSelectionChange = (subjectId: string, checked: boolean) => {
    let newSelections = [...selectedSubjects];
    
    if (checked) {
      // Add selection
      newSelections.push({
        subject_id: subjectId,
      });
    } else {
      // Remove selection
      newSelections = newSelections.filter(
        selection => selection.subject_id !== subjectId
      );
    }

    onSelectionChange(newSelections);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Selección de Materias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando materias disponibles...</p>
        </CardContent>
      </Card>
    );
  }

  const allSubjects = subjects.reduce((acc, subject) => {
    const existingSubject = acc.find(s => s.name === subject.name);
    if (!existingSubject) {
      acc.push({
        name: subject.name,
        subjects: [subject]
      });
    } else {
      existingSubject.subjects.push(subject);
    }
    return acc;
  }, [] as { name: string; subjects: typeof subjects }[]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Selección de Materias por Escuela
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Seleccione las materias y cargos en los que desea inscribirse para cada escuela.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
            <div className="font-semibold">Materia</div>
            {schools.map(school => (
              <div key={school.id} className="text-center font-semibold">
                {school.name}
              </div>
            ))}
          </div>

          {/* Group subjects by specialty */}
          {['ciclo_basico', 'electromecanica', 'construccion'].map(specialty => {
            const specialtySubjects = subjects.filter(s => s.specialty === specialty);
            if (specialtySubjects.length === 0) return null;

            const specialtyLabels = {
              ciclo_basico: 'CICLO BÁSICO',
              electromecanica: 'ELECTROMECÁNICA', 
              construccion: 'CONSTRUCCIÓN'
            };

            // Group by subject equivalence within specialty
            const subjectGroups = specialtySubjects.reduce((acc, subject) => {
              const groupName = getSubjectGroupName(subject.name);
              const existingGroup = acc.find(g => g.groupName === groupName);
              
              if (!existingGroup) {
                acc.push({
                  groupName,
                  subjects: [subject]
                });
              } else {
                existingGroup.subjects.push(subject);
              }
              return acc;
            }, [] as { groupName: string; subjects: typeof subjects }[]);

            return (
              <div key={specialty} className="space-y-4">
                <h3 className="font-semibold text-lg text-primary border-b border-primary/20 pb-2">
                  {specialtyLabels[specialty as keyof typeof specialtyLabels]}
                </h3>
                
                {subjectGroups.sort((a, b) => a.groupName.localeCompare(b.groupName)).map(subjectGroup => (
                  <div key={subjectGroup.groupName} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-3 border-b border-muted">
                    <div className="font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{subjectGroup.groupName}</div>
                        {subjectGroup.subjects.length > 1 && (
                          <div className="text-xs text-muted-foreground">
                            {subjectGroup.subjects.map(s => s.name).join(' / ')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {schools.map(school => {
                      const schoolSubject = subjectGroup.subjects.find(s => s.school_id === school.id);
                      
                      return (
                        <div key={school.id} className="flex justify-center">
                          {schoolSubject ? (
                            <label className="flex items-center space-x-2">
                              <Checkbox
                                checked={isSelected(schoolSubject.id)}
                                onCheckedChange={(checked) => 
                                  handleSelectionChange(schoolSubject.id, checked as boolean)
                                }
                              />
                              <span className="text-sm">Profesor</span>
                            </label>
                          ) : (
                            <div className="text-muted-foreground text-sm">
                              No disponible
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Selection Summary */}
        {selectedSubjects.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">Materias Seleccionadas:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map((selection, index) => {
                const subject = subjects.find(s => s.id === selection.subject_id);
                const school = schools.find(s => s.id === subject?.school_id);
                return (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {subject?.name} - {school?.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};