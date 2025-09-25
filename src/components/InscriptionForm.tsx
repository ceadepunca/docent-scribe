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
import { InscriptionDocumentUploader } from './InscriptionDocumentUploader';
import { SubjectSelection, PositionSelection, useSecondaryInscriptionData } from '@/hooks/useSecondaryInscriptionData';

const inscriptionSchema = z.object({
  subject_area: z.string().min(2, 'El área temática debe tener al menos 2 caracteres').optional(),
  teaching_level: z.enum(['inicial', 'primario', 'secundario'], {
    required_error: 'Debe seleccionar un nivel educativo'
  }),
  experience_years: z.number().min(0, 'Los años de experiencia no pueden ser negativos').max(50, 'Años de experiencia no pueden ser más de 50').optional()
});

type InscriptionFormData = z.infer<typeof inscriptionSchema>;

interface InscriptionFormProps {
  initialData?: Partial<InscriptionFormData & { id: string; status: string; inscription_period_id?: string }>;
  isEdit?: boolean;
  evaluationNavigation?: {
    hasEvaluationContext: boolean;
    canGoToNext: boolean;
    goToNext: () => void;
    goToNextUnevaluated: () => void;
    backToEvaluations: () => void;
    unevaluatedCount: number;
  };
}

const InscriptionForm: React.FC<InscriptionFormProps> = ({ initialData, isEdit = false, evaluationNavigation }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { availableLevels, getCurrentPeriods, getPeriodForLevel } = useInscriptionPeriods();
  const { saveSubjectSelections, savePositionSelections } = useSecondaryInscriptionData();
  
  // For all secondary level inscriptions, show wizard
  const isSecondaryInscription = initialData?.teaching_level === 'secundario';

  const form = useForm<InscriptionFormData>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      subject_area: initialData?.subject_area || '',
      teaching_level: (initialData?.teaching_level as 'inicial' | 'primario' | 'secundario') || 'inicial',
      experience_years: initialData?.experience_years || 0
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

      // Mejorar mensaje para errores de duplicado que no sean por inscripción única
      if (error.code === '23505') {
        if (error.message?.includes('unique_user_inscription_per_period')) {
          errorMessage = 'Ya tiene una inscripción para este período. Si desea crear una nueva inscripción, debe solicitar la eliminación de la existente desde el panel principal.';
        } else {
          errorMessage = 'La inscripción se guardó, pero algunos cargos o materias ya estaban asociados y no se volvieron a agregar.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: error.code === '23505' ? 'Inscripción guardada con advertencia' : 'Error',
        description: errorMessage,
        variant: error.code === '23505' ? 'default' : 'destructive',
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

      // Redirigir al formulario de la grilla de evaluación (InscriptionDetail)
      if (result.data?.id) {
        navigate(`/inscriptions/${result.data.id}`);
      } else if (result.id) {
        navigate(`/inscriptions/${result.id}`);
      } else if (isEdit && initialData?.id) {
        navigate(`/inscriptions/${initialData.id}`);
      } else {
        navigate('/inscriptions');
      }
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

  const handleAutoSave = async (inscriptionPeriodId: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const inscriptionData = {
        subject_area: 'Secundario',
        teaching_level: 'secundario' as const,
        experience_years: 0,
        inscription_period_id: inscriptionPeriodId,
        user_id: user.id,
        status: 'draft' as const
      };

      const { data: inscription, error } = await supabase
        .from('inscriptions')
        .insert(inscriptionData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Borrador guardado',
        description: 'Se guardó un borrador de su inscripción para habilitar la carga de documentos',
      });

      return inscription.id;
    } catch (error) {
      console.error('Error al auto-guardar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el borrador automáticamente',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSecondaryInscriptionComplete = async (selections: {
    subjectSelections: SubjectSelection[];
    positionSelections: PositionSelection[];
    inscriptionPeriodId: string;
  }) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      let inscription;

      if (isEdit && initialData?.id) {
        // Editing existing inscription - update it directly

        // Always set status to submitted on secondary wizard completion and update timestamp
        const inscriptionData = {
          status: 'submitted' as const,
          updated_at: new Date().toISOString(),
          // Ensure teaching_level and subject_area are correct for secondary
          teaching_level: 'secundario' as const,
          subject_area: 'Secundario',
        };

        console.log('=== EDITING INSCRIPTION ===');
        console.log('Initial data:', initialData);
        console.log('Inscription data to update:', inscriptionData);
        console.log('User ID:', user.id);

        const { data: updatedInscription, error: updateError } = await supabase
          .from('inscriptions')
          .update(inscriptionData)
          .eq('id', initialData.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating inscription:', updateError);
          console.error('Inscription data being sent:', inscriptionData);
          console.error('Initial data:', initialData);
          throw updateError;
        }
        inscription = updatedInscription;
      } else {
        // Creating new inscription - check if there's already a draft inscription for this user and period
        const { data: existingInscription, error: fetchError } = await supabase
          .from('inscriptions')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('inscription_period_id', selections.inscriptionPeriodId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        const inscriptionData = {
          subject_area: 'Secundario',
          teaching_level: 'secundario' as const,
          experience_years: 0,
          inscription_period_id: selections.inscriptionPeriodId,
          user_id: user.id,
          status: 'submitted' as const
        };

        if (existingInscription) {
          // Update existing inscription
          const { data: updatedInscription, error: updateError } = await supabase
            .from('inscriptions')
            .update(inscriptionData)
            .eq('id', existingInscription.id)
            .select()
            .single();

          if (updateError) throw updateError;
          inscription = updatedInscription;
        } else {
          // Create new inscription
          const { data: newInscription, error: insertError } = await supabase
            .from('inscriptions')
            .insert(inscriptionData)
            .select()
            .single();

          if (insertError) throw insertError;
          inscription = newInscription;
        }
      }

      // Save the granular selections
      await saveSubjectSelections(inscription.id, selections.subjectSelections);
      await savePositionSelections(inscription.id, selections.positionSelections);

      toast({
        title: 'Inscripción completada',
        description: 'Su inscripción para nivel secundario se envió exitosamente con todas las selecciones',
      });

      // Navigate based on context
      if (evaluationNavigation?.hasEvaluationContext) {
        // If in evaluation context, go back to evaluations
        evaluationNavigation.backToEvaluations();
      } else {
        // Otherwise, go to the inscription detail page to show the evaluation grid
        navigate(`/inscriptions/${inscription.id}`);
      }
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

  const canEdit = !initialData?.status || ['draft', 'requires_changes', 'submitted'].includes(initialData.status);

  // If it's a secondary inscription, show wizard
  if (isSecondaryInscription) {
    return (
      <SecondaryInscriptionWizard
        onComplete={handleSecondaryInscriptionComplete}
        onAutoSave={isEdit ? undefined : handleAutoSave}
        initialInscriptionPeriodId={initialData?.inscription_period_id}
        inscriptionId={initialData?.id}
        isLoading={isSubmitting}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Period Information Display */}
      {initialData?.inscription_period_id && (
        (() => {
          const currentPeriods = getCurrentPeriods();
          const period = currentPeriods.find(p => p.id === initialData.inscription_period_id);
          
          if (!period) return null;

          const endDate = new Date(period.end_date);
          const now = new Date();
          const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isNearDeadline = daysRemaining <= 7 && daysRemaining > 0;
          
          return (
            <Card className="bg-muted/30 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      Período de Inscripción: {period.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Válido hasta: {endDate.toLocaleDateString('es-AR')}
                      {daysRemaining > 0 && (
                        <span className={daysRemaining <= 3 ? "text-red-600 font-medium ml-1" : "ml-1"}>
                          ({daysRemaining} días restantes)
                        </span>
                      )}
                    </p>
                  </div>
                  {isNearDeadline && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⚠️ Próximo a vencer
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()
      )}

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

              {/* Campo de disponibilidad eliminado */}
            </div>

            {/* Campo de carta de motivación eliminado */}

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

      {initialData?.id && canEdit && (
        <Card>
          <CardContent className="pt-6">
            <InscriptionDocumentUploader 
              inscriptionId={initialData.id}
              disabled={!canEdit}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InscriptionForm;
