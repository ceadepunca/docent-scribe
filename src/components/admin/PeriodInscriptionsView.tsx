import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, BookOpen, Eye, FileText, ArrowRight } from 'lucide-react';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { usePeriodInscriptions } from '@/hooks/usePeriodInscriptions';
import { ListingGenerator } from '@/components/ListingGenerator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const PeriodInscriptionsView: React.FC = () => {
  const { periods, loading: periodsLoading, fetchAllPeriods } = useInscriptionPeriods();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  
  const { 
    inscriptions, 
    stats, 
    loading: inscriptionsLoading, 
    fetchInscriptionsByPeriod 
  } = usePeriodInscriptions();

  React.useEffect(() => {
    fetchAllPeriods();
  }, []);

  React.useEffect(() => {
    if (selectedPeriodId) {
      fetchInscriptionsByPeriod(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'requires_changes': return 'bg-orange-100 text-orange-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'submitted': return 'Enviada';
      case 'under_review': return 'En Revisión';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'requires_changes': return 'Requiere Cambios';
      default: return 'Desconocido';
    }
  };

  if (periodsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando períodos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seleccionar Período de Inscripción
          </CardTitle>
          <CardDescription>
            Seleccione un período para ver las inscripciones y generar reportes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar período..." />
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => (
                  <SelectItem key={period.id} value={period.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{period.name}</span>
                      <Badge variant={period.is_active ? 'default' : 'secondary'} className="ml-2">
                        {period.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Period Details and Stats */}
      {selectedPeriod && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {selectedPeriod.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {selectedPeriod.description}
                  </CardDescription>
                </div>
                <Badge variant={selectedPeriod.is_active ? 'default' : 'secondary'}>
                  {selectedPeriod.is_active ? 'Período Activo' : 'Período Inactivo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Inscripciones</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.evaluated}</div>
                  <div className="text-sm text-muted-foreground">Evaluadas</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-muted-foreground">Pendientes</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Inicio: {format(new Date(selectedPeriod.start_date), 'dd/MM/yyyy', { locale: es })}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fin: {format(new Date(selectedPeriod.end_date), 'dd/MM/yyyy', { locale: es })}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Niveles: {selectedPeriod.available_levels.join(', ')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="inscriptions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inscriptions" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Inscripciones ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="listings" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Generar Listados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inscriptions" className="mt-6">
              {inscriptionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando inscripciones...</p>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Inscripciones del Período</CardTitle>
                    <CardDescription>
                      Lista de todas las inscripciones para este período
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inscriptions.map((inscription: any) => (
                        <div key={inscription.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">
                                  {inscription.profiles?.first_name} {inscription.profiles?.last_name}
                                </h4>
                                <Badge variant="outline">
                                  {inscription.teaching_level}
                                </Badge>
                                <Badge className={getStatusColor(inscription.status)}>
                                  {getStatusLabel(inscription.status)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Área: {inscription.subject_area} • DNI: {inscription.profiles?.dni || 'Sin DNI'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Email: {inscription.profiles?.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Creada: {format(new Date(inscription.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/inscriptions/${inscription.id}`, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {inscriptions.length === 0 && (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No hay inscripciones para este período</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="listings" className="mt-6">
              <ListingGenerator selectedPeriodId={selectedPeriodId} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {!selectedPeriodId && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Seleccionar Período</h3>
              <p className="text-muted-foreground mb-4">
                Seleccione un período de inscripción para ver las inscripciones y generar listados de mérito
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};