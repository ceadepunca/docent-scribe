import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import InscriptionForm from '@/components/InscriptionForm';

interface InscriptionData {
  id: string;
  status: string;
  subject_area: string;
  teaching_level: 'inicial' | 'primario' | 'secundario';
  experience_years: number;
  availability?: string;
  motivational_letter?: string;
}

const EditInscription = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [inscription, setInscription] = useState<InscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInscription();
  }, [id, user]);

  const fetchInscription = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('inscriptions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

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

      // Check if inscription can be edited
      if (!['draft', 'requires_changes'].includes(data.status)) {
        toast({
          title: 'No se puede editar',
          description: 'Esta inscripción no puede ser editada en su estado actual',
          variant: 'destructive',
        });
        navigate(`/inscriptions/${id}`);
        return;
      }

      setInscription(data);
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
            onClick={() => navigate(`/inscriptions/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Detalle
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Editar Inscripción
            </h1>
            <p className="text-muted-foreground">
              Modifica los datos de tu postulación docente
            </p>
          </div>
        </div>

        <InscriptionForm initialData={inscription} isEdit={true} />
      </div>
    </div>
  );
};

export default EditInscription;