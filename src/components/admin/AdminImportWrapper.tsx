import React, { useState } from 'react';
import { ImportPreviousInscriptionsModal } from './ImportPreviousInscriptionsModal';
import { PeriodInscriptionsView } from './PeriodInscriptionsView';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

export const AdminImportWrapper: React.FC = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleImportComplete = () => {
    // Trigger refresh of the period inscriptions view
    setRefreshTrigger(prev => prev + 1);
    setShowImportModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Import Button */}
      <div className="flex justify-end">
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

      {/* Import Modal */}
      <ImportPreviousInscriptionsModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};