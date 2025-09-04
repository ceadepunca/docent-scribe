import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import InscriptionForm from '@/components/InscriptionForm';

const NewInscription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedLevel = searchParams.get('level') as 'inicial' | 'primario' | 'secundario' | null;

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
          initialData={selectedLevel ? { teaching_level: selectedLevel } : undefined} 
        />
      </div>
    </div>
  );
};

export default NewInscription;