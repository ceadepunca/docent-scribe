import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import InscriptionForm from '@/components/InscriptionForm';

const NewInscription = () => {
  const navigate = useNavigate();

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
            </h1>
            <p className="text-muted-foreground">
              Complete el formulario para postularse como docente
            </p>
          </div>
        </div>

        <InscriptionForm />
      </div>
    </div>
  );
};

export default NewInscription;