import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User, GraduationCap } from 'lucide-react';
import { ListingItem } from '@/hooks/useListingData';

// Same criteria as ConsolidatedEvaluationGrid
const evaluationCriteria = [
  { id: 'titulo_score', label: 'TÍT.', fullLabel: 'TÍTULO', maxValue: undefined, column: 'A' },
  { id: 'antiguedad_titulo_score', label: 'ANT.TÍT.', fullLabel: 'ANTIGÜEDAD TÍTULO', maxValue: 3, column: 'B' },
  { id: 'antiguedad_docente_score', label: 'ANT.DOC.', fullLabel: 'ANTIGÜEDAD DOCENTE', maxValue: 6, column: 'C' },
  { id: 'concepto_score', label: 'CONC.', fullLabel: 'CONCEPTO', maxValue: undefined, column: 'D' },
  { id: 'promedio_titulo_score', label: 'PROM.', fullLabel: 'PROMEDIO GENERAL TÍTULO DOCENTE', maxValue: undefined, column: 'E' },
  { id: 'trabajo_publico_score', label: 'T.PUB.', fullLabel: 'TRABAJO PÚBLICO', maxValue: 3, column: 'F' },
  { id: 'becas_otros_score', label: 'BECAS', fullLabel: 'BECAS Y OTROS ESTUDIOS', maxValue: 3, column: 'G' },
  { id: 'concurso_score', label: 'CONC.', fullLabel: 'CONCURSO', maxValue: 2, column: 'H' },
  { id: 'otros_antecedentes_score', label: 'OTROS', fullLabel: 'OTROS ANTECEDENTES DOCENTES', maxValue: 3, column: 'I' },
  { id: 'red_federal_score', label: 'R.FED.', fullLabel: 'RED FEDERAL', maxValue: 3, column: 'J' },
] as const;

interface GroupedListings {
  [schoolName: string]: {
    subjects: {
      [specialty: string]: {
        [itemName: string]: {
          [titleType: string]: ListingItem[];
        };
      };
    };
    positions: {
      [itemName: string]: {
        [titleType: string]: ListingItem[];
      };
    };
  };
}

interface ListingTableProps {
  listings: ListingItem[];
}

const deriveTitleType = (item: ListingItem): string => {
  // Derive title type from actual titulo_score with tolerance
  if (item.titulo_score !== null && item.titulo_score !== undefined) {
    if (item.titulo_score >= 8.5) return 'docente';     // 9 with tolerance
    if (item.titulo_score >= 5.5) return 'habilitante'; // 6 with tolerance
    if (item.titulo_score >= 2.5) return 'supletorio';  // 3 with tolerance
  }
  
  // Fallback to title_type field or default
  return item.title_type || 'sin_tipo';
};

const getTitleTypeDisplay = (item: ListingItem): string => {
  const score = item.titulo_score;
  if (score !== null && score !== undefined) {
    if (score >= 8.5) return `Doc (${score.toFixed(2)})`;
    if (score >= 5.5) return `Hab (${score.toFixed(2)})`;
    if (score >= 2.5) return `Sup (${score.toFixed(2)})`;
  }
  
  // Fallback to title_type based display
  const titleType = item.title_type;
  switch (titleType) {
    case 'docente': return 'Doc (9)';
    case 'habilitante': return 'Hab (6)';
    case 'supletorio': return 'Sup (3)';
    default: return '--';
  }
};

