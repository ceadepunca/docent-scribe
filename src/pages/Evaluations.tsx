import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Eye, Calendar, GraduationCap, BookOpen, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InscriptionWithProfile {
  id: string;
  status: string;
  subject_area: string;
  teaching_level: string;
  experience_years: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    dni?: string;
  } | null;
}

const Evaluations = () => {
  const navigate = useNavigate();
  const { user, isEvaluator, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [inscriptions, setInscriptions] = useState<InscriptionWithProfile[]>([]);
  const [filteredInscriptions, setFilteredInscriptions] = useState<InscriptionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    if (!isEvaluator && !isSuperAdmin) {
      navigate('/unauthorized');
      return;
    }
    fetchInscriptions();
  }, [user, isEvaluator, isSuperAdmin]);

  useEffect(() => {
    filterInscriptions();
  }, [inscriptions, searchTerm, statusFilter, levelFilter]);

  const fetchInscriptions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Try embedded join first (should work now with foreign key)
      let { data: inscriptionsData, error: inscriptionsError } = await supabase
        .from('inscriptions')
        .select(`
          id,
          status,
          subject_area,
          teaching_level,
          experience_years,
          created_at,
          updated_at,
          user_id,
          profiles:user_id (
            first_name,
            last_name,
            email,
            dni
          )
        `)
        .in('status', ['submitted', 'under_review', 'approved', 'rejected', 'requires_changes'])
        .order('created_at', { ascending: false });

      // If embedded join fails, fall back to separate queries
      if (inscriptionsError || !inscriptionsData) {
        console.warn('Embedded join failed, falling back to separate queries:', inscriptionsError);
        
        // Get inscriptions first
        const { data: basicInscriptions, error: basicError } = await supabase
          .from('inscriptions')
          .select('id, status, subject_area, teaching_level, experience_years, created_at, updated_at, user_id')
          .in('status', ['submitted', 'under_review', 'approved', 'rejected', 'requires_changes'])
          .order('created_at', { ascending: false });

        if (basicError) throw basicError;

        // Get unique user IDs and fetch profiles
        const userIds = [...new Set(basicInscriptions?.map(inscription => inscription.user_id) || [])];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, dni')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create profiles map and combine data
        const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);
        
        inscriptionsData = basicInscriptions?.map(inscription => ({
          ...inscription,
          profiles: profilesMap.get(inscription.user_id) || null
        })) || [];
      } else {
        // Transform embedded join data to match our interface
        inscriptionsData = inscriptionsData?.map(inscription => ({
          ...inscription,
          profiles: Array.isArray(inscription.profiles) && inscription.profiles.length > 0 
            ? inscription.profiles[0] 
            : null
        })) || [];
      }

      console.log('Successfully fetched inscriptions:', inscriptionsData?.length || 0);
      setInscriptions(inscriptionsData as InscriptionWithProfile[] || []);
      
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

  const filterInscriptions = () => {
    let filtered = inscriptions;

    // Search by name, last name, email or DNI
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inscription => {
        const profile = inscription.profiles;
        if (!profile) return false;
        
        return (
          profile.first_name?.toLowerCase().includes(term) ||
          profile.last_name?.toLowerCase().includes(term) ||
          profile.email?.toLowerCase().includes(term) ||
          profile.dni?.toLowerCase().includes(term) ||
          `${profile.first_name} ${profile.last_name}`.toLowerCase().includes(term)
        );
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inscription => inscription.status === statusFilter);
    }

    // Filter by teaching level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(inscription => inscription.teaching_level === levelFilter);
    }

    setFilteredInscriptions(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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
      case 'submitted': return 'Enviada';
      case 'under_review': return 'En Revisión';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'requires_changes': return 'Requiere Cambios';
      default: return 'Desconocido';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'inicial': return 'Inicial';
      case 'primaria': return 'Primaria';
      case 'secundaria': return 'Secundaria';
      case 'secundario': return 'Secundario';
      case 'superior': return 'Superior';
      case 'universitario': return 'Universitario';
      default: return level;
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Evaluación de Inscripciones
          </h1>
          <p className="text-muted-foreground">
            Gestiona y evalúa las inscripciones de docentes
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre, apellido, email o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="submitted">Enviada</SelectItem>
                  <SelectItem value="under_review">En Revisión</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                  <SelectItem value="requires_changes">Requiere Cambios</SelectItem>
                </SelectContent>
              </Select>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  <SelectItem value="inicial">Inicial</SelectItem>
                  <SelectItem value="primaria">Primaria</SelectItem>
                  <SelectItem value="secundario">Secundario</SelectItem>
                  <SelectItem value="superior">Superior</SelectItem>
                  <SelectItem value="universitario">Universitario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Mostrando {filteredInscriptions.length} de {inscriptions.length} inscripciones
          </p>
        </div>

        {/* Inscriptions List */}
        {filteredInscriptions.length === 0 ? (
          <Card>
            <CardContent className="text-center p-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay inscripciones</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || levelFilter !== 'all'
                  ? 'No se encontraron inscripciones que coincidan con los filtros.'
                  : 'No hay inscripciones para evaluar en este momento.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredInscriptions.map((inscription) => (
              <Card key={inscription.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold">
                            {inscription.profiles ? 
                              `${inscription.profiles.first_name} ${inscription.profiles.last_name}` : 
                              'Usuario no encontrado'
                            }
                          </h3>
                        </div>
                        <Badge className={getStatusColor(inscription.status)}>
                          {getStatusLabel(inscription.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{inscription.profiles?.email || 'No disponible'}</p>
                        </div>
                        {inscription.profiles?.dni && (
                          <div>
                            <p className="text-sm text-muted-foreground">DNI</p>
                            <p className="font-medium">{inscription.profiles.dni}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Nivel Educativo</p>
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{getLevelLabel(inscription.teaching_level)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {inscription.teaching_level !== 'secundario' && (
                          <div>
                            <p className="text-sm text-muted-foreground">Área Temática</p>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">{inscription.subject_area}</p>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Experiencia</p>
                          <p className="font-medium">
                            {inscription.experience_years} {inscription.experience_years === 1 ? 'año' : 'años'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Fecha de Inscripción</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">
                              {format(new Date(inscription.created_at), 'dd/MM/yyyy', { locale: es })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/inscriptions/${inscription.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalle
                      </Button>
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

export default Evaluations;