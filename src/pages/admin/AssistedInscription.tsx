import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { InscriptionDocumentUploader } from '@/components/InscriptionDocumentUploader';
import { useSecondaryInscriptionSelections } from '@/hooks/useSecondaryInscriptionSelections';

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
  const [createdInscription, setCreatedInscription] = useState<any>(null);
  const [existingInscriptions, setExistingInscriptions] = useState<any[]>([]);
  const [editingInscription, setEditingInscription] = useState<any>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

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
    target_position_type_id: '',
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllPeriods();
    }
  }, [isSuperAdmin, fetchAllPeriods]);

  // Load selections for editing inscription
  const { subjectSelections: loadedSubjectSelections, positionSelections: loadedPositionSelections } = useSecondaryInscriptionSelections(editingInscription?.id);

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

  const handleSelectTeacher = async (teacher: any) => {
    setSelectedTeacher(teacher);
    setShowCreateForm(false);
    setEditingInscription(null);
    
    // Check for existing inscriptions
    await checkExistingInscriptions(teacher.id);
  };

  const checkExistingInscriptions = async (teacherId: string) => {
    setLoadingExisting(true);
    try {
      const { data: inscriptions, error } = await supabase
        .from('inscriptions')
        .select(`
          *,
          inscription_periods(name, is_active),
          inscription_subject_selections(id, subject_id, position_type),
          inscription_position_selections(id, administrative_position_id)
        `)
        .eq('user_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setExistingInscriptions(inscriptions || []);
    } catch (error) {
      console.error('Error checking existing inscriptions:', error);
      setExistingInscriptions([]);
    } finally {
      setLoadingExisting(false);
    }
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

  const verifyInscriptionAccess = async (inscriptionId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('inscriptions')
        .select('id')
        .eq('id', inscriptionId)
        .single();
      
      return !error && !!data;
    } catch {
      return false;
    }
  };

  const handleEditInscription = async (inscription: any) => {
    setEditingInscription(inscription);
    
    // Load inscription data into form
    setInscriptionForm({
      teaching_level: inscription.teaching_level,
      inscription_period_id: inscription.inscription_period_id,
      subject_area: inscription.subject_area || '',
      experience_years: inscription.experience_years?.toString() || '0',
      target_position_type_id: inscription.target_position_type_id || '',
    });

    // Wait a moment for the useSecondaryInscriptionSelections hook to load data
    setTimeout(() => {
      // Load existing selections from the hook data
      setSubjectSelections(loadedSubjectSelections.map((sel: any) => ({
        subject_id: sel.subject_id
      })) || []);
      
      setPositionSelections(loadedPositionSelections.map((sel: any) => ({
        administrative_position_id: sel.administrative_position_id
      })) || []);
    }, 100);
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
      let inscription;

      if (editingInscription) {
        // Update existing inscription
        const { data, error } = await supabase
          .from('inscriptions')
          .update({
            teaching_level: inscriptionForm.teaching_level as 'inicial' | 'primario' | 'secundario',
            inscription_period_id: inscriptionForm.inscription_period_id,
            subject_area: inscriptionForm.subject_area || 'Secundario',
            experience_years: parseInt(inscriptionForm.experience_years),
            target_position_type_id: inscriptionForm.target_position_type_id || null,
          })
          .eq('id', editingInscription.id)
          .select()
          .single();

        if (error) throw error;
        inscription = data;
      } else {
        // Create new inscription
        const { data, error } = await supabase
          .from('inscriptions')
          .insert({
            user_id: selectedTeacher.id,
            teaching_level: inscriptionForm.teaching_level as 'inicial' | 'primario' | 'secundario',
            inscription_period_id: inscriptionForm.inscription_period_id,
            subject_area: inscriptionForm.subject_area || 'Secundario',
            experience_years: parseInt(inscriptionForm.experience_years),
            target_position_type_id: inscriptionForm.target_position_type_id || null,
            status: 'submitted', // Administrative inscriptions are submitted directly
          })
          .select()
          .single();

        if (error) throw error;
        inscription = data;
      }

      // Save secondary selections if applicable
      if (inscriptionForm.teaching_level === 'secundario' && inscription) {
        if (subjectSelections.length > 0) {
          await saveSubjectSelections(inscription.id, subjectSelections);
        }
        if (positionSelections.length > 0) {
          await savePositionSelections(inscription.id, positionSelections);
        }
      }

      // Verify inscription is accessible before proceeding
      const isAccessible = await verifyInscriptionAccess(inscription.id);
      if (!isAccessible) {
        // Wait a moment and retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryAccessible = await verifyInscriptionAccess(inscription.id);
        if (!retryAccessible) {
          throw new Error('La inscripción se creó pero no está disponible inmediatamente. Intente recargar la página.');
        }
      }

      const selectedPeriod = periods.find(p => p.id === inscriptionForm.inscription_period_id);
      
      // Set created inscription to show document uploader
      setCreatedInscription({
        ...inscription, 
        teacher: selectedTeacher,
        period: selectedPeriod
      });

      toast({
        title: editingInscription ? 'Inscripción actualizada' : 'Inscripción creada',
        description: `Inscripción ${editingInscription ? 'actualizada' : 'creada'} exitosamente para ${selectedTeacher.first_name} ${selectedTeacher.last_name} en el período "${selectedPeriod?.name || 'No especificado'}"`,
      });

      // Refresh existing inscriptions
      await checkExistingInscriptions(selectedTeacher.id);

    } catch (error: any) {
      console.error('Error saving inscription:', error);
      toast({
        title: 'Error',
        description: error.message || `No se pudo ${editingInscription ? 'actualizar' : 'crear'} la inscripción`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewInscription = () => {
    // Reset all forms and state
    setCreatedInscription(null);
    setSelectedTeacher(null);
    setSubjectSelections([]);
    setPositionSelections([]);
    setEditingInscription(null);
    setExistingInscriptions([]);
    setInscriptionForm({
      teaching_level: '',
      inscription_period_id: '',
      subject_area: '',
      experience_years: '0',
      target_position_type_id: '',
    });
  };

  const handleNewInscriptionForTeacher = () => {
    setEditingInscription(null);
    setSubjectSelections([]);
    setPositionSelections([]);
    setInscriptionForm({
      teaching_level: '',
      inscription_period_id: '',
      subject_area: '',
      experience_years: '0',
      target_position_type_id: '',
    });
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
          <div className="space-y-6">
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

            {/* Existing Inscriptions */}
            {loadingExisting && (
              <Card>
                <CardContent className="py-6">
                  <p className="text-center text-muted-foreground">Verificando inscripciones existentes...</p>
                </CardContent>
              </Card>
            )}

            {!loadingExisting && existingInscriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Inscripciones Existentes ({existingInscriptions.length})</span>
                    <Button variant="outline" size="sm" onClick={handleNewInscriptionForTeacher}>
                      Nueva Inscripción
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Este docente ya tiene inscripciones. Puede modificar una existente o crear una nueva.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {existingInscriptions.map((inscription) => (
                      <div key={inscription.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {inscription.inscription_periods?.name || 'Período no especificado'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Nivel: {inscription.teaching_level} • Estado: {inscription.status}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Materias: {inscription.inscription_subject_selections?.length || 0} • 
                              Cargos: {inscription.inscription_position_selections?.length || 0}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditInscription(inscription)}
                            >
                              {editingInscription?.id === inscription.id ? 'Editando...' : 'Modificar'}
                            </Button>
                          </div>
                        </div>
                        {inscription.inscription_subject_selections?.length === 0 && 
                         inscription.inscription_position_selections?.length === 0 && (
                          <Alert>
                            <AlertDescription>
                              ⚠️ Esta inscripción no tiene materias ni cargos seleccionados y no se puede evaluar.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
        {selectedTeacher && (!existingInscriptions.length || editingInscription || (!loadingExisting && !editingInscription)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                {editingInscription ? 'Modificar Inscripción' : 'Nueva Inscripción'}
              </CardTitle>
              <CardDescription>
                {editingInscription 
                  ? 'Modificando inscripción existente - puede agregar materias faltantes'
                  : 'Las inscripciones administrativas no tienen restricciones de fecha'
                }
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
                    onComplete={(data) => {
                      setSubjectSelections(data.subjectSelections);
                      setPositionSelections(data.positionSelections);
                      handleSubmitInscription();
                    }}
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

              {/* Campos de disponibilidad y carta de motivación eliminados */}

              {inscriptionForm.teaching_level !== 'secundario' && (
                <div className="flex justify-end gap-2 pt-4">
                  {editingInscription && (
                    <Button 
                      variant="outline"
                      onClick={handleNewInscriptionForTeacher}
                      disabled={submitting}
                    >
                      Cancelar Edición
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => {
                    setSelectedTeacher(null);
                    setShowCreateForm(false);
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmitInscription} disabled={submitting}>
                    {submitting ? 'Guardando...' : (editingInscription ? 'Actualizar Inscripción' : 'Crear Inscripción')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Success Message and Document Upload */}
        {createdInscription && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-green-600">
                ✅ Inscripción Creada Exitosamente
              </CardTitle>
              <CardDescription>
                Inscripción ID: {createdInscription.id} para {createdInscription.teacher.first_name} {createdInscription.teacher.last_name} 
                {createdInscription.period && ` - Período: ${createdInscription.period.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  La inscripción ha sido creada con estado "Enviada". 
                  Ahora puede adjuntar documentos de antecedentes si es necesario.
                </p>
              </div>
              
              {createdInscription?.id ? (
                <InscriptionDocumentUploader 
                  inscriptionId={createdInscription.id}
                  disabled={false}
                />
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>
                    Error: No se pudo obtener el ID de la inscripción. Intente recargar la página.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-center gap-2 pt-4">
                <Button 
                  onClick={handleCreateNewInscription}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Crear Nueva Inscripción
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AssistedInscription;