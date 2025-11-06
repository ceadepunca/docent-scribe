import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Users, BookOpen, Eye, FileText, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { usePeriodInscriptions } from '@/hooks/usePeriodInscriptions';
import { ListingGenerator } from '@/components/ListingGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const PeriodInscriptionsView: React.FC = () => {
  const navigate = useNavigate();
  const { periods, loading: periodsLoading, fetchAllPeriods } = useInscriptionPeriods();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const { isSuperAdmin, isEvaluator } = useAuth();
  
  const { 
    inscriptions, 
    stats, 
    loading: inscriptionsLoading, 
    fetchInscriptionsByPeriod,
    refreshInscriptions
  } = usePeriodInscriptions();

  React.useEffect(() => {
    fetchAllPeriods();
  }, []);

  React.useEffect(() => {
    if (selectedPeriodId) {
      fetchInscriptionsByPeriod(selectedPeriodId, 1, '', 'all');
    }
  }, [selectedPeriodId, fetchInscriptionsByPeriod]);

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

  const getEvaluationStatusColor = (inscription: any) => {
    // Check if inscription has completed evaluations
    const hasEvaluations = inscription.evaluations && inscription.evaluations.length > 0;
    const hasCompletedEvaluations = hasEvaluations && inscription.evaluations.some((ev: any) => ev.status === 'completed');
    
    if (hasCompletedEvaluations) {
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    } else {
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getEvaluationStatusLabel = (inscription: any) => {
    // Check if inscription has completed evaluations
    const hasEvaluations = inscription.evaluations && inscription.evaluations.length > 0;
    const hasCompletedEvaluations = hasEvaluations && inscription.evaluations.some((ev: any) => ev.status === 'completed');
    
    if (hasCompletedEvaluations) {
      return 'Eval';
    } else {
      return 'Pend';
    }
  };

  const getEvaluationStatusIcon = (inscription: any) => {
    // Check if inscription has completed evaluations
    const hasEvaluations = inscription.evaluations && inscription.evaluations.length > 0;
    const hasCompletedEvaluations = hasEvaluations && inscription.evaluations.some((ev: any) => ev.status === 'completed');
    
    if (hasCompletedEvaluations) {
      return <CheckCircle2 className="h-3 w-3 mr-1" />;
    } else {
      return <Clock className="h-3 w-3 mr-1" />;
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Inscripciones del Período</CardTitle>
                        <CardDescription>
                          Lista de todas las inscripciones para este período
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refreshInscriptions('', 'all')}
                        disabled={inscriptionsLoading}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Actualizar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Docente</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Nivel</TableHead>
                            <TableHead>Período</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Evaluación</TableHead>
                            {(isSuperAdmin || isEvaluator) && <TableHead>Acciones</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inscriptions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={isSuperAdmin || isEvaluator ? 8 : 7} className="text-center py-8">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No hay inscripciones para este período</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            inscriptions.map((inscription: any) => (
                              <TableRow key={inscription.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">
                                  {inscription.profiles?.first_name} {inscription.profiles?.last_name}
                                </TableCell>
                                <TableCell>{inscription.profiles?.email || 'No disponible'}</TableCell>
                                <TableCell>{inscription.profiles?.dni || 'No disponible'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {inscription.teaching_level}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {selectedPeriod?.name || 'Sin período'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(inscription.status)}>
                                    {getStatusLabel(inscription.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getEvaluationStatusColor(inscription)}>
                                    {getEvaluationStatusIcon(inscription)}
                                    {getEvaluationStatusLabel(inscription)}
                                  </Badge>
                                </TableCell>
                                {(isSuperAdmin || isEvaluator) && (
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/inscriptions/${inscription.id}`)}
                                      className="flex items-center gap-2"
                                    >
                                      <Eye className="h-4 w-4" />
                                      Evaluar
                                    </Button>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
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