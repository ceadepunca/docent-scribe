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

          {/* Period Information Card */}
          {selectedLevel && periodId && !loading && (
            (() => {
              const period = getPeriodForLevel(selectedLevel);
              if (!period || period.id !== periodId) return null;

              const startDate = new Date(period.start_date);
              const endDate = new Date(period.end_date);
              const now = new Date();
              const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isNearDeadline = daysRemaining <= 7 && daysRemaining > 0;
              
              return (
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {period.name}
                      </h3>
                      {period.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {period.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isNearDeadline && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠️ Quedan {daysRemaining} días
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Activo
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-foreground">Período:</span>
                      <p className="text-muted-foreground">
                        {startDate.toLocaleDateString('es-AR')} - {endDate.toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Nivel seleccionado:</span>
                      <p className="text-muted-foreground capitalize">
                        {selectedLevel}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Fecha límite:</span>
                      <p className={daysRemaining <= 3 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                        {endDate.toLocaleDateString('es-AR')}
                        {daysRemaining > 0 && (
                          <span className="ml-1">
                            ({daysRemaining} días restantes)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
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