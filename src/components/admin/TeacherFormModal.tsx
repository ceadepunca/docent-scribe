import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, GraduationCap } from 'lucide-react';
import { useTeacherManagement } from '@/hooks/useTeacherManagement';
import { useToast } from '@/hooks/use-toast';
import { TitleCard } from '@/components/TitleCard';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';

interface TeacherFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  teacher?: any;
}

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  open,
  onOpenChange,
  onSave,
  teacher,
}) => {
  const { createTeacher, updateTeacher } = useTeacherManagement();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    first_name: teacher?.first_name || '',
    last_name: teacher?.last_name || '',
    email: teacher?.email || '',
    dni: teacher?.dni || '',
    phone: teacher?.phone || '',
    legajo_number: teacher?.legajo_number || '',
    titulo1Nombre: teacher?.titulo_1_nombre || '',
    titulo1FechaEgreso: teacher?.titulo_1_fecha_egreso || '',
    titulo1Promedio: teacher?.titulo_1_promedio?.toString() || '',
    titulo2Nombre: teacher?.titulo_2_nombre || '',
    titulo2FechaEgreso: teacher?.titulo_2_fecha_egreso || '',
    titulo2Promedio: teacher?.titulo_2_promedio?.toString() || '',
    titulo3Nombre: teacher?.titulo_3_nombre || '',
    titulo3FechaEgreso: teacher?.titulo_3_fecha_egreso || '',
    titulo3Promedio: teacher?.titulo_3_promedio?.toString() || '',
    titulo4Nombre: teacher?.titulo_4_nombre || '',
    titulo4FechaEgreso: teacher?.titulo_4_fecha_egreso || '',
    titulo4Promedio: teacher?.titulo_4_promedio?.toString() || '',
  });

  const [saving, setSaving] = useState(false);
  const [visibleTitles, setVisibleTitles] = useState<number[]>(() => {
    const existingTitles = [];
    if (teacher?.titulo_2_nombre) existingTitles.push(2);
    if (teacher?.titulo_3_nombre) existingTitles.push(3);
    if (teacher?.titulo_4_nombre) existingTitles.push(4);
    return existingTitles;
  });

  const form = useForm({
    defaultValues: formData,
  });

  // Update form data when teacher prop changes
  useEffect(() => {
    if (teacher) {
      console.log('TeacherFormModal: Loading teacher data:', teacher);
      const newData = {
        first_name: teacher.first_name || '',
        last_name: teacher.last_name || '',
        email: teacher.email || '',
        dni: teacher.dni || '',
        phone: teacher.phone || '',
        legajo_number: teacher.legajo_number || '',
        titulo1Nombre: teacher.titulo_1_nombre || '',
        titulo1FechaEgreso: teacher.titulo_1_fecha_egreso || '',
        titulo1Promedio: teacher.titulo_1_promedio?.toString() || '',
        titulo2Nombre: teacher.titulo_2_nombre || '',
        titulo2FechaEgreso: teacher.titulo_2_fecha_egreso || '',
        titulo2Promedio: teacher.titulo_2_promedio?.toString() || '',
        titulo3Nombre: teacher.titulo_3_nombre || '',
        titulo3FechaEgreso: teacher.titulo_3_fecha_egreso || '',
        titulo3Promedio: teacher.titulo_3_promedio?.toString() || '',
        titulo4Nombre: teacher.titulo_4_nombre || '',
        titulo4FechaEgreso: teacher.titulo_4_fecha_egreso || '',
        titulo4Promedio: teacher.titulo_4_promedio?.toString() || '',
      };
      setFormData(newData);
      form.reset(newData);
      
      // Update visible titles
      const existingTitles = [];
      if (teacher.titulo_2_nombre) existingTitles.push(2);
      if (teacher.titulo_3_nombre) existingTitles.push(3);
      if (teacher.titulo_4_nombre) existingTitles.push(4);
      setVisibleTitles(existingTitles);
    } else {
      // Reset form for new teacher
      const emptyData = {
        first_name: '',
        last_name: '',
        email: '',
        dni: '',
        phone: '',
        legajo_number: '',
        titulo1Nombre: '',
        titulo1FechaEgreso: '',
        titulo1Promedio: '',
        titulo2Nombre: '',
        titulo2FechaEgreso: '',
        titulo2Promedio: '',
        titulo3Nombre: '',
        titulo3FechaEgreso: '',
        titulo3Promedio: '',
        titulo4Nombre: '',
        titulo4FechaEgreso: '',
        titulo4Promedio: '',
      };
      setFormData(emptyData);
      form.reset(emptyData);
      setVisibleTitles([]);
    }
  }, [teacher, form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validaciones básicas
      if (!formData.first_name.trim()) {
        toast({
          title: 'Error',
          description: 'El nombre es obligatorio',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.last_name.trim()) {
        toast({
          title: 'Error',
          description: 'El apellido es obligatorio',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.email.trim()) {
        toast({
          title: 'Error',
          description: 'El email es obligatorio',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.dni.trim()) {
        toast({
          title: 'Error',
          description: 'El DNI es obligatorio',
          variant: 'destructive',
        });
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: 'Error',
          description: 'El formato del email no es válido',
          variant: 'destructive',
        });
        return;
      }

      // Get current form values
      const currentValues = form.getValues();
      
      // Preparar datos para guardar, manejando campos opcionales
      const dataToSave = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        dni: formData.dni,
        phone: formData.phone.trim() || undefined,
        legajo_number: formData.legajo_number.trim() || undefined,
        titulo_1_nombre: currentValues.titulo1Nombre?.trim() || undefined,
        titulo_1_fecha_egreso: currentValues.titulo1FechaEgreso || undefined,
        titulo_1_promedio: currentValues.titulo1Promedio ? parseFloat(currentValues.titulo1Promedio) : undefined,
        titulo_2_nombre: currentValues.titulo2Nombre?.trim() || undefined,
        titulo_2_fecha_egreso: currentValues.titulo2FechaEgreso || undefined,
        titulo_2_promedio: currentValues.titulo2Promedio ? parseFloat(currentValues.titulo2Promedio) : undefined,
        titulo_3_nombre: currentValues.titulo3Nombre?.trim() || undefined,
        titulo_3_fecha_egreso: currentValues.titulo3FechaEgreso || undefined,
        titulo_3_promedio: currentValues.titulo3Promedio ? parseFloat(currentValues.titulo3Promedio) : undefined,
        titulo_4_nombre: currentValues.titulo4Nombre?.trim() || undefined,
        titulo_4_fecha_egreso: currentValues.titulo4FechaEgreso || undefined,
        titulo_4_promedio: currentValues.titulo4Promedio ? parseFloat(currentValues.titulo4Promedio) : undefined,
      };

      let success = false;
      if (teacher) {
        success = await updateTeacher(teacher.id, dataToSave);
      } else {
        const newTeacher = await createTeacher(dataToSave);
        success = !!newTeacher;
      }
      
      if (success) {
        onSave();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error saving teacher:', error);
      // El error ya se maneja en updateTeacher/createTeacher con toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {/* Make modal dialog content vertically scrollable and keep footer actions visible */}
        <div className="flex flex-col max-h-[80vh]">
          <DialogHeader>
          <DialogTitle>
            {teacher ? 'Editar Docente' : 'Crear Nuevo Docente'}
          </DialogTitle>
          <DialogDescription>
            Complete los datos básicos del docente y sus títulos académicos.
          </DialogDescription>
          {teacher && (
            <div className="text-sm text-muted-foreground">
              Editando: {teacher.first_name} {teacher.last_name} (DNI: {teacher.dni})
            </div>
          )}
          </DialogHeader>

          <Form {...form}>
            {/* Scrollable form body */}
            <form id="teacher-form" onSubmit={handleSubmit} className="space-y-4 overflow-auto px-4 pb-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nombres *</Label>
              <Input
                id="first_name"
                required
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                required
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                required
                value={formData.dni}
                onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="legajo_number">Número de Legajo</Label>
              <Input
                id="legajo_number"
                value={formData.legajo_number}
                onChange={(e) => setFormData(prev => ({ ...prev, legajo_number: e.target.value }))}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5" />
              <h4 className="font-medium">Títulos Académicos (Opcional)</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Puede agregar hasta 4 títulos académicos. Complete solo los datos que tenga disponibles.
            </p>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              <TitleCard
                control={form.control}
                titleNumber={1}
              />

              {visibleTitles.map((titleNumber) => (
                <TitleCard
                  key={titleNumber}
                  control={form.control}
                  titleNumber={titleNumber}
                  onRemove={() => {
                    setVisibleTitles(prev => prev.filter(num => num !== titleNumber));
                    form.setValue(`titulo${titleNumber}Nombre` as any, '');
                    form.setValue(`titulo${titleNumber}FechaEgreso` as any, '');
                    form.setValue(`titulo${titleNumber}Promedio` as any, '');
                  }}
                />
              ))}

              {visibleTitles.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const nextTitle = [2, 3, 4].find(num => !visibleTitles.includes(num));
                    if (nextTitle) {
                      setVisibleTitles(prev => [...prev, nextTitle]);
                    }
                  }}
                  className="w-full h-12 border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Título Adicional
                </Button>
              )}
            </div>
          </div>

              {/* Keep Debug button near inputs but actions moved to footer */}
              <div className="pt-2">
                {/* Intentionally left blank: actions are in footer */}
              </div>
            </form>
          </Form>

          {/* Sticky footer with actions */}
          <div className="border-t px-4 py-3 bg-card flex items-center justify-between">
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Form data:', formData);
                  console.log('Teacher prop:', teacher);
                  alert(`Form Data:\n${JSON.stringify(formData, null, 2)}\n\nTeacher Prop:\n${JSON.stringify(teacher, null, 2)}`);
                }}
                title="Debug: Ver datos del formulario"
              >
                Debug Form
              </Button>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" form="teacher-form" disabled={saving}>
                {saving ? 'Guardando...' : (teacher ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};