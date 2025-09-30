import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Clock, CheckCircle2, XCircle, AlertCircle, User, Calendar, BookOpen, GraduationCap, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvaluationGrid } from '@/components/EvaluationGrid';
import { ConsolidatedEvaluationGrid } from '@/components/ConsolidatedEvaluationGrid';
import { useEvaluationNavigation } from '@/hooks/useEvaluationNavigation';
import { useInscriptionDocuments } from '@/hooks/useInscriptionDocuments';
import { DocumentViewer } from '@/components/DocumentViewer';
import { ChevronLeft, ChevronRight, SkipForward, List, ArrowLeft as ArrowLeftIcon, FileText } from 'lucide-react';

interface InscriptionDetail {
  id: string;
  user_id: string;
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
  const [searchParams] = useSearchParams();
  const { user, isEvaluator, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const evaluationNav = useEvaluationNavigation(id);
  const { documents, loading: documentsLoading } = useInscriptionDocuments(id);
  const [inscription, setInscription] = useState<InscriptionDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelection[]>([]);
  const [positionSelections, setPositionSelections] = useState<PositionSelection[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get return URL from search params
  const returnTo = searchParams.get('returnTo');

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

  // Se elimina la visualización de disponibilidad

  useEffect(() => {
    fetchInscriptionDetail();
  }, [id, user]);

  // Handle automatic scroll to evaluation when hash is present
  useEffect(() => {
    if (window.location.hash === '#evaluation') {
      // Wait for the component to render and then scroll to evaluation
      setTimeout(() => {
        const evaluationGrid = document.querySelector('[data-evaluation-grid]');
        if (evaluationGrid) {
          evaluationGrid.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, [inscription]);

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
            <Button onClick={() => navigate(returnTo || '/inscriptions')}>
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
            onClick={() => {
              if (returnTo) {
                navigate(returnTo);
              } else if (evaluationNav.hasEvaluationContext) {
                evaluationNav.backToEvaluations();
              } else {
                navigate('/inscriptions');
              }
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {returnTo ? 'Volver a Gestión de Inscripciones' : 
             evaluationNav.hasEvaluationContext ? 'Volver a Evaluaciones' : 'Volver a Inscripciones'}
          </Button>
          
          {/* Evaluation Navigation Header */}
          {evaluationNav.hasEvaluationContext && (
            <Card className="mb-6 bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <List className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-sm">
                          Evaluando: {evaluationNav.currentPeriodName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Docente {evaluationNav.currentPosition} de {evaluationNav.totalInscriptions} • 
                          {evaluationNav.evaluatedCount} evaluadas • {evaluationNav.unevaluatedCount} pendientes
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={evaluationNav.goToPrevious}
                      disabled={!evaluationNav.canGoToPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={evaluationNav.goToNext}
                      disabled={!evaluationNav.canGoToNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {evaluationNav.unevaluatedCount > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={evaluationNav.goToNextUnevaluated}
                        className="ml-2"
                      >
                        <SkipForward className="h-4 w-4 mr-1" />
                        Siguiente sin evaluar
                      </Button>
                    )}
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={evaluationNav.backToEvaluations}
                      className="ml-2"
                    >
                      <List className="h-4 w-4 mr-1" />
                      Seleccionar otro docente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Detalle de Inscripción
              </h1>
              <p className="text-muted-foreground">
                Información completa de tu postulación
              </p>
            </div>
            <div className="flex gap-2">
              {['draft', 'requires_changes', 'submitted'].includes(inscription.status) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Pass evaluation context if available
                    const editUrl = evaluationNav.hasEvaluationContext 
                      ? `/inscriptions/${inscription.id}/edit?evaluationContext=true`
                      : `/inscriptions/${inscription.id}/edit`;
                    navigate(editUrl);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar Inscripción
                </Button>
              )}
              {(isEvaluator || isSuperAdmin) && (
                <Button
                  onClick={() => {
                    // Scroll to the evaluation grid
                    const evaluationGrid = document.querySelector('[data-evaluation-grid]');
                    if (evaluationGrid) {
                      evaluationGrid.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Editar Evaluación
                </Button>
              )}
            </div>
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
                      
                      {/* Se elimina la sección de disponibilidad */}
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

            {/* Se elimina la tarjeta de carta de motivación */}

            {/* Documents Section - Only for evaluators and super admins */}
            {(isEvaluator || isSuperAdmin) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentos del Docente
                    {documents.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({documents.length} documento{documents.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documentsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Cargando documentos...</p>
                    </div>
                  ) : documents.length > 0 ? (
                    <DocumentViewer documents={documents} />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No hay documentos subidos para esta inscripción.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Evaluation Grid - Only for evaluators and super admins */}
            {(isEvaluator || isSuperAdmin) && inscription.teaching_level !== 'secundario' && (
              // Single evaluation for inicial/primario levels
              <EvaluationGrid 
                inscriptionId={inscription.id}
                teachingLevel={inscription.teaching_level}
                evaluationNavigation={evaluationNav}
              />
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
      
      {/* Full-width Consolidated Evaluation Grid for Secondary Level */}
      {(isEvaluator || isSuperAdmin) && inscription.teaching_level === 'secundario' && (
        <div className="w-full px-4 pb-4">
          <ConsolidatedEvaluationGrid
            inscriptionId={inscription.id}
            subjectSelections={subjectSelections}
            positionSelections={positionSelections}
            userId={inscription.user_id}
            evaluationNavigation={evaluationNav}
          />
        </div>
      )}
    </div>
  );
};

export default InscriptionDetail;