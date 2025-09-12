import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table as TableIcon, Calendar } from 'lucide-react';
import { useListingData, ListingFilters } from '@/hooks/useListingData';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { ListingTable } from './ListingTable';

interface Props {
  selectedPeriodId?: string;
}

export const ListingGenerator: React.FC<Props> = ({ selectedPeriodId }) => {
  const { listings, schools, subjects, positions, loading, error, fetchListings } = useListingData();
  const { periods } = useInscriptionPeriods();
  const [periodId, setPeriodId] = useState<string>('');
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
    if (!periodId) return;
    const filtersWithPeriod = { ...filters, periodId };
    fetchListings(filtersWithPeriod);
  };


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
  const canGenerate = periodId && (!needsSpecificSelection || filters.specificItemId);
  const selectedPeriod = periods.find(p => p.id === periodId);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Period Filter - MANDATORY */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período <span className="text-destructive">*</span>
              </label>
              <Select value={periodId} onValueChange={setPeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            <CardTitle>Listado de Mérito - Formato Grilla de Evaluación</CardTitle>
            <CardDescription>
              {listings.length} {listings.length === 1 ? 'inscripción encontrada' : 'inscripciones encontradas'}
              {selectedPeriod && ` • Período: ${selectedPeriod.name}`}
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
          <CardContent>
            <ListingTable listings={listings} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};