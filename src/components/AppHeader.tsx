import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut, FileText, ClipboardList, UserPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AppHeader = () => {
  const { userRoles, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-semibold">CEADEP - Gestión de Inscripciones</h1>
          <nav className="flex items-center space-x-2">
            {(userRoles.includes('evaluator') || userRoles.includes('super_admin')) && (
              <>
                <Button
                  variant={location.pathname === '/evaluations' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/evaluations')}
                  className="flex items-center gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  Evaluaciones
                </Button>
                <Button
                  variant={location.pathname === '/listings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/listings')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Listados
                </Button>
              </>
            )}
            {userRoles.includes('super_admin') && (
              <Button
                variant={location.pathname.startsWith('/admin') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Administración
              </Button>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex flex-wrap gap-1">
            {userRoles.map((role) => (
              <Badge key={role} className={getRoleColor(role)}>
                {getRoleLabel(role)}
              </Badge>
            ))}
          </div>
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
  );
};

export default AppHeader;