export const ListingTable: React.FC<ListingTableProps> = ({ listings }) => {
  const groupListings = (listings: ListingItem[]): GroupedListings => {
    const grouped: GroupedListings = {};
    
    listings.forEach(item => {
      if (!grouped[item.school_name]) {
        grouped[item.school_name] = {
          subjects: {},
          positions: {}
        };
      }

      const titleType = deriveTitleType(item);

      if (item.item_type === 'subject') {
        const specialty = item.specialty || 'ciclo_basico';
        
        if (!grouped[item.school_name].subjects[specialty]) {
          grouped[item.school_name].subjects[specialty] = {};
        }
        if (!grouped[item.school_name].subjects[specialty][item.item_name]) {
          grouped[item.school_name].subjects[specialty][item.item_name] = {};
        }
        if (!grouped[item.school_name].subjects[specialty][item.item_name][titleType]) {
          grouped[item.school_name].subjects[specialty][item.item_name][titleType] = [];
        }
        grouped[item.school_name].subjects[specialty][item.item_name][titleType].push(item);
      } else {
        if (!grouped[item.school_name].positions[item.item_name]) {
          grouped[item.school_name].positions[item.item_name] = {};
        }
        if (!grouped[item.school_name].positions[item.item_name][titleType]) {
          grouped[item.school_name].positions[item.item_name][titleType] = [];
        }
        grouped[item.school_name].positions[item.item_name][titleType].push(item);
      }
    });

    return grouped;
  };

  const getSpecialtyLabel = (specialty: string): string => {
    const labels = {
      ciclo_basico: 'CICLO BÁSICO',
      electromecanica: 'ELECTROMECÁNICA',
      construccion: 'CONSTRUCCIÓN'
    };
    return labels[specialty as keyof typeof labels] || specialty.toUpperCase();
  };

  const getTitleTypeLabel = (titleType: string): string => {
    const labels = {
      docente: 'DOCENTES',
      habilitante: 'HABILITANTES', 
      supletorio: 'SUPLETORIOS',
      sin_tipo: 'SIN TIPO'
    };
    return labels[titleType as keyof typeof labels] || titleType.toUpperCase();
  };

  const sortPositionsHierarchically = (positions: string[]): string[] => {
    const hierarchyOrder = ['Director', 'Vice Director', 'Secretario', 'Pro Secretario'];
    
    return positions.sort((a, b) => {
      const aIndex = hierarchyOrder.findIndex(title => a.toLowerCase().includes(title.toLowerCase()));
      const bIndex = hierarchyOrder.findIndex(title => b.toLowerCase().includes(title.toLowerCase()));
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  };

  const renderItemTable = (items: ListingItem[], itemName: string, titleType: string) => (
    <div className="w-full overflow-x-auto mb-4">
      <TooltipProvider>
        <Table className="table-fixed w-full text-xs border">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[280px] font-semibold text-xs border-r">DOCENTE</TableHead>
              <TableHead className="w-[100px] font-semibold text-xs border-r">TIPO</TableHead>
              {evaluationCriteria.map((criterion) => (
                <Tooltip key={criterion.id}>
                  <TooltipTrigger asChild>
                    <TableHead className="w-8 text-center font-semibold p-1 h-20 border-r">
                      <div className="flex flex-col items-center justify-center h-full leading-none">
                        {criterion.label.split('').map((char, index) => (
                          <span key={index} className="block text-xs font-bold">
                            {char}
                          </span>
                        ))}
                      </div>
                    </TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p><strong>{criterion.column}:</strong> {criterion.fullLabel}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              <TableHead className="w-16 text-center font-semibold text-xs h-24 border-r">
                <div className="flex flex-col items-center justify-center h-full leading-none">
                  {'TOTAL'.split('').map((letter, index) => (
                    <span key={index} className="block text-2xs font-bold">
                      {letter}
                    </span>
                  ))}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={`${item.inscription_id}-${index}`} className="text-xs hover:bg-muted/25">
                <TableCell className="p-2 border-r">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <div className="flex items-center gap-2">
                            <span className="w-6 text-center font-mono text-xs text-muted-foreground">
                              {index + 1}.
                            </span>
                            <div className="flex-1">
                              <p className="font-semibold text-xs leading-tight">{item.teacher_name}</p>
                              <p className="text-2xs text-muted-foreground">DNI: {item.teacher_dni}</p>
                            </div>
                          </div>
                          <div className="mt-1">
                            <Badge 
                              variant={item.evaluation_status === 'completed' ? 'default' : 'secondary'}
                              className="text-2xs px-1 py-0"
                            >
                              {item.evaluation_status === 'completed' ? '✓ Evaluado' : '⏳ Pendiente'}
                            </Badge>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span className="font-semibold">{item.teacher_name}</span>
                          </div>
                          <p className="text-xs">Email: {item.teacher_email}</p>
                          <p className="text-xs">DNI: {item.teacher_dni}</p>
                          <div className="flex items-start gap-2 mt-2">
                            <GraduationCap className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div className="text-xs">
                              <p className="font-medium">Títulos:</p>
                              <p className="text-2xs text-muted-foreground break-words">
                                {item.teacher_titles}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="p-1 text-center border-r">
                  <span className="text-2xs">
                    {getTitleTypeDisplay(item)}
                  </span>
                </TableCell>
                {evaluationCriteria.map((criterion) => (
                  <TableCell key={criterion.id} className="p-1 text-center border-r">
                    <span className="text-2xs">
                      {item[criterion.id as keyof ListingItem] !== null && item[criterion.id as keyof ListingItem] !== undefined
                        ? (item[criterion.id as keyof ListingItem] as number).toFixed(2)
                        : '--'
                      }
                    </span>
                  </TableCell>
                ))}
                <TableCell className="text-center p-1 border-r">
                  <div className={`px-1 py-1 rounded font-bold text-2xs ${
                    item.total_score !== null 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {item.total_score !== null ? item.total_score.toFixed(2) : '--'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );

  const groupedListings = groupListings(listings);

  if (listings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No se encontraron inscripciones para los filtros seleccionados
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedListings).map(([schoolName, schoolData]) => {
        const totalInscriptions = 
          Object.values(schoolData.subjects).flatMap(specialty => 
            Object.values(specialty).flatMap(subject => 
              Object.values(subject).flat()
            )
          ).length + 
          Object.values(schoolData.positions).flatMap(position => 
            Object.values(position).flat()
          ).length;

        return (
          <div key={schoolName} className="space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-primary">{schoolName}</h2>
              <Badge variant="secondary">
                {totalInscriptions} inscripciones
              </Badge>
            </div>
            
            {/* MATERIAS Section */}
            {Object.keys(schoolData.subjects).length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-foreground border-b border-primary/20 pb-2">
                  MATERIAS
                </h3>
                
                {/* Group by specialty */}
                {['ciclo_basico', 'electromecanica', 'construccion'].map(specialty => {
                  if (!schoolData.subjects[specialty] || Object.keys(schoolData.subjects[specialty]).length === 0) {
                    return null;
                  }

                  return (
                    <div key={specialty} className="space-y-4">
                      <h4 className="text-md font-semibold text-primary">
                        {getSpecialtyLabel(specialty)}
                      </h4>
                      
                      {/* Sort subjects alphabetically within specialty */}
                      {Object.keys(schoolData.subjects[specialty])
                        .sort()
                        .map(subjectName => {
                          const subjectData = schoolData.subjects[specialty][subjectName];
                          
                          return (
                            <div key={subjectName} className="space-y-3">
                              <h5 className="text-sm font-semibold text-foreground">
                                {subjectName.toUpperCase()}
                              </h5>
                              
                              {/* Sort title types: docente -> habilitante -> supletorio */}
                              {['docente', 'habilitante', 'supletorio', 'sin_tipo']
                                .filter(titleType => subjectData[titleType] && subjectData[titleType].length > 0)
                                .map(titleType => (
                                  <div key={titleType} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <h6 className="text-xs font-medium text-muted-foreground">
                                        {getTitleTypeLabel(titleType)}
                                      </h6>
                                      <Badge variant="outline" className="text-2xs">
                                        {subjectData[titleType].length} {subjectData[titleType].length === 1 ? 'inscripto' : 'inscriptos'}
                                      </Badge>
                                    </div>
                                    {renderItemTable(subjectData[titleType], subjectName, titleType)}
                                  </div>
                                ))}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* CARGOS ADMINISTRATIVOS Section */}
            {Object.keys(schoolData.positions).length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-foreground border-b border-primary/20 pb-2">
                  CARGOS ADMINISTRATIVOS
                </h3>
                
                {/* Sort positions hierarchically */}
                {sortPositionsHierarchically(Object.keys(schoolData.positions)).map(positionName => {
                  const positionData = schoolData.positions[positionName];
                  
                  return (
                    <div key={positionName} className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        {positionName.toUpperCase()}
                      </h4>
                      
                      {/* Sort title types: docente -> habilitante -> supletorio */}
                      {['docente', 'habilitante', 'supletorio', 'sin_tipo']
                        .filter(titleType => positionData[titleType] && positionData[titleType].length > 0)
                        .map(titleType => (
                          <div key={titleType} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-medium text-muted-foreground">
                                {getTitleTypeLabel(titleType)}
                              </h5>
                              <Badge variant="outline" className="text-2xs">
                                {positionData[titleType].length} {positionData[titleType].length === 1 ? 'inscripto' : 'inscriptos'}
                              </Badge>
                            </div>
                            {renderItemTable(positionData[titleType], positionName, titleType)}
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};