import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, UserPlus, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeacherManagement } from '@/hooks/useTeacherManagement';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { usePositionTypes } from '@/hooks/usePositionTypes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SecondaryInscriptionWizard } from '@/components/SecondaryInscriptionWizard';
import { SubjectSelection, PositionSelection, useSecondaryInscriptionData } from '@/hooks/useSecondaryInscriptionData';
import { TeacherSearchGrid } from '@/components/admin/TeacherSearchGrid';

const AssistedInscription = () => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { searchTeacherByDNI, createTeacher } = useTeacherManagement();
  const { periods, fetchAllPeriods } = useInscriptionPeriods();
  const { positionTypes } = usePositionTypes();
  const { saveSubjectSelections, savePositionSelections } = useSecondaryInscriptionData();

  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelection[]>([]);
  const [positionSelections, setPositionSelections] = useState<PositionSelection[]>([]);

  const [teacherForm, setTeacherForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    dni: '',
    phone: '',
    titulo_1_nombre: '',
    titulo_1_fecha_egreso: '',
    titulo_1_promedio: '',
  });

  const [inscriptionForm, setInscriptionForm] = useState({
    teaching_level: '',
    inscription_period_id: '',
    subject_area: '',
    experience_years: '0',
    availability: '',
    motivational_letter: '',
    target_position_type_id: '',
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllPeriods();
    }
  }, [isSuperAdmin, fetchAllPeriods]);

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            No tiene permisos para acceder a la inscripción asistida.
          </p>
          <Button onClick={() => navigate('/admin')}>
            Volver al Panel de Administración
          </Button>
        </div>
      </div>
    );
  }

  const handleSelectTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setShowCreateForm(false);
  };

  const handleCreateNew = (searchQuery: string) => {
    setSelectedTeacher(null);
    setShowCreateForm(true);
    // Try to extract DNI if the search query looks like a DNI (only numbers)
    const isDNI = /^\d+$/.test(searchQuery.replace(/\./g, ''));
    if (isDNI) {
      setTeacherForm(prev => ({ ...prev, dni: searchQuery.replace(/\./g, '') }));
    } else {
      // Try to parse if it looks like "LastName FirstName" format
      const nameParts = searchQuery.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        setTeacherForm(prev => ({ 
          ...prev, 
          last_name: nameParts[0],
          first_name: nameParts.slice(1).join(' ')
        }));
      }
    }
  };

  const handleCreateTeacher = async () => {
    const newTeacher = await createTeacher({
      ...teacherForm,
      titulo_1_promedio: teacherForm.titulo_1_promedio ? parseFloat(teacherForm.titulo_1_promedio) : undefined,
    });

    if (newTeacher) {
      setSelectedTeacher(newTeacher);
      setShowCreateForm(false);
      setTeacherForm({
        first_name: '',
        last_name: '',
        email: '',
        dni: '',
        phone: '',
        titulo_1_nombre: '',
        titulo_1_fecha_egreso: '',
        titulo_1_promedio: '',
      });
    }
  };

  const handleSubmitInscription = async () => {
    if (!selectedTeacher || !inscriptionForm.teaching_level || !inscriptionForm.inscription_period_id) {
      toast({
        title: 'Error',
        description: 'Complete todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    // Validate secondary selections
    if (inscriptionForm.teaching_level === 'secundario') {
      if (subjectSelections.length === 0 && positionSelections.length === 0) {
        toast({
          title: 'Error',
          description: 'Debe seleccionar al menos una materia o cargo administrativo para nivel secundario',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // For inicial/primario validate subject_area
      if (!inscriptionForm.subject_area) {
        toast({
          title: 'Error',
          description: 'Complete el área/materia',
          variant: 'destructive',
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const { data: inscription, error } = await supabase
        .from('inscriptions')
        .insert({
          user_id: selectedTeacher.id,
          teaching_level: inscriptionForm.teaching_level as 'inicial' | 'primario' | 'secundario',
          inscription_period_id: inscriptionForm.inscription_period_id,
          subject_area: inscriptionForm.subject_area || 'Secundario',
          experience_years: parseInt(inscriptionForm.experience_years),
          availability: inscriptionForm.availability,
          motivational_letter: inscriptionForm.motivational_letter,
          target_position_type_id: inscriptionForm.target_position_type_id || null,
          status: 'submitted', // Administrative inscriptions are submitted directly
        })
        .select()
        .single();

      if (error) throw error;

      // Save secondary selections if applicable
      if (inscriptionForm.teaching_level === 'secundario' && inscription) {
        if (subjectSelections.length > 0) {
          await saveSubjectSelections(inscription.id, subjectSelections);
        }
        if (positionSelections.length > 0) {
          await savePositionSelections(inscription.id, positionSelections);
        }
      }

      toast({
        title: 'Inscripción creada',
        description: `Inscripción creada exitosamente para ${selectedTeacher.first_name} ${selectedTeacher.last_name}`,
      });

      // Reset forms
      setSelectedTeacher(null);
      setSubjectSelections([]);
      setPositionSelections([]);
      setInscriptionForm({
        teaching_level: '',
        inscription_period_id: '',
        subject_area: '',
        experience_years: '0',
        availability: '',
        motivational_letter: '',
        target_position_type_id: '',
      });

    } catch (error: any) {
      console.error('Error creating inscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la inscripción',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const availablePositionTypes = positionTypes.filter(pt => 
    !inscriptionForm.teaching_level || pt.teaching_level === inscriptionForm.teaching_level
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Panel de Administración
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Inscripción Asistida</h1>
            <p className="text-muted-foreground">
              Crear inscripciones manuales sin restricciones de período
            </p>
          </div>
        </div>

        {/* Search Teacher */}
        {!selectedTeacher && (
          <div className="mb-6">
            <TeacherSearchGrid
              onSelectTeacher={handleSelectTeacher}
              onCreateNew={handleCreateNew}
            />
          </div>
        )}

        {/* Teacher Found */}
        {selectedTeacher && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  ✅ Docente Seleccionado
                </div>
                <Badge variant={selectedTeacher.migrated ? "secondary" : "default"}>
                  {selectedTeacher.migrated ? "Migrado" : "Registrado"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nombre</Label>
                  <p>{selectedTeacher.first_name} {selectedTeacher.last_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">DNI</Label>
                  <p>{selectedTeacher.dni}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p>{selectedTeacher.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Teléfono</Label>
                  <p>{selectedTeacher.phone || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Teacher Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Crear Nuevo Docente
              </CardTitle>
              <CardDescription>
                No se encontró un docente con ese DNI. Complete los datos para crear el perfil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Nombres *</Label>
                  <Input
                    id="first_name"
                    required
                    value={teacherForm.first_name}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Apellido *</Label>
                  <Input
                    id="last_name"
                    required
                    value={teacherForm.last_name}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleCreateTeacher}>
                Crear Docente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Inscription Form */}
        {selectedTeacher && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Datos de la Inscripción
              </CardTitle>
              <CardDescription>
                Las inscripciones administrativas no tienen restricciones de fecha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Teaching Level */}
              <div>
                <Label>Nivel Educativo *</Label>
                <RadioGroup
                  value={inscriptionForm.teaching_level}
                  onValueChange={(value) => {
                    setInscriptionForm(prev => ({ ...prev, teaching_level: value, target_position_type_id: '' }));
                    // Reset selections when level changes
                    if (value !== 'secundario') {
                      setSubjectSelections([]);
                      setPositionSelections([]);
                    }
                  }}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inicial" id="inicial" />
                    <Label htmlFor="inicial">Inicial</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="primario" id="primario" />
                    <Label htmlFor="primario">Primario</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="secundario" id="secundario" />
                    <Label htmlFor="secundario">Secundario</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Period Selection */}
              <div>
                <Label htmlFor="period">Período (Informativo) *</Label>
                <Select
                  value={inscriptionForm.inscription_period_id}
                  onValueChange={(value) => setInscriptionForm(prev => ({ ...prev, inscription_period_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name} {period.is_active && <Badge variant="secondary" className="ml-2">Activo</Badge>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Secondary Level Selections */}
              {inscriptionForm.teaching_level === 'secundario' ? (
                <div className="space-y-6">
                  <SecondaryInscriptionWizard
                    onComplete={() => handleSubmitInscription()}
                    initialSubjectSelections={subjectSelections}
                    initialPositionSelections={positionSelections}
                    onSubjectSelectionsChange={setSubjectSelections}
                    onPositionSelectionsChange={setPositionSelections}
                    isLoading={submitting}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject_area">Área/Materia *</Label>
                    <Input
                      id="subject_area"
                      required
                      placeholder="Ej: Matemática, Lengua, etc."
                      value={inscriptionForm.subject_area}
                      onChange={(e) => setInscriptionForm(prev => ({ ...prev, subject_area: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience_years">Años de Experiencia</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      min="0"
                      value={inscriptionForm.experience_years}
                      onChange={(e) => setInscriptionForm(prev => ({ ...prev, experience_years: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Position Type (only for inicial and primario) */}
              {inscriptionForm.teaching_level && inscriptionForm.teaching_level !== 'secundario' && (
                <div>
                  <Label htmlFor="position_type">Tipo de Cargo</Label>
                  <Select
                    value={inscriptionForm.target_position_type_id}
                    onValueChange={(value) => setInscriptionForm(prev => ({ ...prev, target_position_type_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePositionTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="availability">Disponibilidad</Label>
                <Input
                  id="availability"
                  placeholder="Ej: Mañana, Tarde, Completa"
                  value={inscriptionForm.availability}
                  onChange={(e) => setInscriptionForm(prev => ({ ...prev, availability: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="motivational_letter">Carta de Motivación</Label>
                <Textarea
                  id="motivational_letter"
                  placeholder="Explique brevemente su motivación para el cargo..."
                  value={inscriptionForm.motivational_letter}
                  onChange={(e) => setInscriptionForm(prev => ({ ...prev, motivational_letter: e.target.value }))}
                />
              </div>

              {inscriptionForm.teaching_level !== 'secundario' && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setSelectedTeacher(null);
                    setShowCreateForm(false);
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmitInscription} disabled={submitting}>
                    {submitting ? 'Creando Inscripción...' : 'Crear Inscripción'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AssistedInscription;