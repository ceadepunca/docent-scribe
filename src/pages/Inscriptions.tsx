import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, Edit2, Clock, CheckCircle2, XCircle, AlertCircle, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Inscription {
  id: string;
  status: string;
  subject_area: string;
  teaching_level: string;
  experience_years: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  has_evaluation?: boolean;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    dni?: string;
  } | null;
}

const Inscriptions = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isEvaluator, isDocente } = useAuth();
  const { toast } = useToast();
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [filteredInscriptions, setFilteredInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit2 className="h-4 w-4" />;
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'under_review': return <AlertCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'requires_changes': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'inicial': return 'Educación Inicial';
      case 'primaria': return 'Educación Primaria';
      case 'secundaria': return 'Educación Secundaria';
      case 'superior': return 'Educación Superior';
      case 'universitario': return 'Universitario';
      default: return level;
    }
  };

  useEffect(() => {
    fetchInscriptions();
  }, [user]);

  const fetchInscriptions = async () => {
    if (!user) return;

    try {
      // Build inscriptions query
      let inscriptionsQuery = supabase
        .from('inscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      // If not super admin or evaluator, only show own inscriptions
      if (!isSuperAdmin && !isEvaluator) {
        inscriptionsQuery = inscriptionsQuery.eq('user_id', user.id);
      }

      const { data: inscriptionsData, error: inscriptionsError } = await inscriptionsQuery;

      if (inscriptionsError) throw inscriptionsError;

      // Get unique user IDs to fetch profiles
      const userIds = [...new Set(inscriptionsData?.map(inscription => inscription.user_id) || [])];
      
      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, dni')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create profiles map for easy lookup
      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);

      // Get inscription IDs to check for evaluations
      const inscriptionIds = inscriptionsData?.map(inscription => inscription.id) || [];
      
      // Fetch evaluations for these inscriptions
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('evaluations')
        .select('inscription_id')
        .in('inscription_id', inscriptionIds);

      if (evaluationsError) throw evaluationsError;

      // Create set of inscription IDs that have evaluations
      const evaluatedInscriptionIds = new Set(evaluationsData?.map(evaluation => evaluation.inscription_id) || []);

      // Combine inscriptions with profiles and evaluation status
      const inscriptionsWithProfiles = inscriptionsData?.map(inscription => ({
        ...inscription,
        profiles: profilesMap.get(inscription.user_id) || null,
        has_evaluation: evaluatedInscriptionIds.has(inscription.id)
      })) || [];

      console.log('Debug - Inscriptions with profiles:', inscriptionsWithProfiles);
      setInscriptions(inscriptionsWithProfiles);
      setFilteredInscriptions(inscriptionsWithProfiles);
    } catch (error) {
      console.error('Error fetching inscriptions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las inscripciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter inscriptions based on search term and status
  useEffect(() => {
    let filtered = inscriptions;

    // Filter by search term (name, email, or DNI)
    if (searchTerm.trim()) {
      filtered = filtered.filter(inscription => {
        const profile = inscription.profiles;
        if (!profile) return false;
        
        const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
        const email = profile.email.toLowerCase();
        const dni = profile.dni?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || email.includes(search) || dni.includes(search);
      });
    }

    // Filter by evaluation status
    if (statusFilter === 'evaluated') {
      filtered = filtered.filter(inscription => inscription.has_evaluation);
    } else if (statusFilter === 'not_evaluated') {
      filtered = filtered.filter(inscription => !inscription.has_evaluation);
    }

    setFilteredInscriptions(filtered);
  }, [inscriptions, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando inscripciones...</p>
        </div>
      </div>
    );
  }

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
          
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {(isSuperAdmin || isEvaluator) && !isDocente ? 'Gestión de Inscripciones' : 'Mis Inscripciones'}
                </h1>
                <p className="text-muted-foreground">
                  {(isSuperAdmin || isEvaluator) && !isDocente 
                    ? 'Administrar todas las inscripciones del sistema' 
                    : 'Gestiona tus postulaciones como docente'
                  }
                </p>
              </div>
              {isDocente && (
                <Button
                  onClick={() => navigate('/inscriptions/new')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Inscripción
                </Button>
              )}
            </div>

            {/* Search and Filters - Only for admins/evaluators */}
            {(isSuperAdmin || isEvaluator) && inscriptions.length > 0 && (
              <div className="bg-card p-4 rounded-lg border space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por nombre, email o DNI del docente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="evaluated">Evaluada</SelectItem>
                      <SelectItem value="not_evaluated">No evaluada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredInscriptions.length} de {inscriptions.length} inscripciones
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredInscriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No se encontraron inscripciones'
                    : (isSuperAdmin || isEvaluator) && !isDocente 
                      ? 'No hay inscripciones en el sistema' 
                      : 'No tienes inscripciones'
                  }
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : (isSuperAdmin || isEvaluator) && !isDocente 
                      ? 'No hay inscripciones registradas en el sistema actualmente'
                      : 'Comienza creando tu primera inscripción como docente'
                  }
                </p>
                {isDocente && (
                  <Button
                    onClick={() => navigate('/inscriptions/new')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Primera Inscripción
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {(isSuperAdmin || isEvaluator) && (
                        <>
                          <TableHead>Docente</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>DNI</TableHead>
                        </>
                      )}
                      <TableHead>Área/Materia</TableHead>
                      <TableHead>Nivel Educativo</TableHead>
                      <TableHead>Experiencia</TableHead>
                      <TableHead>Estado de Evaluación</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInscriptions.map((inscription) => (
                      <TableRow key={inscription.id}>
                        {(isSuperAdmin || isEvaluator) && (
                          <>
                            <TableCell>
                              {inscription.profiles ? (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {inscription.profiles.first_name} {inscription.profiles.last_name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Sin información</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {inscription.profiles?.email || 'No disponible'}
                            </TableCell>
                            <TableCell>
                              {inscription.profiles?.dni || 'No disponible'}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <span className="font-medium">{inscription.subject_area}</span>
                        </TableCell>
                        <TableCell>
                          {getLevelLabel(inscription.teaching_level)}
                        </TableCell>
                        <TableCell>
                          {inscription.experience_years} {inscription.experience_years === 1 ? 'año' : 'años'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={inscription.has_evaluation 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                            }
                          >
                            {inscription.has_evaluation ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Evaluada
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                No evaluada
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(inscription.created_at), 'dd/MM/yyyy', { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/inscriptions/${inscription.id}`)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              Ver
                            </Button>
                            {['draft', 'requires_changes'].includes(inscription.status) && 
                             (inscription.user_id === user.id || isDocente) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/inscriptions/${inscription.id}/edit`)}
                                className="flex items-center gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                Editar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Inscriptions;