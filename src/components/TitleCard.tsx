import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TitleCardProps {
  control: Control<any>;
  titleNumber: number;
  isRequired?: boolean;
  onRemove?: () => void;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  control,
  titleNumber,
  isRequired = false,
  onRemove
}) => {
  const titlePrefix = `titulo${titleNumber}`;
  const additionalIndex = Math.max(1, titleNumber - 1);
  // Ensure the first title always renders as the principal title.
  const heading = (isRequired || titleNumber <= 1)
    ? 'TÍTULO DOCENTE O PRINCIPAL *'
    : `TÍTULO ADICIONAL #${additionalIndex}`;

  return (
    <div className={`border rounded-lg p-4 ${isRequired ? 'bg-muted/20' : 'bg-background'} relative`}>
      {!isRequired && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="absolute top-2 right-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <h3 className={`font-semibold mb-4 ${isRequired ? 'text-primary' : 'text-foreground'}`}>
        {heading}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control}
          name={`${titlePrefix}Nombre`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isRequired ? 'Nombre del Título *' : 'Nombre del Título'}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={isRequired ? "Ej: Profesorado en..." : "Opcional"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${titlePrefix}FechaEgreso`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isRequired ? 'Fecha de Egreso *' : 'Fecha de Egreso'}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${titlePrefix}Promedio`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isRequired ? 'Promedio *' : 'Promedio'}</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  min="1"
                  max="10"
                  placeholder={isRequired ? "8.50" : ""}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};