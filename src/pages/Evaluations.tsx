import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Eye, Calendar, GraduationCap, BookOpen, Filter, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
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
  inscription_period_id: string;
  evaluation_state: 'evaluada' | 'pendiente';
  inscription_period?: {
    id: string;
    name: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    dni?: string;
  } | null;
}

const Evaluations = () => {
  const navigate = useNavigate();
  const { user, isEvaluator, isSuperAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { periods, loading: periodsLoading, getCurrentPeriods } = useInscriptionPeriods();
  const [inscriptions, setInscriptions] = useState<InscriptionWithProfile[]>([]);
  const [groupedInscriptions, setGroupedInscriptions] = useState<Record<string, InscriptionWithProfile[]>>({});
  const [duplicatesFound, setDuplicatesFound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isEvaluator && !isSuperAdmin) {
      navigate('/unauthorized');
      return;
    }
    fetchInscriptions();
  }, [authLoading, user, isEvaluator, isSuperAdmin]);

  useEffect(() => {
    processInscriptions();
  }, [inscriptions, searchTerm, statusFilter, levelFilter, periodFilter]);

  const fetchInscriptions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all inscriptions with evaluation status and period info
      const { data: allInscriptions, error: allError } = await supabase
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
          inscription_period_id,
          inscription_periods!inner(
            id,
            name
          ),
          inscription_subject_selections(
            id,
            subject_id,
            subjects(name)
          )
        `)
        .in('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'requires_changes'])
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      // Include all inscriptions regardless of subject selections (temporarily ignore subjects)
      const validInscriptions = allInscriptions || [];

      // Get evaluations for valid inscriptions only
      const inscriptionIds = validInscriptions.map(i => i.id) || [];
      const { data: evaluationsData, error: evalError } = inscriptionIds.length > 0
        ? await supabase
            .from('evaluations')
            .select('inscription_id, id')
            .in('inscription_id', inscriptionIds)
        : { data: [], error: null };

      if (evalError) throw evalError;

      // Create evaluation map
      const evaluationMap = new Set(evaluationsData?.map(e => e.inscription_id) || []);

      // Get unique user IDs and fetch profiles for valid inscriptions only
      const userIds = [...new Set(validInscriptions.map(inscription => inscription.user_id) || [])];
      
      const { data: profilesData, error: profilesError } = userIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, dni, user_id')
            .in('id', userIds)
        : { data: [], error: null };

      if (profilesError) throw profilesError;

      // Create profiles map and combine data for valid inscriptions only
      const profilesMap = new Map<string, any>();
      profilesData?.forEach(profile => profilesMap.set(profile.id, profile));
      
      const inscriptionsData: InscriptionWithProfile[] = validInscriptions.map(inscription => ({
        id: inscription.id,
        status: inscription.status,
        subject_area: inscription.subject_area,
        teaching_level: inscription.teaching_level,
        experience_years: inscription.experience_years,
        created_at: inscription.created_at,
        updated_at: inscription.updated_at,
        user_id: inscription.user_id,
        inscription_period_id: inscription.inscription_period_id,
  evaluation_state: evaluationMap.has(inscription.id) ? 'evaluada' as const : 'pendiente' as const,
        inscription_period: inscription.inscription_periods,
        profiles: profilesMap.get(inscription.user_id) || null
      }));

      console.log('Successfully fetched inscriptions:', inscriptionsData.length);
      setInscriptions(inscriptionsData);

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

  // Deduplicate inscriptions: keep most recent per user/level
  const deduplicateInscriptions = (inscriptions: InscriptionWithProfile[]) => {
    const userLevelMap = new Map<string, InscriptionWithProfile>();
    let duplicatesCount = 0;

    inscriptions.forEach(inscription => {
      const key = `${inscription.user_id}-${inscription.teaching_level}`;
      const existing = userLevelMap.get(key);
      
      if (existing) {
        duplicatesCount++;
        // Keep the most recent one
        if (new Date(inscription.created_at) > new Date(existing.created_at)) {
          userLevelMap.set(key, inscription);
        }
      } else {
        userLevelMap.set(key, inscription);
      }
    });

    setDuplicatesFound(duplicatesCount);
    return Array.from(userLevelMap.values());
  };

  const processInscriptions = () => {
    let filtered = [...inscriptions];

    // Apply deduplication first
    filtered = deduplicateInscriptions(filtered);

    // Apply filters
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inscription => inscription.evaluation_state === statusFilter);
    }

    if (periodFilter !== 'all') {
      filtered = filtered.filter(inscription => inscription.inscription_period_id === periodFilter);
    }

    // Group by teaching level
    const grouped: Record<string, InscriptionWithProfile[]> = {};
    
    filtered.forEach(inscription => {
      const level = inscription.teaching_level;
      if (!grouped[level]) {
        grouped[level] = [];
      }
      
      // If level filter is applied, only include matching levels
      if (levelFilter === 'all' || level === levelFilter) {
        grouped[level].push(inscription);
      }
    });

    // Sort inscriptions within each group by creation date (newest first)
    Object.keys(grouped).forEach(level => {
      grouped[level].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    setGroupedInscriptions(grouped);
  };

  const getTotalInscriptions = () => {
    return Object.values(groupedInscriptions).reduce((total, level) => total + level.length, 0);
  };

  const renderInscriptionTable = (inscriptions: InscriptionWithProfile[], level: string) => (
    <Card key={level} className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          {getLevelLabel(level)}
          <Badge variant="secondary" className="ml-2">
            {inscriptions.length} inscripción{inscriptions.length !== 1 ? 'es' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Docente</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>DNI</TableHead>
              {level !== 'secundario' && <TableHead>Área/Materia</TableHead>}
              <TableHead>Período</TableHead>
              <TableHead>Experiencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inscriptions.map((inscription) => (
              <TableRow key={inscription.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {inscription.profiles ? 
                      `${inscription.profiles.first_name} ${inscription.profiles.last_name}` : 
                      'Usuario no encontrado'
                    }
                  </div>
                </TableCell>
                <TableCell>{inscription.profiles?.email || 'No disponible'}</TableCell>
                <TableCell>{inscription.profiles?.dni || '-'}</TableCell>
                {level !== 'secundario' && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      {inscription.subject_area}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {inscription.inscription_period?.name || 'Sin período'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {inscription.experience_years} {inscription.experience_years === 1 ? 'año' : 'años'}
                </TableCell>
                <TableCell>
                  <Badge className={getEvaluationStatusColor(inscription.evaluation_state)}>
                    {getEvaluationStatusLabel(inscription.evaluation_state)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(inscription.created_at), 'dd/MM/yyyy', { locale: es })}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams({
                        from: 'evaluations',
                        period: inscription.inscription_period_id,
                        ...(levelFilter !== 'all' && { level: levelFilter }),
                        ...(statusFilter !== 'all' && { status: statusFilter })
                      });
                      navigate(`/inscriptions/${inscription.id}?${params.toString()}`);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

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

  const getEvaluationStatusColor = (status: 'evaluada' | 'pendiente') => {
    switch (status) {
      case 'evaluada': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-gray-100 text-gray-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEvaluationStatusLabel = (status: 'evaluada' | 'pendiente') => {
    switch (status) {
      case 'evaluada': return 'Evaluada';
      case 'pendiente': return 'Pendiente';
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Período de inscripción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los períodos</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado de Evaluación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="evaluada">Evaluada</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
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

        {/* Results Summary & Duplicates Warning */}
        <div className="mb-6 space-y-2">
          <p className="text-muted-foreground">
            Mostrando {getTotalInscriptions()} de {inscriptions.length} inscripciones
            {duplicatesFound > 0 && ` (${duplicatesFound} duplicados eliminados)`}
          </p>
          {duplicatesFound > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    Se encontraron {duplicatesFound} inscripción{duplicatesFound !== 1 ? 'es' : ''} duplicada{duplicatesFound !== 1 ? 's' : ''} 
                    (mismo usuario en el mismo nivel). Se muestra solo la más reciente de cada caso.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Inscriptions by Level */}
        {Object.keys(groupedInscriptions).length === 0 ? (
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
          <div className="space-y-6">
            {Object.entries(groupedInscriptions)
              .sort(([levelA], [levelB]) => {
                // Sort levels: inicial, primaria, secundario, superior, universitario
                const levelOrder = ['inicial', 'primaria', 'secundario', 'superior', 'universitario'];
                return levelOrder.indexOf(levelA) - levelOrder.indexOf(levelB);
              })
              .map(([level, inscriptions]) => renderInscriptionTable(inscriptions, level))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default Evaluations;