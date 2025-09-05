import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { toast } from 'sonner';
import InscriptionForm from '@/components/InscriptionForm';

const NewInscription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getPeriodForLevel, loading } = useInscriptionPeriods();
  
  const selectedLevel = searchParams.get('level') as 'inicial' | 'primario' | 'secundario' | null;
  const periodId = searchParams.get('periodId');

  useEffect(() => {
    if (!loading) {
      // Validate that we have required parameters
      if (!selectedLevel || !periodId) {
        toast.error('Parámetros de inscripción inválidos');
        navigate('/dashboard');
        return;
      }

      // Validate that the period exists and is valid for the level
      const period = getPeriodForLevel(selectedLevel);
      if (!period || period.id !== periodId) {
        toast.error('El período de inscripción no está disponible para este nivel');
        navigate('/dashboard');
        return;
      }
    }
  }, [selectedLevel, periodId, loading, getPeriodForLevel, navigate]);

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
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Nueva Inscripción Docente
              {selectedLevel && (
                <span className="text-primary">
                  {' '}- Nivel {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">
              Complete el formulario para postularse como docente
              {selectedLevel && ` en el nivel ${selectedLevel}`}
            </p>
          </div>
        </div>

        <InscriptionForm 
          initialData={
            selectedLevel && periodId 
              ? { teaching_level: selectedLevel, inscription_period_id: periodId } 
              : undefined
          } 
        />
      </div>
    </div>
  );
};

export default NewInscription;