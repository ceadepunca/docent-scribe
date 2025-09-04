import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Calendar, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminPanel = () => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [periodForm, setPeriodForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    availableLevels: [] as ('inicial' | 'primario' | 'secundario')[],
  });

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            No tiene permisos para acceder al panel de administración.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleLevelChange = (level: 'inicial' | 'primario' | 'secundario', checked: boolean) => {
    setPeriodForm(prev => ({
      ...prev,
      availableLevels: checked 
        ? [...prev.availableLevels, level]
        : prev.availableLevels.filter(l => l !== level)
    }));
  };

  const createPeriod = async () => {
    if (!user || !periodForm.name || !periodForm.startDate || !periodForm.endDate || periodForm.availableLevels.length === 0) {
      toast({
        title: 'Error',
        description: 'Complete todos los campos obligatorios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('inscription_periods')
        .insert({
          name: periodForm.name,
          description: periodForm.description,
          start_date: periodForm.startDate,
          end_date: periodForm.endDate,
          available_levels: periodForm.availableLevels,
          is_active: true,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Período Creado',
        description: 'El período de inscripción ha sido creado exitosamente.',
      });

      // Reset form
      setPeriodForm({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        availableLevels: [],
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el período. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Administración</h1>
            <p className="text-muted-foreground">
              Gestión de períodos de inscripción y configuración del sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nuevo Período de Inscripción
              </CardTitle>
              <CardDescription>
                Crear un nuevo período para inscripciones docentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Período *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Inscripción Extraordinaria 2026"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción opcional del período"
                  value={periodForm.description}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={periodForm.startDate}
                    onChange={(e) => setPeriodForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Fecha de Fin *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={periodForm.endDate}
                    onChange={(e) => setPeriodForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Niveles Disponibles *</Label>
                <div className="flex flex-col gap-2 mt-2">
                  {(['inicial', 'primario', 'secundario'] as const).map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={periodForm.availableLevels.includes(level)}
                        onCheckedChange={(checked) => handleLevelChange(level, !!checked)}
                      />
                      <Label htmlFor={level} className="capitalize">
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={createPeriod} className="w-full">
                Crear Período
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Períodos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">-</p>
                <p className="text-muted-foreground">En desarrollo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Inscripciones Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">-</p>
                <p className="text-muted-foreground">En desarrollo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Legajos Registrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">-</p>
                <p className="text-muted-foreground">En desarrollo</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;