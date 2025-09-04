import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Users, BookOpen } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">CEADEP</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Sistema de Gestión de Inscripciones y Clasificación Docente
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Plataforma digital para la gestión integral de inscripciones, documentación 
            y evaluación de aspirantes a cargos docentes.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/register">Comenzar Registro</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Acceder al Sistema</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <Card>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Inscripciones Online</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Carga y actualización de datos personales, títulos, antecedentes 
                y certificados digitales. Sistema de inscripción y reinscripción anual.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Gestión Documental</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Almacenamiento seguro de documentos digitales con control de 
                versiones, validación y seguimiento de estados.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Clasificación y Evaluación</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Herramientas de evaluación con cálculo automático de puntajes 
                por títulos, antigüedad y antecedentes docentes.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">¡Empieza Hoy!</CardTitle>
              <CardDescription className="text-lg">
                Únete al sistema digital que moderniza la gestión docente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-4">
                <Button size="lg" asChild>
                  <Link to="/register">Crear Cuenta</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/login">Ya tengo cuenta</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
