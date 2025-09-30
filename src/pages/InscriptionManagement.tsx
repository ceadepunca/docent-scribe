import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Users, BookOpen, Eye, CheckCircle2, Clock, ArrowLeft, Search, UserPlus, X } from 'lucide-react';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { usePeriodInscriptions } from '@/hooks/usePeriodInscriptions';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const InscriptionManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { periods, loading: periodsLoading, fetchAllPeriods } = useInscriptionPeriods();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { isSuperAdmin, isEvaluator } = useAuth();
  
  const { 
    inscriptions, 
    stats, 
    loading: inscriptionsLoading, 
    fetchInscriptionsByPeriod,
    refreshInscriptions
  } = usePeriodInscriptions();

  // Load filters from URL params and localStorage on component mount
  React.useEffect(() => {
    fetchAllPeriods();
    
    // Load from URL params first
    const periodFromUrl = searchParams.get('period');
    const statusFromUrl = searchParams.get('status');
    const searchFromUrl = searchParams.get('search');
    
    // Load from localStorage as fallback
    const savedPeriod = localStorage.getItem('inscription-management-period');
    const savedStatus = localStorage.getItem('inscription-management-status');
    const savedSearch = localStorage.getItem('inscription-management-search');
    
    // Set initial values
    if (periodFromUrl) {
      setSelectedPeriodId(periodFromUrl);
    } else if (savedPeriod) {
      setSelectedPeriodId(savedPeriod);
    }
    
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    } else if (savedStatus) {
      setStatusFilter(savedStatus);
    }
    
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    } else if (savedSearch) {
      setSearchTerm(savedSearch);
    }
  }, []);

  // Save filters to localStorage and URL when they change
  React.useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedPeriodId) {
      params.set('period', selectedPeriodId);
      localStorage.setItem('inscription-management-period', selectedPeriodId);
    }
    
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
      localStorage.setItem('inscription-management-status', statusFilter);
    }
    
    if (searchTerm.trim()) {
      params.set('search', searchTerm);
      localStorage.setItem('inscription-management-search', searchTerm);
    }
    
    // Update URL without causing a page reload
    setSearchParams(params, { replace: true });
  }, [selectedPeriodId, statusFilter, searchTerm, setSearchParams]);

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

  // Filter inscriptions based on search term and evaluation status
  const filteredInscriptions = inscriptions.filter((inscription: any) => {
    // Filter by search term (name, last name, or DNI)
    if (searchTerm.trim()) {
      const profile = inscription.profiles;
      if (!profile) return false;
      
      const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
      const firstName = profile.first_name?.toLowerCase() || '';
      const lastName = profile.last_name?.toLowerCase() || '';
      const dni = profile.dni?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = fullName.includes(search) || 
                           firstName.includes(search) || 
                           lastName.includes(search) || 
                           dni.includes(search);
      
      if (!matchesSearch) return false;
    }
    
    // Filter by evaluation status
    if (statusFilter === 'all') return true;
    
    const hasEvaluations = inscription.evaluations && inscription.evaluations.length > 0;
    const hasCompletedEvaluations = hasEvaluations && inscription.evaluations.some((ev: any) => ev.status === 'completed');
    
    if (statusFilter === 'evaluated') {
      return hasCompletedEvaluations;
    } else if (statusFilter === 'pending') {
      return !hasCompletedEvaluations;
    }
    
    return true;
  });

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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Gestión de Inscripciones
            </h1>
            <p className="text-muted-foreground">
              Administrar y evaluar las inscripciones de docentes
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Búsqueda y Filtros
              </CardTitle>
              <CardDescription>
                Busque por nombre, apellido o DNI, y filtre las inscripciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por nombre, apellido o DNI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1 max-w-md">
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
                <div className="flex-1 max-w-md">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por estado de evaluación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las inscripciones</SelectItem>
                      <SelectItem value="evaluated">Solo evaluadas</SelectItem>
                      <SelectItem value="pending">Solo pendientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  {isSuperAdmin && (
                    <Button 
                      variant="default" 
                      onClick={() => navigate('/admin/assisted-inscription')}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Inscripción Asistida
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={refreshInscriptions}
                    disabled={inscriptionsLoading}
                  >
                    Actualizar
                  </Button>
                </div>
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


              {/* Inscriptions Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Inscripciones del Período</CardTitle>
                      <CardDescription>
                        Mostrando {filteredInscriptions.length} de {inscriptions.length} inscripciones
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {inscriptionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Cargando inscripciones...</p>
                      </div>
                    </div>
                  ) : (
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
                          {filteredInscriptions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={isSuperAdmin || isEvaluator ? 8 : 7} className="text-center py-8">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                  {searchTerm.trim() 
                                    ? `No se encontraron inscripciones que coincidan con "${searchTerm}"`
                                    : statusFilter === 'all' 
                                      ? 'No hay inscripciones para este período'
                                      : `No hay inscripciones ${statusFilter === 'evaluated' ? 'evaluadas' : 'pendientes'} para este período`
                                  }
                                </p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredInscriptions.map((inscription: any) => (
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
                                      onClick={() => {
                                        // Create return URL with current filters
                                        const returnParams = new URLSearchParams();
                                        if (selectedPeriodId) returnParams.set('period', selectedPeriodId);
                                        if (statusFilter !== 'all') returnParams.set('status', statusFilter);
                                        if (searchTerm.trim()) returnParams.set('search', searchTerm);
                                        
                                        const returnUrl = returnParams.toString() 
                                          ? `/inscription-management?${returnParams.toString()}`
                                          : '/inscription-management';
                                        
                                        // Navigate to evaluation page with return URL
                                        navigate(`/inscriptions/${inscription.id}?returnTo=${encodeURIComponent(returnUrl)}`);
                                      }}
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
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!selectedPeriodId && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Seleccionar Período</h3>
                  <p className="text-muted-foreground mb-4">
                    Seleccione un período de inscripción para ver las inscripciones
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InscriptionManagement;
