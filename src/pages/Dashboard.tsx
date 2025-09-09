import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  FileText, 
  Users, 
  ClipboardList, 
  Settings,
  AlertCircle,
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';

const Dashboard = () => {
  const { isEvaluator, isDocente, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { isComplete: profileComplete, completionPercentage, missingFields } = useProfileCompleteness();
  const { availableLevels, loading: periodsLoading, getPeriodForLevel } = useInscriptionPeriods();

  return (
    <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Panel de Control</h2>
          <p className="text-muted-foreground">
            Bienvenido al sistema de gestión de inscripciones docentes
          </p>
        </div>

        {/* Profile Completion Status */}
        {!profileComplete && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Complete su perfil para poder inscribirse a los cargos docentes.
              <div className="mt-2">
                <Progress value={completionPercentage} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  {completionPercentage}% completado. Faltan: {missingFields.join(', ')}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Inscription Status */}
        {profileComplete && availableLevels.length === 0 && !periodsLoading && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay períodos de inscripción abiertos actualmente. Su perfil está completo y podrá inscribirse cuando se abran nuevos períodos.
            </AlertDescription>
          </Alert>
        )}

        {profileComplete && availableLevels.length > 0 && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ¡Perfil completo! Puede inscribirse en los niveles: {availableLevels.join(', ')}.
            </AlertDescription>
          </Alert>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Mi Perfil Card - Always visible */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/profile')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Mi Perfil
                {profileComplete && <CheckCircle className="h-4 w-4 text-green-500" />}
              </CardTitle>
              <CardDescription>
                {profileComplete ? 'Editar información personal' : 'Completar información personal'}
              </CardDescription>
            </CardHeader>
            {!profileComplete && (
              <CardContent>
                <Progress value={completionPercentage} />
                <p className="text-xs text-muted-foreground mt-1">
                  {completionPercentage}% completado
                </p>
              </CardContent>
            )}
          </Card>

          {/* Inscription Cards - Only for teachers */}
          {isDocente && profileComplete && availableLevels.map((level) => (
            <Card 
              key={level} 
              className="hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => {
            const period = getPeriodForLevel(level);
            if (period) {
              navigate(`/new-inscription?level=${level}&periodId=${period.id}`);
            }
          }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Inscribirse - {level.charAt(0).toUpperCase() + level.slice(1)}
                </CardTitle>
                <CardDescription>
                  Crear inscripción para nivel {level}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}

          {/* Ver Inscripciones Card - For teachers and super admins */}
          {(isDocente || isSuperAdmin) && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/inscriptions')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  {isSuperAdmin && !isDocente ? 'Gestionar Inscripciones' : 'Ver Inscripciones'}
                </CardTitle>
                <CardDescription>
                  {isSuperAdmin && !isDocente ? 'Administrar todas las inscripciones' : 'Revisar mis inscripciones'}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Evaluaciones Card - Only for Evaluators */}
          {isEvaluator && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/evaluations')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Evaluaciones
                </CardTitle>
                <CardDescription>
                  Evaluar inscripciones docentes
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Administración Card - Only for Super Admins */}
          {isSuperAdmin && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Administración
                </CardTitle>
                <CardDescription>
                  Panel de administración
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Welcome message based on role */}
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido al Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {isSuperAdmin && (
              <p className="text-muted-foreground">
                Como Super Administrador, tienes acceso total al sistema. Puedes gestionar usuarios, 
                períodos de inscripción y administrar todos los aspectos de la plataforma.
              </p>
            )}
            {isEvaluator && !isSuperAdmin && (
              <p className="text-muted-foreground">
                Como Evaluador, puedes acceder a las herramientas de clasificación y evaluación 
                de aspirantes docentes en todos los niveles educativos.
              </p>
            )}
            {isDocente && !isEvaluator && !isSuperAdmin && (
              <p className="text-muted-foreground">
                Bienvenido docente. Aquí podrás gestionar tus inscripciones por nivel, 
                completar tu perfil académico y mantener actualizada tu información profesional.
              </p>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default Dashboard;