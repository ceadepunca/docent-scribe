import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, GraduationCap, Plus, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DocumentUploader } from '@/components/DocumentUploader';
import { DocumentViewer } from '@/components/DocumentViewer';
import { useProfileDocuments } from '@/hooks/useProfileDocuments';
import { TitleCard } from '@/components/TitleCard';
import { EmailChangeRequestModal } from '@/components/EmailChangeRequestModal';

const profileSchema = z.object({
  dni: z.string().optional().or(z.literal('')),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
  titulo1Nombre: z.string().min(1, 'El primer título es obligatorio'),
  titulo1FechaEgreso: z.string().min(1, 'La fecha de egreso es obligatoria'),
  titulo1Promedio: z.string().regex(/^\d+\.?\d*$/, 'Ingrese un promedio válido'),
  titulo2Nombre: z.string().optional(),
  titulo2FechaEgreso: z.string().optional(),
  titulo2Promedio: z.string().optional(),
  titulo3Nombre: z.string().optional(),
  titulo3FechaEgreso: z.string().optional(),
  titulo3Promedio: z.string().optional(),
  titulo4Nombre: z.string().optional(),
  titulo4FechaEgreso: z.string().optional(),
  titulo4Promedio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { documents, getDocumentByType, refreshDocuments } = useProfileDocuments();
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  
  // State for managing visible additional titles
  const [visibleTitles, setVisibleTitles] = useState<number[]>(() => {
    // Show additional titles that already have data
    const existingTitles = [];
    if (profile?.titulo_2_nombre) existingTitles.push(2);
    if (profile?.titulo_3_nombre) existingTitles.push(3);
    if (profile?.titulo_4_nombre) existingTitles.push(4);
    return existingTitles;
  });
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      dni: profile?.dni || '',
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      titulo1Nombre: profile?.titulo_1_nombre || '',
      titulo1FechaEgreso: profile?.titulo_1_fecha_egreso || '',
      titulo1Promedio: profile?.titulo_1_promedio?.toString() || '',
      titulo2Nombre: profile?.titulo_2_nombre || '',
      titulo2FechaEgreso: profile?.titulo_2_fecha_egreso || '',
      titulo2Promedio: profile?.titulo_2_promedio?.toString() || '',
      titulo3Nombre: profile?.titulo_3_nombre || '',
      titulo3FechaEgreso: profile?.titulo_3_fecha_egreso || '',
      titulo3Promedio: profile?.titulo_3_promedio?.toString() || '',
      titulo4Nombre: profile?.titulo_4_nombre || '',
      titulo4FechaEgreso: profile?.titulo_4_fecha_egreso || '',
      titulo4Promedio: profile?.titulo_4_promedio?.toString() || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          dni: data.dni,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          titulo_1_nombre: data.titulo1Nombre,
          titulo_1_fecha_egreso: data.titulo1FechaEgreso,
          titulo_1_promedio: parseFloat(data.titulo1Promedio),
          titulo_2_nombre: data.titulo2Nombre || null,
          titulo_2_fecha_egreso: data.titulo2FechaEgreso || null,
          titulo_2_promedio: data.titulo2Promedio ? parseFloat(data.titulo2Promedio) : null,
          titulo_3_nombre: data.titulo3Nombre || null,
          titulo_3_fecha_egreso: data.titulo3FechaEgreso || null,
          titulo_3_promedio: data.titulo3Promedio ? parseFloat(data.titulo3Promedio) : null,
          titulo_4_nombre: data.titulo4Nombre || null,
          titulo_4_fecha_egreso: data.titulo4FechaEgreso || null,
          titulo_4_promedio: data.titulo4Promedio ? parseFloat(data.titulo4Promedio) : null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Perfil actualizado',
        description: 'Sus datos han sido guardados correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4">
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Mi Perfil</h1>
              <p className="text-muted-foreground">
                Mantenga actualizada su información personal y títulos académicos
              </p>
            </div>
          </div>

          <Form {...form}>
            {/* IMPORTANT: form has an id so the sticky footer submit can target it */}
            <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Datos básicos de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>DNI (opcional para pruebas)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ingrese su DNI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEmailChangeModal(true)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Solicitar Cambio
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        ℹ️ El email es un dato sensible vinculado a su DNI. Para cambiarlo, debe solicitar 
                        la modificación y esperar aprobación del administrador.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono celular *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Academic Titles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Títulos Académicos
                </CardTitle>
                <CardDescription>
                  Registre hasta 4 títulos académicos. El primer título es obligatorio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Title (Required) */}
                <TitleCard
                  control={form.control}
                  titleNumber={1}
                  isRequired
                />

                {/* Additional Titles (Dynamic) */}
                {visibleTitles.map((titleNumber) => (
                  <TitleCard
                    key={titleNumber}
                    control={form.control}
                    titleNumber={titleNumber}
                    onRemove={() => {
                      setVisibleTitles(prev => prev.filter(num => num !== titleNumber));
                      // Clear form values for this title
                      form.setValue(`titulo${titleNumber}Nombre` as keyof ProfileFormData, '');
                      form.setValue(`titulo${titleNumber}FechaEgreso` as keyof ProfileFormData, '');
                      form.setValue(`titulo${titleNumber}Promedio` as keyof ProfileFormData, '');
                    }}
                  />
                ))}

                {/* Add Additional Title Button */}
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
              </CardContent>
            </Card>

            {/* Note: submit buttons moved to sticky footer below */}
            </form>
          </Form>

          {/* Documentos Requeridos */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos (Opcionales para Pruebas)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Durante la fase de pruebas, los documentos son opcionales. Puede subir las fotografías de ambos lados de su DNI y los archivos PDF de sus títulos académicos.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* DNI Documents */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Documento Nacional de Identidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentUploader
                  documentType="dni_frente"
                  label="DNI - Frente (opcional)"
                  acceptedFormats="image/*"
                  maxSizeMB={5}
                  existingDocument={getDocumentByType('dni_frente')}
                  onUploadSuccess={refreshDocuments}
                />
                <DocumentUploader
                  documentType="dni_dorso"
                  label="DNI - Dorso (opcional)"
                  acceptedFormats="image/*"
                  maxSizeMB={5}
                  existingDocument={getDocumentByType('dni_dorso')}
                  onUploadSuccess={refreshDocuments}
                />
              </div>
            </div>

            {/* Academic Titles Documents */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Títulos Académicos</h3>
              <div className="space-y-4">
                <DocumentUploader
                  documentType="titulo_pdf"
                  label="Título Académico (PDF - opcional)"
                  acceptedFormats=".pdf"
                  maxSizeMB={10}
                  existingDocument={getDocumentByType('titulo_pdf')}
                  onUploadSuccess={refreshDocuments}
                />
                <p className="text-sm text-muted-foreground">
                  Durante las pruebas, puede omitir la subida de documentos. Si desea subirlos, incluya un archivo PDF que contenga todas las páginas de su título académico principal.
                </p>
              </div>
            </div>

            {/* Document Viewer */}
            {documents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Documentos Subidos</h3>
                <DocumentViewer documents={documents} />
              </div>
            )}
          </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky footer with Update button */}
      <div className="sticky bottom-0 z-30 bg-background border-t">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Cancelar
          </Button>
          <Button type="submit" form="profile-form">
            Actualizar
          </Button>
        </div>
      </div>

      {/* Email Change Request Modal */}
      <EmailChangeRequestModal
        open={showEmailChangeModal}
        onOpenChange={setShowEmailChangeModal}
        currentEmail={profile?.email || ''}
      />
    </div>
  );
};

export default Profile;
