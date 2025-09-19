import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEvaluationNavigation } from '@/hooks/useEvaluationNavigation';
import InscriptionForm from '@/components/InscriptionForm';

interface InscriptionData {
  id: string;
  status: string;
  subject_area: string;
  teaching_level: 'inicial' | 'primario' | 'secundario';
  experience_years: number;
  availability?: string;
  motivational_letter?: string;
  user_id: string;
}

interface TeacherProfile {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  email: string;
}

const EditInscription = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isSuperAdmin, isEvaluator } = useAuth();
  const { toast } = useToast();
  const evaluationNav = useEvaluationNavigation(id);
  const [inscription, setInscription] = useState<InscriptionData | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if we're in evaluation context
  const isEvaluationContext = searchParams.get('evaluationContext') === 'true';

  useEffect(() => {
    fetchInscription();
  }, [id, user]);

  const fetchInscription = async () => {
    if (!user || !id) return;

    try {
      // Build query based on user role
      let query = supabase
        .from('inscriptions')
        .select('*')
        .eq('id', id);

      // Regular users can only edit their own inscriptions
      if (!isSuperAdmin && !isEvaluator) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: 'Error',
          description: 'Inscripción no encontrada',
          variant: 'destructive',
        });
        navigate('/inscriptions');
        return;
      }

      // Check if inscription can be edited based on user role and status
      const canEdit = (isSuperAdmin || isEvaluator) 
        ? ['draft', 'requires_changes', 'submitted'].includes(data.status)
        : ['draft', 'requires_changes'].includes(data.status) && data.user_id === user.id;

      if (!canEdit) {
        toast({
          title: 'No se puede editar',
          description: 'Esta inscripción no puede ser editada en su estado actual',
          variant: 'destructive',
        });
        navigate(`/inscriptions/${id}`);
        return;
      }

      setInscription(data);

      // Fetch teacher profile information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, dni, email')
        .eq('id', data.user_id)
        .single();

      if (profileError) {
        console.error('Error fetching teacher profile:', profileError);
      } else {
        setTeacherProfile(profileData);
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
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Inscripción no encontrada</h3>
          <p className="text-muted-foreground mb-4">
            La inscripción que intentas editar no existe o no tienes permisos para modificarla.
          </p>
          <Button onClick={() => navigate('/inscriptions')}>
            Volver a Inscripciones
          </Button>
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
            onClick={() => {
              if (isEvaluationContext && evaluationNav.hasEvaluationContext) {
                evaluationNav.backToEvaluations();
              } else {
                navigate(`/inscriptions/${id}`);
              }
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isEvaluationContext && evaluationNav.hasEvaluationContext ? 'Volver a Evaluaciones' : 'Volver al Detalle'}
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Editar Inscripción
            </h1>
            <p className="text-muted-foreground">
              Modifica los datos de la postulación docente
            </p>
            
            {/* Teacher Information */}
            {teacherProfile && (
              <div className="mt-6 p-4 bg-card rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  Información del Docente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Nombre:</span>
                    <p className="text-foreground">{teacherProfile.first_name} {teacherProfile.last_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">DNI:</span>
                    <p className="text-foreground">{teacherProfile.dni}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Email:</span>
                    <p className="text-foreground">{teacherProfile.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Nivel:</span>
                    <p className="text-foreground capitalize">{inscription?.teaching_level}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <InscriptionForm 
          initialData={inscription} 
          isEdit={true} 
          evaluationNavigation={isEvaluationContext ? evaluationNav : undefined}
        />
      </div>
    </div>
  );
};

export default EditInscription;