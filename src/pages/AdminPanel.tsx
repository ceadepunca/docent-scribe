import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Calendar, Users, BookOpen, ClipboardList, Eye, Clock, Check, X, Settings, Upload, UserPlus2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDeletionRequests } from '@/hooks/useDeletionRequests';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TeacherManagementTab } from '@/components/admin/TeacherManagementTab';
import { AdminImportWrapper } from '@/components/admin/AdminImportWrapper';
import { GoogleFormsImportModal } from '@/components/admin/GoogleFormsImportModal';

interface RecentInscription {
  id: string;
  subject_area: string;
  teaching_level: string;
  status: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

const AdminPanel = () => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requests, fetchAllRequests, respondToRequest } = useDeletionRequests();
  
  const [periodForm, setPeriodForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    availableLevels: [] as ('inicial' | 'primario' | 'secundario')[],
  });
  
  const [recentInscriptions, setRecentInscriptions] = useState<RecentInscription[]>([]);
  const [stats, setStats] = useState({
    totalInscriptions: 0,
    activePeriods: 0,
    registeredFiles: 0
  });
  
  const [showGoogleFormsImport, setShowGoogleFormsImport] = useState(false);
  const [selectedPeriodForImport, setSelectedPeriodForImport] = useState<{id: string, name: string} | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStats();
      fetchRecentInscriptions();
      fetchAllRequests();
      fetchAvailablePeriods();
    }
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            No tiene permisos para acceder al panel de administración.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const fetchStats = async () => {
    try {
      // Fetch total inscriptions
      const { count: inscriptionsCount } = await supabase
        .from('inscriptions')
        .select('*', { count: 'exact', head: true });

      // Fetch active periods
      const { count: periodsCount } = await supabase
        .from('inscription_periods')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch profile documents count
      const { count: documentsCount } = await supabase
        .from('profile_documents')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalInscriptions: inscriptionsCount || 0,
        activePeriods: periodsCount || 0,
        registeredFiles: documentsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentInscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('inscriptions')
        .select(`
          id,
          subject_area,
          teaching_level,
          status,
          created_at,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentInscriptions((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching recent inscriptions:', error);
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('inscription_periods')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailablePeriods(data || []);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

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

  const handleLevelChange = (level: 'inicial' | 'primario' | 'secundario', checked: boolean) => {
    setPeriodForm(prev => ({
      ...prev,
      availableLevels: checked 
        ? [...prev.availableLevels, level]
        : prev.availableLevels.filter(l => l !== level)
    }));
  };

  const createPeriod = async () => {
    if (!user || !periodForm.name || !periodForm.startDate || !periodForm.endDate || periodForm.availableLevels.length === 0) {
      toast({
        title: 'Error',
        description: 'Complete todos los campos obligatorios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('inscription_periods')
        .insert({
          name: periodForm.name,
          description: periodForm.description,
          start_date: periodForm.startDate,
          end_date: periodForm.endDate,
          available_levels: periodForm.availableLevels,
          is_active: true,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Período Creado',
        description: 'El período de inscripción ha sido creado exitosamente.',
      });

      // Reset form
      setPeriodForm({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        availableLevels: [],
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el período. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Administración</h1>
            <p className="text-muted-foreground">
              Gestión de períodos de inscripción y administración de docentes
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Panel General
            </TabsTrigger>
            <TabsTrigger value="periods" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Períodos y Listados
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gestión de Docentes
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar Datos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Períodos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.activePeriods}</p>
              <p className="text-muted-foreground">Períodos disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Inscripciones Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalInscriptions}</p>
              <p className="text-muted-foreground">En el sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Documentos Cargados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.registeredFiles}</p>
              <p className="text-muted-foreground">Archivos en el sistema</p>
            </CardContent>
          </Card>
        </div>

        {/* Deletion Requests Management */}
        {requests.filter(r => r.status === 'pending').length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Solicitudes de Eliminación Pendientes
              </CardTitle>
              <CardDescription>
                Revisar y aprobar/rechazar solicitudes de eliminación de inscripciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests
                  .filter(r => r.status === 'pending')
                  .map((request: any) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {request.inscriptions?.profiles?.first_name} {request.inscriptions?.profiles?.last_name}
                            </h4>
                            <Badge variant="outline">
                              {request.inscriptions?.teaching_level}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Área: {request.inscriptions?.subject_area}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Email: {request.inscriptions?.profiles?.email}
                          </p>
                          {request.reason && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Motivo:</p>
                              <p className="text-sm text-muted-foreground">{request.reason}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Solicitado: {format(new Date(request.requested_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              try {
                                await respondToRequest(request.id, 'approved', 'Solicitud aprobada por administrador');
                                toast({
                                  title: "Solicitud aprobada",
                                  description: "La inscripción ha sido eliminada. El usuario puede crear una nueva."
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "No se pudo aprobar la solicitud.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await respondToRequest(request.id, 'rejected', 'Solicitud rechazada por administrador');
                                toast({
                                  title: "Solicitud rechazada",
                                  description: "La solicitud ha sido rechazada."
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "No se pudo rechazar la solicitud.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nuevo Período de Inscripción
              </CardTitle>
              <CardDescription>
                Crear un nuevo período para inscripciones docentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Período *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Inscripción Extraordinaria 2026"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción opcional del período"
                  value={periodForm.description}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={periodForm.startDate}
                    onChange={(e) => setPeriodForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Fecha de Fin *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={periodForm.endDate}
                    onChange={(e) => setPeriodForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Niveles Disponibles *</Label>
                <div className="flex flex-col gap-2 mt-2">
                  {(['inicial', 'primario', 'secundario'] as const).map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={periodForm.availableLevels.includes(level)}
                        onCheckedChange={(checked) => handleLevelChange(level, !!checked)}
                      />
                      <Label htmlFor={level} className="capitalize">
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={createPeriod} className="w-full">
                Crear Período
              </Button>
            </CardContent>
          </Card>

          {/* Recent Inscriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Inscripciones Recientes
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/inscriptions')}
                >
                  Ver todas
                </Button>
              </CardTitle>
              <CardDescription>
                Últimas inscripciones registradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentInscriptions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay inscripciones registradas
                </p>
              ) : (
                <div className="space-y-3">
                  {recentInscriptions.map((inscription) => (
                    <div key={inscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{inscription.subject_area}</p>
                        <p className="text-xs text-muted-foreground">
                          {inscription.profiles?.first_name} {inscription.profiles?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(inscription.created_at), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(inscription.status)} text-xs`}>
                          {getStatusLabel(inscription.status)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/inscriptions/${inscription.id}`)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Acciones Rápidas
            </CardTitle>
            <CardDescription>
              Herramientas administrativas y accesos directos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/assisted-inscription')}
                className="flex items-center gap-2 h-auto p-4"
              >
                <UserPlus className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Inscripción Asistida</div>
                  <div className="text-sm text-muted-foreground">Crear inscripción individual</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/admin/bulk-inscription')}
                className="flex items-center gap-2 h-auto p-4"
              >
                <UserPlus2 className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Inscripción Masiva</div>
                  <div className="text-sm text-muted-foreground">Inscribir múltiples docentes</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/inscriptions')}
                className="flex items-center gap-2 h-auto p-4"
              >
                <Eye className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Ver Inscripciones</div>
                  <div className="text-sm text-muted-foreground">Revisar todas las inscripciones</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
            </div>
          </TabsContent>

          <TabsContent value="periods" className="mt-6">
            <AdminImportWrapper />
          </TabsContent>

          <TabsContent value="teachers" className="mt-6">
            <TeacherManagementTab />
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <div className="space-y-6">
              <AdminImportWrapper />
              
              {/* Google Forms Import Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Importar desde Google Forms
                  </CardTitle>
                  <CardDescription>
                    Importar docentes e inscripciones desde archivo CSV de Google Forms con materias específicas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availablePeriods.map((period) => (
                      <Card key={period.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{period.name}</h4>
                              <Badge variant="outline" className="mt-1">
                                Activo
                              </Badge>
                            </div>
                            <Button
                              onClick={() => {
                                setSelectedPeriodForImport({
                                  id: period.id,
                                  name: period.name
                                });
                                setShowGoogleFormsImport(true);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Importar CSV
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {availablePeriods.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay períodos activos disponibles para importar
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Google Forms Import Modal */}
        {selectedPeriodForImport && (
          <GoogleFormsImportModal
            open={showGoogleFormsImport}
            onOpenChange={setShowGoogleFormsImport}
            periodId={selectedPeriodForImport.id}
            periodName={selectedPeriodForImport.name}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;