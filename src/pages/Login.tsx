import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Buscar email por DNI
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('dni', dni)
        .single();

      if (profileError || !profile) {
        toast({
          title: 'Error de inicio de sesión',
          description: 'DNI no encontrado en el sistema',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Login con el email encontrado
      const { error } = await signIn(profile.email, password);
      
      if (!error) {
        navigate('/dashboard');
      } else {
        setShowRecoveryInfo(true);
        toast({
          title: 'Error de inicio de sesión',
          description: 'Contraseña incorrecta',
          variant: 'destructive',
        });
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
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>
            Sistema de Gestión de Inscripciones Docentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dni">Número de DNI</Label>
              <Input
                id="dni"
                type="text"
                placeholder="Ingrese su número de DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
          {showRecoveryInfo && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                📧 ¿Olvidó su contraseña?
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                Para recuperar el acceso a su cuenta, envíe un email a:
              </p>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">
                ceadepunca@gmail.com
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                Incluya en el email:
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1 mb-3">
                <li>Su número de DNI</li>
                <li>Su nombre completo</li>
                <li>Un número de teléfono para contactarlo</li>
              </ul>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Nos comunicaremos con usted para validar su identidad y restablecer su contraseña. Puede enviar el email desde su cuenta registrada o desde cualquier otra.
              </p>
            </div>
          )}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;