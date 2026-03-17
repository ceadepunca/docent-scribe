import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck } from 'lucide-react';

const CompleteProfile = () => {
  const [dni, setDni] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dni.trim()) {
      toast({
        title: 'Error',
        description: 'Debe ingresar su número de DNI',
        variant: 'destructive',
      });
      return;
    }

    // Validate DNI is numeric and reasonable length
    if (!/^\d{7,8}$/.test(dni.trim())) {
      toast({
        title: 'Error',
        description: 'El DNI debe tener 7 u 8 dígitos numéricos',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if DNI is already taken by another user
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('dni', dni.trim())
        .neq('id', user!.id)
        .maybeSingle();

      if (existingProfile) {
        toast({
          title: 'DNI ya registrado',
          description: 'Este número de DNI ya está asociado a otra cuenta. Contacte al administrador si cree que es un error.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Update profile with DNI
      const { error } = await supabase
        .from('profiles')
        .update({ dni: dni.trim() })
        .eq('id', user!.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo guardar el DNI. Intente nuevamente.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'DNI registrado correctamente',
          description: 'A partir de ahora podrá iniciar sesión con su DNI y contraseña.',
        });
        // Force reload to refresh profile data
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Completar Registro</CardTitle>
          <CardDescription>
            Para poder iniciar sesión en el futuro, necesitamos que registre su número de DNI.
            <br />
            <span className="font-medium mt-1 block">
              De ahora en más ingresará con su DNI y la contraseña que eligió al registrarse.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dni">Número de DNI</Label>
              <Input
                id="dni"
                type="text"
                placeholder="Ej: 12345678"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                Ingrese su DNI sin puntos ni espacios (7 u 8 dígitos)
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground">
                <strong>Importante:</strong> El DNI será su identificador de acceso al sistema.
                Asegúrese de ingresarlo correctamente.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Confirmar DNI y continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
