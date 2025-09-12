import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft } from 'lucide-react';
import { SecondaryInscriptionWizard } from './SecondaryInscriptionWizard';
import { SubjectSelection, PositionSelection, useSecondaryInscriptionData } from '@/hooks/useSecondaryInscriptionData';

const inscriptionSchema = z.object({
  subject_area: z.string().min(2, 'El área temática debe tener al menos 2 caracteres').optional(),
  teaching_level: z.enum(['inicial', 'primario', 'secundario'], {
    required_error: 'Debe seleccionar un nivel educativo'
  }),
  experience_years: z.number().min(0, 'Los años de experiencia no pueden ser negativos').max(50, 'Años de experiencia no pueden ser más de 50').optional(),
  availability: z.string().optional(),
  motivational_letter: z.string().min(50, 'La carta de motivación debe tener al menos 50 caracteres').max(2000, 'La carta de motivación no puede exceder 2000 caracteres').optional()
});

type InscriptionFormData = z.infer<typeof inscriptionSchema>;

interface InscriptionFormProps {
  initialData?: Partial<InscriptionFormData & { id: string; status: string; inscription_period_id?: string }>;
  isEdit?: boolean;
}

const InscriptionForm: React.FC<InscriptionFormProps> = ({ initialData, isEdit = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { availableLevels, getCurrentPeriods, getPeriodForLevel } = useInscriptionPeriods();
  const { saveSubjectSelections, savePositionSelections } = useSecondaryInscriptionData();
  
  // For secondary level new inscriptions, show wizard directly
  const isSecondaryNewInscription = initialData?.teaching_level === 'secundario' && !isEdit;

  const form = useForm<InscriptionFormData>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      subject_area: initialData?.subject_area || '',
      teaching_level: (initialData?.teaching_level as 'inicial' | 'primario' | 'secundario') || 'inicial',
      experience_years: initialData?.experience_years || 0,
      availability: initialData?.availability || '',
      motivational_letter: initialData?.motivational_letter || ''
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'requires_changes': return 'bg-orange-100 text-orange-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'submitted': return 'Enviada';
      case 'under_review': return 'En Revisión';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'requires_changes': return 'Requiere Cambios';
      default: return 'Desconocido';
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const formValues = form.getValues();
      
      // Determine inscription_period_id
      let inscriptionPeriodId = initialData?.inscription_period_id;
      
      if (!inscriptionPeriodId) {
        const period = getPeriodForLevel(formValues.teaching_level);
        if (!period) {
          throw new Error('No hay un período de inscripción activo para este nivel');
        }
        inscriptionPeriodId = period.id;
      }

      const inscriptionData = {
        subject_area: formValues.subject_area || 'No especificada',
        teaching_level: formValues.teaching_level,
        experience_years: formValues.experience_years || 0,
        availability: formValues.availability,
        motivational_letter: formValues.motivational_letter,
        inscription_period_id: inscriptionPeriodId,
        user_id: user.id,
        status: 'draft' as const
      };

      let result;
      if (isEdit && initialData?.id) {
        result = await supabase
          .from('inscriptions')
          .update(inscriptionData)
          .eq('id', initialData.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('inscriptions')
          .insert(inscriptionData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: isEdit ? 'Inscripción actualizada' : 'Borrador guardado',
        description: 'La inscripción se guardó como borrador',
      });

      navigate('/inscriptions');
    } catch (error: any) {
      console.error('Error:', error);
      
      let errorMessage = 'Ocurrió un error al guardar el borrador';
      
      // Handle unique constraint violation
      if (error.code === '23505' && error.message?.includes('unique_user_inscription_per_period')) {
        errorMessage = 'Ya tiene una inscripción para este período. Si desea crear una nueva inscripción, debe solicitar la eliminación de la existente desde el panel principal.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: InscriptionFormData, isDraft: boolean = false) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Determine inscription_period_id
      let inscriptionPeriodId = initialData?.inscription_period_id;
      
      if (!inscriptionPeriodId) {
        const period = getPeriodForLevel(data.teaching_level);
        if (!period) {
          throw new Error('No hay un período de inscripción activo para este nivel');
        }
        inscriptionPeriodId = period.id;
      }

      const inscriptionData = {
        subject_area: data.subject_area || 'No especificada',
        teaching_level: data.teaching_level,
        experience_years: data.experience_years || 0,
        availability: data.availability,
        motivational_letter: data.motivational_letter,
        inscription_period_id: inscriptionPeriodId,
        user_id: user.id,
        status: (isDraft ? 'draft' : 'submitted') as 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_changes'
      };

      let result;
      if (isEdit && initialData?.id) {
        result = await supabase
          .from('inscriptions')
          .update(inscriptionData)
          .eq('id', initialData.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('inscriptions')
          .insert(inscriptionData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: isEdit ? 'Inscripción actualizada' : 'Inscripción creada',
        description: isDraft 
          ? 'La inscripción se guardó como borrador' 
          : 'La inscripción se envió exitosamente',
      });

      navigate('/inscriptions');
    } catch (error: any) {
      console.error('Error:', error);
      
      let errorMessage = 'Ocurrió un error al procesar la inscripción';
      
      // Handle unique constraint violation
      if (error.code === '23505' && error.message?.includes('unique_user_inscription_per_period')) {
        errorMessage = 'Ya tiene una inscripción para este período. Si desea crear una nueva inscripción, debe solicitar la eliminación de la existente desde el panel principal.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecondaryInscriptionComplete = async (selections: {
    subjectSelections: SubjectSelection[];
    positionSelections: PositionSelection[];
  }) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const inscriptionPeriodId = initialData?.inscription_period_id;
      
      if (!inscriptionPeriodId) {
        throw new Error('No hay un período de inscripción válido');
      }

      const inscriptionData = {
        subject_area: 'Secundario', // Default value for secondary
        teaching_level: 'secundario' as const,
        experience_years: 0, // Default value
        availability: null,
        motivational_letter: null,
        inscription_period_id: inscriptionPeriodId,
        user_id: user.id,
        status: 'submitted' as const
      };

      // Create the basic inscription
      const { data: inscription, error: inscriptionError } = await supabase
        .from('inscriptions')
        .insert(inscriptionData)
        .select()
        .single();

      if (inscriptionError) throw inscriptionError;

      // Save the granular selections
      await saveSubjectSelections(inscription.id, selections.subjectSelections);
      await savePositionSelections(inscription.id, selections.positionSelections);

      toast({
        title: 'Inscripción completada',
        description: 'Su inscripción para nivel secundario se envió exitosamente con todas las selecciones',
      });

      navigate('/inscriptions');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al procesar la inscripción',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = !initialData?.status || ['draft', 'requires_changes'].includes(initialData.status);

  // If it's a new secondary inscription, show wizard directly
  if (isSecondaryNewInscription) {
    return (
      <SecondaryInscriptionWizard
        onComplete={handleSecondaryInscriptionComplete}
        isLoading={isSubmitting}
      />
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{isEdit ? 'Editar Inscripción' : 'Nueva Inscripción'}</CardTitle>
            <CardDescription>
              Complete los datos requeridos para su inscripción como docente
            </CardDescription>
          </div>
          {initialData?.status && (
            <Badge className={getStatusColor(initialData.status)}>
              {getStatusLabel(initialData.status)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="subject_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Temática</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Matemáticas, Ciencias, Literatura..."
                        {...field}
                        disabled={!canEdit || isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Indique el área principal en la que desea enseñar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teaching_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel Educativo *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!canEdit || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un nivel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="inicial">Nivel Inicial</SelectItem>
                        <SelectItem value="primario">Nivel Primario</SelectItem>
                        <SelectItem value="secundario">Nivel Secundario</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Años de Experiencia</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min={0}
                        max={50}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={!canEdit || isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Años de experiencia docente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidad Horaria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!canEdit || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione disponibilidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mañana">Turno Mañana</SelectItem>
                        <SelectItem value="tarde">Turno Tarde</SelectItem>
                        <SelectItem value="noche">Turno Noche</SelectItem>
                        <SelectItem value="completa">Jornada Completa</SelectItem>
                        <SelectItem value="flexible">Horario Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="motivational_letter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carta de Motivación</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explique sus motivaciones para formar parte de nuestro equipo docente, su filosofía educativa y qué puede aportar a la institución..."
                      className="min-h-[120px]"
                      {...field}
                      disabled={!canEdit || isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo 50 caracteres, máximo 2000. Caracteres actuales: {field.value?.length || 0}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canEdit && (
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Guardar Borrador
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit((data) => onSubmit(data, false))}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isEdit ? 'Actualizar y Enviar' : 'Enviar Inscripción'}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InscriptionForm;