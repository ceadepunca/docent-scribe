import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  dni: z.string().min(7, "El DNI debe tener al menos 7 dígitos").max(8, "El DNI debe tener máximo 8 dígitos").regex(/^\d+$/, "El DNI debe contener solo números"),
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-4xl mx-auto">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormLabel>DNI *</FormLabel>
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
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
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
                {/* Título 1 (Obligatorio) */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold mb-4 text-primary">Título Principal *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="titulo1Nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Título *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Profesorado en..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="titulo1FechaEgreso"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Egreso *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="titulo1Promedio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Promedio *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="1"
                              max="10"
                              placeholder="8.50"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Títulos 2-4 (Opcionales) */}
                {[2, 3, 4].map((num) => (
                  <div key={num} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Título Adicional #{num}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`titulo${num}Nombre` as keyof ProfileFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Título</FormLabel>
                            <FormControl>
                              <Input placeholder="Opcional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`titulo${num}FechaEgreso` as keyof ProfileFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Egreso</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`titulo${num}Promedio` as keyof ProfileFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Promedio</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                min="1"
                                max="10"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Profile;