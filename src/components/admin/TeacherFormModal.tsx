import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeacherManagement } from '@/hooks/useTeacherManagement';
import { useToast } from '@/hooks/use-toast';

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
    titulo_1_nombre: teacher?.titulo_1_nombre || '',
    titulo_1_fecha_egreso: teacher?.titulo_1_fecha_egreso || '',
    titulo_1_promedio: teacher?.titulo_1_promedio || '',
  });

  const [saving, setSaving] = useState(false);

  // Update form data when teacher prop changes
  useEffect(() => {
    if (teacher) {
      console.log('TeacherFormModal: Loading teacher data:', teacher);
      setFormData({
        first_name: teacher.first_name || '',
        last_name: teacher.last_name || '',
        email: teacher.email || '',
        dni: teacher.dni || '',
        phone: teacher.phone || '',
        legajo_number: teacher.legajo_number || '',
        titulo_1_nombre: teacher.titulo_1_nombre || '',
        titulo_1_fecha_egreso: teacher.titulo_1_fecha_egreso || '',
        titulo_1_promedio: teacher.titulo_1_promedio || '',
      });
    } else {
      // Reset form for new teacher
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        dni: '',
        phone: '',
        legajo_number: '',
        titulo_1_nombre: '',
        titulo_1_fecha_egreso: '',
        titulo_1_promedio: '',
      });
    }
  }, [teacher]);

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

      // Preparar datos para guardar, manejando campos opcionales
      const dataToSave = {
        ...formData,
        // Limpiar campos vacíos para campos opcionales
        titulo_1_nombre: formData.titulo_1_nombre.trim() || undefined,
        titulo_1_fecha_egreso: formData.titulo_1_fecha_egreso || undefined,
        titulo_1_promedio: formData.titulo_1_promedio ? parseFloat(formData.titulo_1_promedio) : undefined,
        phone: formData.phone.trim() || undefined,
        legajo_number: formData.legajo_number.trim() || undefined,
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
        <DialogHeader>
          <DialogTitle>
            {teacher ? 'Editar Docente' : 'Crear Nuevo Docente'}
          </DialogTitle>
          {teacher && (
            <div className="text-sm text-muted-foreground">
              Editando: {teacher.first_name} {teacher.last_name} (DNI: {teacher.dni})
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <h4 className="font-medium mb-2">Información Académica (Opcional)</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Complete solo los datos que tenga disponibles. Puede dejar estos campos vacíos si no los conoce.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo_1_nombre">Título</Label>
                <Input
                  id="titulo_1_nombre"
                  placeholder="Ej: Profesorado en Matemáticas"
                  value={formData.titulo_1_nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo_1_nombre: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo_1_fecha_egreso">Fecha de Egreso (Opcional)</Label>
                  <Input
                    id="titulo_1_fecha_egreso"
                    type="date"
                    placeholder="Dejar vacío si no se conoce"
                    value={formData.titulo_1_fecha_egreso}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo_1_fecha_egreso: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="titulo_1_promedio">Promedio (Opcional)</Label>
                  <Input
                    id="titulo_1_promedio"
                    type="number"
                    step="0.01"
                    min="1"
                    max="10"
                    placeholder="Ej: 8.5"
                    value={formData.titulo_1_promedio}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo_1_promedio: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
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
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : (teacher ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};