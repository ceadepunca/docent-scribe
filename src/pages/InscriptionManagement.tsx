import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Users, BookOpen, Eye, CheckCircle2, Clock, ArrowLeft, Search, UserPlus, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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
    pagination,
    loading: inscriptionsLoading, 
    fetchInscriptionsByPeriod,
    refreshInscriptions,
    goToPage
  } = usePeriodInscriptions();

  useEffect(() => {
    fetchAllPeriods();
    
    const periodFromUrl = searchParams.get('period');
    const statusFromUrl = searchParams.get('status');
    const searchFromUrl = searchParams.get('search');
    
    const savedPeriod = localStorage.getItem('inscription-management-period');
    const savedStatus = localStorage.getItem('inscription-management-status');
    const savedSearch = localStorage.getItem('inscription-management-search');
    
    if (periodFromUrl) {
      setSelectedPeriodId(periodFromUrl);
    } else if (savedPeriod) {
      setSelectedPeriodId(savedPeriod);
    }
    
    if (statusFromUrl) {
      const mapped = statusFromUrl === 'not_evaluated' ? 'pending' : statusFromUrl;
      setStatusFilter(mapped);
    } else if (savedStatus) {
      const mapped = savedStatus === 'not_evaluated' ? 'pending' : savedStatus;
      setStatusFilter(mapped);
    }
    
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    } else if (savedSearch) {
      setSearchTerm(savedSearch);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (selectedPeriodId) {
      params.set('period', selectedPeriodId);
      localStorage.setItem('inscription-management-period', selectedPeriodId);
    } else {
      params.delete('period');
      localStorage.removeItem('inscription-management-period');
    }
    
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
      localStorage.setItem('inscription-management-status', statusFilter);
    } else {
      params.delete('status');
      localStorage.removeItem('inscription-management-status');
    }
    
    if (searchTerm.trim()) {
      params.set('search', searchTerm);
      localStorage.setItem('inscription-management-search', searchTerm);
    } else {
      params.delete('search');
      localStorage.removeItem('inscription-management-search');
    }
    
    setSearchParams(params, { replace: true });
  }, [selectedPeriodId, statusFilter, searchTerm, setSearchParams]);

  useEffect(() => {
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
    const state = inscription.evaluation_state ?? (inscription.evaluations?.some((ev: any) => ev.status === 'completed') ? 'evaluada' : 'pendiente');
    return state === 'evaluada' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  const getEvaluationStatusLabel = (inscription: any) => {
    const state = inscription.evaluation_state ?? (inscription.evaluations?.some((ev: any) => ev.status === 'completed') ? 'evaluada' : 'pendiente');
    return state === 'evaluada' ? 'Eval' : 'Pend';
  };

  const getEvaluationStatusIcon = (inscription: any) => {
    const state = inscription.evaluation_state ?? (inscription.evaluations?.some((ev: any) => ev.status === 'completed') ? 'evaluada' : 'pendiente');
    return state === 'evaluada' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />;
  };

  const normalizeText = (text: string): string => {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const filteredInscriptions = inscriptions.filter((inscription: any) => {
    if (searchTerm.trim()) {
      const profileRaw = inscription.profiles;
      const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
      if (!profile) return false;
      
      const normalizedSearch = normalizeText(searchTerm);
      const tokens = normalizedSearch.split(' ');
      
      const firstName = normalizeText(profile.first_name || '');
      const lastName = normalizeText(profile.last_name || '');
      const fullName = normalizeText(`${firstName} ${lastName}`);
      const reversedName = normalizeText(`${lastName} ${firstName}`);
      const dni = normalizeText(profile.dni || '');
      
      const haystacks = [fullName, reversedName, firstName, lastName, dni];
      const matchesSearch = tokens.every((tok) => haystacks.some((h) => h.includes(tok)));
      
      if (!matchesSearch) return false;
    }
    
    if (statusFilter === 'all') return true;

    const state: 'evaluada' | 'pendiente' = inscription.evaluation_state ?? (inscription.evaluations?.some((ev: any) => ev.status === 'completed') ? 'evaluada' : 'pendiente');

    if (statusFilter === 'evaluated') {
      return state === 'evaluada';
    } else if (statusFilter === 'pending') {
      return state === 'pendiente';
    }
    
    return true;
  });

  if (periodsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando períodos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-8xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <CardTitle className="text-2xl font-bold text-foreground">Gestión de Inscripciones</CardTitle>
                <CardDescription>Administre y evalúe las inscripciones de docentes.</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="self-start sm:self-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar un período..." />
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

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, apellido o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 w-full"
                  disabled={!selectedPeriodId}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!selectedPeriodId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="evaluated">Solo evaluadas</SelectItem>
                  <SelectItem value="pending">Solo pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedPeriod && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center p-3 border rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-3 border rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-green-600">{stats.evaluated}</div>
                  <div className="text-sm text-muted-foreground">Evaluadas</div>
                </div>
                <div className="text-center p-3 border rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-muted-foreground">Pendientes</div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  {isSuperAdmin && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/admin/assisted-inscription')}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Asistida
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={refreshInscriptions}
                    disabled={inscriptionsLoading}
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${inscriptionsLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedPeriodId ? (
          <Card>
            <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  Página {pagination.currentPage} de {pagination.totalPages} - Mostrando {(pagination.currentPage - 1) * pagination.pageSize + 1}-{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} de {pagination.totalItems} inscripciones para "{selectedPeriod?.name}"
                </CardDescription>
            </CardHeader>
            <CardContent>
              {inscriptionsLoading ? (
                <div className="flex items-center justify-center py-16">
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
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">DNI</TableHead>
                        <TableHead>Nivel</TableHead>
                        <TableHead className="hidden lg:table-cell">Período</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Evaluación</TableHead>
                        {(isSuperAdmin || isEvaluator) && <TableHead className="text-right">Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInscriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isSuperAdmin || isEvaluator ? 8 : 7} className="text-center py-16">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="font-semibold">No se encontraron inscripciones</p>
                            <p className="text-muted-foreground text-sm">
                              {searchTerm.trim() 
                                ? `Ningún resultado para "${searchTerm}"`
                                : 'Intente cambiar los filtros o seleccione otro período.'
                              }
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInscriptions.map((inscription: any) => (
                          <TableRow key={inscription.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{`${inscription.profiles?.first_name || ''} ${inscription.profiles?.last_name || ''}`.trim() || 'Sin nombre'}</TableCell>
                            <TableCell className="hidden md:table-cell">{inscription.profiles?.email || '-'}</TableCell>
                            <TableCell className="hidden lg:table-cell">{inscription.profiles?.dni || '-'}</TableCell>
                            <TableCell><Badge variant="outline">{inscription.teaching_level}</Badge></TableCell>
                            <TableCell className="hidden lg:table-cell"><Badge variant="outline" className="text-xs">{selectedPeriod?.name || '-'}</Badge></TableCell>
                            <TableCell><Badge className={getStatusColor(inscription.status)}>{getStatusLabel(inscription.status)}</Badge></TableCell>
                            <TableCell>
                              <Badge className={getEvaluationStatusColor(inscription)}>
                                {getEvaluationStatusIcon(inscription)}
                                {getEvaluationStatusLabel(inscription)}
                              </Badge>
                            </TableCell>
                            {(isSuperAdmin || isEvaluator) && (
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/inscriptions/${inscription.id}?from=evaluations&period=${selectedPeriodId}&status=${statusFilter}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
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
              
              {!inscriptionsLoading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(pagination.currentPage - 1) * pagination.pageSize + 1}-{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} de {pagination.totalItems}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center py-16">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Seleccione un Período</h3>
                <p className="text-muted-foreground">Para comenzar, elija un período de inscripción de la lista.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InscriptionManagement;