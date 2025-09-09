import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Table as TableIcon } from 'lucide-react';
import { useListingData, ListingFilters, ListingItem } from '@/hooks/useListingData';

interface GroupedListings {
  [schoolName: string]: {
    [itemName: string]: ListingItem[];
  };
}

export const ListingGenerator: React.FC = () => {
  const { listings, schools, subjects, positions, loading, error, fetchListings } = useListingData();
  const [filters, setFilters] = useState<ListingFilters>({
    schoolId: 'all',
    listingType: 'all',
    evaluationStatus: 'all'
  });

  const handleFilterChange = (key: keyof ListingFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset specific item when changing listing type
    if (key === 'listingType') {
      delete newFilters.specificItemId;
    }
    
    setFilters(newFilters);
  };

  const generateListings = () => {
    fetchListings(filters);
  };

  const groupListings = (listings: ListingItem[]): GroupedListings => {
    const grouped: GroupedListings = {};
    
    listings.forEach(item => {
      if (!grouped[item.school_name]) {
        grouped[item.school_name] = {};
      }
      if (!grouped[item.school_name][item.item_name]) {
        grouped[item.school_name][item.item_name] = [];
      }
      grouped[item.school_name][item.item_name].push(item);
    });

    // Sort each group by total_score (descending) then by name
    Object.keys(grouped).forEach(school => {
      Object.keys(grouped[school]).forEach(item => {
        grouped[school][item].sort((a, b) => {
          if (a.total_score === null && b.total_score === null) {
            return a.teacher_name.localeCompare(b.teacher_name);
          }
          if (a.total_score === null) return 1;
          if (b.total_score === null) return -1;
          if (a.total_score !== b.total_score) {
            return (b.total_score || 0) - (a.total_score || 0);
          }
          return a.teacher_name.localeCompare(b.teacher_name);
        });
      });
    });

    return grouped;
  };

  const renderListingSection = (itemName: string, items: ListingItem[]) => (
    <div key={itemName} className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-primary">{itemName.toUpperCase()}</h3>
        <Badge variant="outline" className="text-xs">
          {items.length} {items.length === 1 ? 'inscripto' : 'inscriptos'}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${item.inscription_id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              <span className="w-8 text-center font-mono text-sm text-muted-foreground">
                {index + 1}.
              </span>
              <div>
                <p className="font-medium">{item.teacher_name}</p>
                <p className="text-sm text-muted-foreground">DNI: {item.teacher_dni}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">
                  {item.total_score !== null ? `${item.total_score.toFixed(1)} pts` : '--'}
                </p>
              </div>
              <Badge variant={item.evaluation_status === 'completed' ? 'default' : 'secondary'}>
                {item.evaluation_status === 'completed' ? '✓ Evaluado' : '⏳ Pendiente'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const getAvailableItems = () => {
    if (filters.listingType === 'specific-subject') {
      return subjects.filter(s => filters.schoolId === 'all' || s.school_id === filters.schoolId);
    }
    if (filters.listingType === 'specific-position') {
      return positions.filter(p => filters.schoolId === 'all' || p.school_id === filters.schoolId);
    }
    return [];
  };

  const needsSpecificSelection = filters.listingType === 'specific-subject' || filters.listingType === 'specific-position';
  const canGenerate = !needsSpecificSelection || filters.specificItemId;
  const groupedListings = groupListings(listings);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            Generador de Listados de Mérito
          </CardTitle>
          <CardDescription>
            Configure los filtros para generar listados personalizados por escuela
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* School Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Escuela</label>
              <Select value={filters.schoolId} onValueChange={(value) => handleFilterChange('schoolId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar escuela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las escuelas</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Listing Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de listado</label>
              <Select value={filters.listingType} onValueChange={(value) => handleFilterChange('listingType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de listado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo (materias y cargos)</SelectItem>
                  <SelectItem value="subjects">Solo materias</SelectItem>
                  <SelectItem value="positions">Solo cargos</SelectItem>
                  <SelectItem value="specific-subject">Materia específica</SelectItem>
                  <SelectItem value="specific-position">Cargo específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific Item Filter */}
            {needsSpecificSelection && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {filters.listingType === 'specific-subject' ? 'Materia' : 'Cargo'}
                </label>
                <Select value={filters.specificItemId || ''} onValueChange={(value) => handleFilterChange('specificItemId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Seleccionar ${filters.listingType === 'specific-subject' ? 'materia' : 'cargo'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableItems().map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} {item.schools && `(${item.schools.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Evaluation Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado de evaluación</label>
              <Select value={filters.evaluationStatus} onValueChange={(value) => handleFilterChange('evaluationStatus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Solo evaluados</SelectItem>
                  <SelectItem value="draft">Solo pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateListings} 
              disabled={!canGenerate || loading}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {loading ? 'Generando...' : 'Generar Listado'}
            </Button>
            
            {listings.length > 0 && (
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {listings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Listado Generado</CardTitle>
            <CardDescription>
              {listings.length} {listings.length === 1 ? 'inscripción encontrada' : 'inscripciones encontradas'}
              {' • '}
              Generado el {new Date().toLocaleDateString('es-AR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(groupedListings).map(([schoolName, schoolGroups]) => (
              <div key={schoolName}>
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-xl font-bold text-primary">{schoolName}</h2>
                  <Badge variant="secondary">
                    {Object.values(schoolGroups).flat().length} inscripciones
                  </Badge>
                </div>
                
                {Object.entries(schoolGroups).map(([itemName, items]) =>
                  renderListingSection(itemName, items)
                )}
                
                <Separator className="my-8" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};