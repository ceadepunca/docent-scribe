import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface InscriptionPeriod {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  available_levels: ('inicial' | 'primario' | 'secundario')[];
  is_active: boolean;
}

interface PeriodSelectionGridProps {
  periods: InscriptionPeriod[];
  selectedPeriodId?: string | null;
  onPeriodSelect: (periodId: string) => void;
  loading?: boolean;
  teachingLevel: 'inicial' | 'primario' | 'secundario';
}

export const PeriodSelectionGrid: React.FC<PeriodSelectionGridProps> = ({
  periods,
  selectedPeriodId,
  onPeriodSelect,
  loading = false,
  teachingLevel
}) => {
  // Filter periods for the specific teaching level
  const availablePeriods = periods.filter(period => 
    period.is_active && period.available_levels.includes(teachingLevel)
  );

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusInfo = (period: InscriptionPeriod) => {
    const now = new Date();
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);
    const daysRemaining = getDaysRemaining(period.end_date);

    if (now < startDate) {
      return {
        status: 'upcoming',
        label: 'Próximo',
        color: 'bg-blue-100 text-blue-800',
        daysInfo: `Inicia en ${Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} días`
      };
    } else if (now > endDate) {
      return {
        status: 'expired',
        label: 'Vencido',
        color: 'bg-red-100 text-red-800',
        daysInfo: 'Período cerrado'
      };
    } else if (daysRemaining <= 3) {
      return {
        status: 'critical',
        label: 'Crítico',
        color: 'bg-red-100 text-red-800',
        daysInfo: `${daysRemaining} días restantes`
      };
    } else if (daysRemaining <= 7) {
      return {
        status: 'warning',
        label: 'Urgente',
        color: 'bg-yellow-100 text-yellow-800',
        daysInfo: `${daysRemaining} días restantes`
      };
    } else {
      return {
        status: 'active',
        label: 'Activo',
        color: 'bg-green-100 text-green-800',
        daysInfo: `${daysRemaining} días restantes`
      };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Cargando períodos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availablePeriods.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No hay períodos disponibles
            </h3>
            <p className="text-muted-foreground">
              No existen períodos de inscripción activos para el nivel {teachingLevel}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Seleccionar Período de Inscripción
        </h3>
        <p className="text-muted-foreground">
          Elija el período de inscripción para nivel {teachingLevel}
        </p>
      </div>

      <div className="grid gap-4">
        {availablePeriods.map((period) => {
          const statusInfo = getStatusInfo(period);
          const isSelected = selectedPeriodId === period.id;
          const canSelect = statusInfo.status !== 'expired';

          return (
            <Card 
              key={period.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary bg-primary/5' 
                  : canSelect 
                    ? 'hover:shadow-md hover:border-primary/50' 
                    : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => canSelect && onPeriodSelect(period.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{period.name}</CardTitle>
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </div>
                {period.description && (
                  <p className="text-sm text-muted-foreground">{period.description}</p>
                )}
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(period.start_date).toLocaleDateString('es-AR')} - {new Date(period.end_date).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span className={
                      statusInfo.status === 'critical' || statusInfo.status === 'warning' 
                        ? 'font-medium text-yellow-700' 
                        : 'text-muted-foreground'
                    }>
                      {statusInfo.daysInfo}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                    Período seleccionado
                  </div>
                )}
                {!canSelect && (
                  <div className="mt-3 text-sm text-red-600 font-medium">
                    Este período ya no está disponible
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPeriodId && (
        <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <div className="h-2 w-2 bg-primary rounded-full" />
            Ha seleccionado un período de inscripción. Puede continuar con el siguiente paso.
          </div>
        </div>
      )}
    </div>
  );
};