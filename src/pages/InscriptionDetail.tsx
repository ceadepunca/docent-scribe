import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Clock, CheckCircle2, XCircle, AlertCircle, User, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InscriptionDetail {
  id: string;
  status: string;
  subject_area: string;
  teaching_level: string;
  experience_years: number;
  availability?: string;
  motivational_letter?: string;
  created_at: string;
  updated_at: string;
}

interface SubjectSelection {
  id: string;
  subject_id: string;
  subject?: {
    name: string;
    school?: {
      name: string;
    };
  };
}

interface PositionSelection {
  id: string;
  administrative_position_id: string;
  administrative_position?: {
    name: string;
    school?: {
      name: string;
    };
  };
}

interface HistoryEntry {
  id: string;
  previous_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
}

const InscriptionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isEvaluator, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [inscription, setInscription] = useState<InscriptionDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelection[]>([]);
  const [positionSelections, setPositionSelections] = useState<PositionSelection[]>([]);
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

  const getAvailabilityLabel = (availability?: string) => {
    if (!availability) return 'No especificada';
    switch (availability) {
      case 'mañana': return 'Turno Mañana';
      case 'tarde': return 'Turno Tarde';
      case 'noche': return 'Turno Noche';
      case 'completa': return 'Jornada Completa';
      case 'flexible': return 'Horario Flexible';
      default: return availability;
    }
  };

  useEffect(() => {
    fetchInscriptionDetail();
  }, [id, user]);

  const fetchInscriptionDetail = async () => {
    if (!user || !id) return;

    try {
      // Fetch inscription details
      let query = supabase
        .from('inscriptions')
        .select('*')
        .eq('id', id);

      // If not evaluator or super admin, only show own inscriptions
      if (!isEvaluator && !isSuperAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data: inscriptionData, error: inscriptionError } = await query.single();

      if (inscriptionError) throw inscriptionError;
      if (!inscriptionData) {
        toast({
          title: 'Error',
          description: 'Inscripción no encontrada',
          variant: 'destructive',
        });
        navigate('/inscriptions');
        return;
      }

      setInscription(inscriptionData);

      // Fetch history
      const { data: historyData, error: historyError } = await supabase
        .from('inscription_history')
        .select('*')
        .eq('inscription_id', id)
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('Error fetching history:', historyError);
      } else {
        setHistory(historyData || []);
      }

      // Fetch selections for secondary level inscriptions
      if (inscriptionData.teaching_level === 'secundario') {
        // Fetch subject selections
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('inscription_subject_selections')
          .select(`
            *,
            subject:subjects(
              name,
              school:schools(name)
            )
          `)
          .eq('inscription_id', id);

        if (subjectsError) {
          console.error('Error fetching subject selections:', subjectsError);
        } else {
          setSubjectSelections(subjectsData || []);
        }

        // Fetch position selections
        const { data: positionsData, error: positionsError } = await supabase
          .from('inscription_position_selections')
          .select(`
            *,
            administrative_position:administrative_positions(
              name,
              school:schools(name)
            )
          `)
          .eq('inscription_id', id);

        if (positionsError) {
          console.error('Error fetching position selections:', positionsError);
        } else {
          setPositionSelections(positionsData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching inscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la inscripción',
        variant: 'destructive',
      });
      navigate('/inscriptions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando inscripción...</p>
        </div>
      </div>
    );
  }

  if (!inscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="text-center p-8">
            <h3 className="text-lg font-semibold mb-2">Inscripción no encontrada</h3>
            <p className="text-muted-foreground mb-4">
              La inscripción que buscas no existe o no tienes permisos para verla.
            </p>
            <Button onClick={() => navigate('/inscriptions')}>
              Volver a Inscripciones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/inscriptions')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Inscripciones
          </Button>
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Detalle de Inscripción
              </h1>
              <p className="text-muted-foreground">
                Información completa de tu postulación
              </p>
            </div>
            {['draft', 'requires_changes'].includes(inscription.status) && (
              <Button
                onClick={() => navigate(`/inscriptions/${inscription.id}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Editar Inscripción
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Información Básica
                  </CardTitle>
                  <Badge className={`${getStatusColor(inscription.status)} flex items-center gap-1`}>
                    {getStatusIcon(inscription.status)}
                    {getStatusLabel(inscription.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inscription.teaching_level !== 'secundario' && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Área Temática</span>
                      </div>
                      <p className="text-foreground">{inscription.subject_area}</p>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Nivel Educativo</span>
                    </div>
                    <p className="text-foreground">{getLevelLabel(inscription.teaching_level)}</p>
                  </div>
                  
                  {inscription.teaching_level !== 'secundario' && (
                    <>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">Experiencia</span>
                        </div>
                        <p className="text-foreground">
                          {inscription.experience_years} {inscription.experience_years === 1 ? 'año' : 'años'}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">Disponibilidad</span>
                        </div>
                        <p className="text-foreground">{getAvailabilityLabel(inscription.availability)}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subject Selections for Secondary Level */}
            {inscription.teaching_level === 'secundario' && subjectSelections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Materias Seleccionadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subjectSelections.map((selection) => (
                      <Badge key={selection.id} variant="secondary">
                        {selection.subject?.name} - {selection.subject?.school?.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Position Selections for Secondary Level */}
            {inscription.teaching_level === 'secundario' && positionSelections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Cargos Administrativos Seleccionados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {positionSelections.map((selection) => (
                      <Badge key={selection.id} variant="secondary">
                        {selection.administrative_position?.name} - {selection.administrative_position?.school?.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Motivational Letter */}
            {inscription.motivational_letter && inscription.teaching_level !== 'secundario' && (
              <Card>
                <CardHeader>
                  <CardTitle>Carta de Motivación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {inscription.motivational_letter}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Creada</p>
                  <p className="text-foreground">
                    {format(new Date(inscription.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Última Actualización</p>
                  <p className="text-foreground">
                    {format(new Date(inscription.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* History */}
            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Cambios</CardTitle>
                  <CardDescription>
                    Registro de cambios de estado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {history.map((entry, index) => (
                      <div key={entry.id} className="relative">
                        {index !== history.length - 1 && (
                          <div className="absolute left-2 top-8 w-px h-full bg-border" />
                        )}
                        <div className="flex gap-3">
                          <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {entry.previous_status && (
                                <>
                                  <Badge variant="outline" className="text-xs">
                                    {getStatusLabel(entry.previous_status)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">→</span>
                                </>
                              )}
                              <Badge className={`${getStatusColor(entry.new_status)} text-xs`}>
                                {getStatusLabel(entry.new_status)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </p>
                            {entry.notes && (
                              <p className="text-sm text-foreground mt-1">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscriptionDetail;