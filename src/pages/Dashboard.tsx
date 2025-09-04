import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, FileText, Users, Settings, Plus } from 'lucide-react';

const Dashboard = () => {
  const { profile, userRoles, signOut, isSuperAdmin, isEvaluator, isDocente } = useAuth();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-destructive text-destructive-foreground';
      case 'evaluator':
        return 'bg-primary text-primary-foreground';
      case 'docente':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrador';
      case 'evaluator':
        return 'Evaluador';
      case 'docente':
        return 'Docente';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">CEADEP - Gestión de Inscripciones</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {profile?.first_name} {profile?.last_name}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Panel de Control</h2>
          <div className="flex flex-wrap gap-2">
            {userRoles.map((role) => (
              <Badge key={role} className={getRoleColor(role)}>
                {getRoleLabel(role)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mi Perfil</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.first_name} {profile?.last_name}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.email}
              </p>
              <Button variant="outline" size="sm" className="mt-4">
                Editar Perfil
              </Button>
            </CardContent>
          </Card>

          {/* Docente Features */}
          {isDocente && (
            <>
              <Card>
                <CardContent className="p-0">
                  <Button 
                    variant="outline" 
                    className="w-full h-auto flex flex-col items-center p-6 bg-card hover:bg-accent transition-colors"
                    onClick={() => window.location.href = '/inscriptions/new'}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">Nueva Inscripción</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Postúlate para una nueva posición docente
                    </p>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Button 
                    variant="outline" 
                    className="w-full h-auto flex flex-col items-center p-6 bg-card hover:bg-accent transition-colors"
                    onClick={() => window.location.href = '/inscriptions'}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">Ver Inscripciones</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Revisa el estado de tus postulaciones
                    </p>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Evaluator Features */}
          {isEvaluator && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Evaluaciones</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Aspirantes por evaluar
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  Ver Evaluaciones
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Super Admin Features */}
          {isSuperAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administración</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Gestiona usuarios, roles y configuración del sistema
                </CardDescription>
                <Button variant="outline" size="sm">
                  Panel Admin
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Welcome message based on role */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Bienvenido al Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {isSuperAdmin && (
              <p className="text-muted-foreground">
                Como Super Administrador, tienes acceso total al sistema. Puedes gestionar usuarios, 
                configurar evaluaciones y administrar todos los aspectos de la plataforma.
              </p>
            )}
            {isEvaluator && !isSuperAdmin && (
              <p className="text-muted-foreground">
                Como Evaluador, puedes acceder a las herramientas de clasificación y evaluación 
                de aspirantes docentes.
              </p>
            )}
            {isDocente && !isEvaluator && !isSuperAdmin && (
              <p className="text-muted-foreground">
                Bienvenido docente. Aquí podrás gestionar tus inscripciones, cargar documentos 
                y mantener actualizada tu información profesional.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;