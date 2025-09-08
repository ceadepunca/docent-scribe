import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, Edit2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

const Inscriptions = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isEvaluator, isDocente } = useAuth();
  const { toast } = useToast();
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create profiles map for easy lookup
      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);

      // Combine inscriptions with profiles
      const inscriptionsWithProfiles = inscriptionsData?.map(inscription => ({
        ...inscription,
        profiles: profilesMap.get(inscription.user_id) || null
      })) || [];

      setInscriptions(inscriptionsWithProfiles);
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
          
          <div className="flex items-center justify-between mb-8">
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
        </div>

        {inscriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {(isSuperAdmin || isEvaluator) && !isDocente ? 'No hay inscripciones en el sistema' : 'No tienes inscripciones'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {(isSuperAdmin || isEvaluator) && !isDocente 
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inscriptions.map((inscription) => (
              <Card key={inscription.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{inscription.subject_area}</CardTitle>
                      <CardDescription>{getLevelLabel(inscription.teaching_level)}</CardDescription>
                      {(isSuperAdmin || isEvaluator) && inscription.profiles && (
                        <CardDescription className="text-xs text-primary">
                          {inscription.profiles.first_name} {inscription.profiles.last_name} ({inscription.profiles.email})
                        </CardDescription>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(inscription.status)} flex items-center gap-1`}>
                      {getStatusIcon(inscription.status)}
                      {getStatusLabel(inscription.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">Experiencia:</span>{' '}
                      {inscription.experience_years} {inscription.experience_years === 1 ? 'año' : 'años'}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <div>Creada: {format(new Date(inscription.created_at), 'dd/MM/yyyy', { locale: es })}</div>
                      <div>Actualizada: {format(new Date(inscription.updated_at), 'dd/MM/yyyy', { locale: es })}</div>
                    </div>

                    <div className="flex gap-2 pt-2">
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inscriptions;