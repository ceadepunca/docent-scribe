import { useAuth } from '@/contexts/AuthContext';
import { useProfileDocuments } from '@/hooks/useProfileDocuments';

export interface ProfileCompletion {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
}

export const useProfileCompleteness = (): ProfileCompletion => {
  const { profile } = useAuth();
  const { hasRequiredDNIDocuments, getTituloDocuments } = useProfileDocuments();

  if (!profile) {
    return {
      isComplete: false,
      completionPercentage: 0,
      missingFields: ['Todos los campos'],
    };
  }

  const requiredFields = [
    { key: 'first_name', label: 'Nombre' },
    { key: 'last_name', label: 'Apellido' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono celular' },
    { key: 'titulo_1_nombre', label: 'Título principal' },
    { key: 'titulo_1_fecha_egreso', label: 'Fecha de egreso del título principal' },
    { key: 'titulo_1_promedio', label: 'Promedio del título principal' },
  ];

  const missingFields: string[] = [];
  let completedFields = 0;

  requiredFields.forEach(({ key, label }) => {
    const value = profile[key as keyof typeof profile];
    if (value === null || value === undefined || value === '') {
      missingFields.push(label);
    } else {
      completedFields++;
    }
  });

  // For testing phase, documents are optional - no document requirements
  const totalRequiredFields = requiredFields.length;
  const completionPercentage = Math.round((completedFields / totalRequiredFields) * 100);
  const isComplete = missingFields.length === 0;

  return {
    isComplete,
    completionPercentage,
    missingFields,
  };
};