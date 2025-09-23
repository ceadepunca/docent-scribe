import React, { useState } from 'react';
import { ImportPreviousInscriptionsModal } from './ImportPreviousInscriptionsModal';
import { ImportEvaluationsModal } from './ImportEvaluationsModal';
import { PeriodInscriptionsView } from './PeriodInscriptionsView';
import { Button } from '@/components/ui/button';
import { FileDown, Calculator } from 'lucide-react';

export const AdminImportWrapper: React.FC = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEvaluationsModal, setShowEvaluationsModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleImportComplete = () => {
    // Trigger refresh of the period inscriptions view
    setRefreshTrigger(prev => prev + 1);
    setShowImportModal(false);
  };

  const handleEvaluationsImportComplete = () => {
    // Trigger refresh of the period inscriptions view
    setRefreshTrigger(prev => prev + 1);
    setShowEvaluationsModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Import Buttons */}
      <div className="flex justify-end gap-2">
        <Button 
          onClick={() => setShowEvaluationsModal(true)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Calculator className="h-4 w-4" />
          Importar Evaluaciones
        </Button>
        <Button 
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          Importar Inscripciones Anteriores
        </Button>
      </div>

      {/* Period Inscriptions View */}
      <PeriodInscriptionsView key={refreshTrigger} />

      {/* Import Modals */}
      <ImportEvaluationsModal
        open={showEvaluationsModal}
        onOpenChange={setShowEvaluationsModal}
        onImportComplete={handleEvaluationsImportComplete}
      />
      <ImportPreviousInscriptionsModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};