import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'evaluator' | 'docente';
  allowedRoles?: ('super_admin' | 'evaluator' | 'docente')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  allowedRoles 
}) => {
  const { user, loading, hasRole, requiresPasswordChange, profile } = useAuth();
  const location = window.location;

  // Wait for auth and roles to load before enforcing access
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow access to change-password and complete-profile without other checks
  if (location.pathname === '/change-password' || location.pathname === '/complete-profile') {
    return <>{children}</>;
  }

  // Redirect to change-password if required
  if (requiresPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  // Redirect to complete-profile if user has no DNI set
  if (profile && !profile.dni) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Check if user has required role
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user has any of the allowed roles
  if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;