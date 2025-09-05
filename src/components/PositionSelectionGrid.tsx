import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Building } from 'lucide-react';
import { PositionSelection, useSecondaryInscriptionData } from '@/hooks/useSecondaryInscriptionData';

interface PositionSelectionGridProps {
  selectedPositions: PositionSelection[];
  onSelectionChange: (selections: PositionSelection[]) => void;
}

export const PositionSelectionGrid: React.FC<PositionSelectionGridProps> = ({
  selectedPositions,
  onSelectionChange,
}) => {
  const { schools, administrativePositions, loading } = useSecondaryInscriptionData();

  const isSelected = (positionId: string) => {
    return selectedPositions.some(selection => selection.administrative_position_id === positionId);
  };

  const handleSelectionChange = (positionId: string, checked: boolean) => {
    let newSelections = [...selectedPositions];
    
    if (checked) {
      // Add selection
      newSelections.push({
        administrative_position_id: positionId,
      });
    } else {
      // Remove selection
      newSelections = newSelections.filter(
        selection => selection.administrative_position_id !== positionId
      );
    }

    onSelectionChange(newSelections);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Selección de Cargos Administrativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando cargos disponibles...</p>
        </CardContent>
      </Card>
    );
  }

  const allPositions = administrativePositions.reduce((acc, position) => {
    const existingPosition = acc.find(p => p.name === position.name);
    if (!existingPosition) {
      acc.push({
        name: position.name,
        positions: [position]
      });
    } else {
      existingPosition.positions.push(position);
    }
    return acc;
  }, [] as { name: string; positions: typeof administrativePositions }[]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Selección de Cargos Administrativos por Escuela
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Seleccione los cargos administrativos en los que desea inscribirse para cada escuela.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
            <div className="font-semibold">Cargo</div>
            {schools.map(school => (
              <div key={school.id} className="text-center font-semibold">
                {school.name}
              </div>
            ))}
          </div>

          {/* Positions Grid */}
          {allPositions.map(positionGroup => (
            <div key={positionGroup.name} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-3 border-b border-muted">
              <div className="font-medium flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                {positionGroup.name}
              </div>
              
              {schools.map(school => {
                const schoolPosition = positionGroup.positions.find(p => p.school_id === school.id);
                
                return (
                  <div key={school.id} className="flex justify-center">
                    {schoolPosition ? (
                      <label className="flex items-center space-x-2">
                        <Checkbox
                          checked={isSelected(schoolPosition.id)}
                          onCheckedChange={(checked) => 
                            handleSelectionChange(schoolPosition.id, checked as boolean)
                          }
                        />
                        <span className="text-sm">Disponible</span>
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

        {/* Selection Summary */}
        {selectedPositions.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">Cargos Seleccionados:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedPositions.map((selection, index) => {
                const position = administrativePositions.find(p => p.id === selection.administrative_position_id);
                const school = schools.find(s => s.id === position?.school_id);
                return (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {position?.name} - {school?.name}
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