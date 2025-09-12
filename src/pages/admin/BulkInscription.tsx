import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MigratedTeacherSelector } from '@/components/admin/MigratedTeacherSelector';
import { BulkInscriptionForm } from '@/components/admin/BulkInscriptionForm';
import { InscriptionPreview } from '@/components/admin/InscriptionPreview';

const BulkInscription = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [selectedTeachers, setSelectedTeachers] = useState<any[]>([]);
  const [inscriptionConfig, setInscriptionConfig] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            No tiene permisos para acceder a la inscripción masiva.
          </p>
          <Button onClick={() => navigate('/admin')}>
            Volver al Panel de Administración
          </Button>
        </div>
      </div>
    );
  }

  const handleTeacherSelection = (teachers: any[]) => {
    setSelectedTeachers(teachers);
  };

  const handleConfigSubmit = (config: any) => {
    setInscriptionConfig(config);
    setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Reset everything
    setSelectedTeachers([]);
    setInscriptionConfig(null);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Panel de Administración
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Inscripción Masiva de Docentes
            </h1>
            <p className="text-muted-foreground">
              Inscribir múltiples docentes migrados a un período específico
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <div className={`w-12 h-0.5 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <div className={`w-12 h-0.5 ${currentStep > 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <MigratedTeacherSelector
            selectedTeachers={selectedTeachers}
            onSelectionChange={handleTeacherSelection}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <BulkInscriptionForm
            selectedTeachersCount={selectedTeachers.length}
            onSubmit={handleConfigSubmit}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <InscriptionPreview
            selectedTeachers={selectedTeachers}
            inscriptionConfig={inscriptionConfig}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
};

export default BulkInscription;