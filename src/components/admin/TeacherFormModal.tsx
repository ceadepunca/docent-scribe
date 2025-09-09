import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeacherManagement } from '@/hooks/useTeacherManagement';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (teacher) {
        await updateTeacher(teacher.id, formData);
      } else {
        await createTeacher({
          ...formData,
          titulo_1_promedio: formData.titulo_1_promedio ? parseFloat(formData.titulo_1_promedio) : undefined,
        });
      }
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving teacher:', error);
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
            <h4 className="font-medium mb-4">Información Académica (Opcional)</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo_1_nombre">Título</Label>
                <Input
                  id="titulo_1_nombre"
                  value={formData.titulo_1_nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo_1_nombre: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo_1_fecha_egreso">Fecha de Egreso</Label>
                  <Input
                    id="titulo_1_fecha_egreso"
                    type="date"
                    value={formData.titulo_1_fecha_egreso}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo_1_fecha_egreso: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="titulo_1_promedio">Promedio</Label>
                  <Input
                    id="titulo_1_promedio"
                    type="number"
                    step="0.01"
                    min="1"
                    max="10"
                    value={formData.titulo_1_promedio}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo_1_promedio: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : (teacher ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};