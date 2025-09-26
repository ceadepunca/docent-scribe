import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut, FileText, ClipboardList, UserPlus, Home, List } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

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

  const navLinks = [
    { to: '/dashboard', label: 'Inicio', icon: <Home className="h-4 w-4" />, roles: ['docente', 'evaluator', 'super_admin'] },
    { to: '/inscriptions', label: 'Inscripciones', icon: <ClipboardList className="h-4 w-4" />, roles: ['docente', 'super_admin'] },
    { to: '/evaluations', label: 'Evaluaciones', icon: <ClipboardList className="h-4 w-4" />, roles: ['evaluator', 'super_admin'] },
    { to: '/listings', label: 'Listados', icon: <FileText className="h-4 w-4" />, roles: ['evaluator', 'super_admin'] },
    { to: '/admin', label: 'Administración', icon: <UserPlus className="h-4 w-4" />, roles: ['super_admin'] },
  ];

  const filteredNavLinks = navLinks.filter(link => link.roles.some(role => userRoles.includes(role)));

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <List className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Gestión de Inscripciones</h1>
          </Link>
          <nav className="flex items-center space-x-2">
            {filteredNavLinks.map(link => (
              <Button
                key={link.to}
                variant={location.pathname === link.to ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate(link.to)}
                className="flex items-center gap-2"
              >
                {link.icon}
                {link.label}
              </Button>
            ))}
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