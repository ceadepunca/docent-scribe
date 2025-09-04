import { useAuth } from '@/contexts/AuthContext';

export interface ProfileCompletion {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
}

export const useProfileCompleteness = (): ProfileCompletion => {
  const { profile } = useAuth();

  if (!profile) {
    return {
      isComplete: false,
      completionPercentage: 0,
      missingFields: ['Todos los campos'],
    };
  }

  const requiredFields = [
    { key: 'dni', label: 'DNI' },
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

  const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);
  const isComplete = missingFields.length === 0;

  return {
    isComplete,
    completionPercentage,
    missingFields,
  };
};