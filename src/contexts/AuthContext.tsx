import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
type UserRole = 'super_admin' | 'evaluator' | 'docente';

interface Profile {
  id: string;
  dni?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  titulo_1_nombre?: string;
  titulo_1_fecha_egreso?: string;
  titulo_1_promedio?: number;
  titulo_2_nombre?: string;
  titulo_2_fecha_egreso?: string;
  titulo_2_promedio?: number;
  titulo_3_nombre?: string;
  titulo_3_fecha_egreso?: string;
  titulo_3_promedio?: number;
  titulo_4_nombre?: string;
  titulo_4_fecha_egreso?: string;
  titulo_4_promedio?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRoles: UserRole[];
  loading: boolean;
  requiresPasswordChange: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: any }>;
  hasRole: (role: UserRole) => boolean;
  isSuperAdmin: boolean;
  isEvaluator: boolean;
  isDocente: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setProfileLoading(true);
          setRolesLoading(true);
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRoles([]);
          setProfileLoading(false);
          setRolesLoading(false);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setProfileLoading(true);
        setRolesLoading(true);
        fetchUserProfile(session.user.id);
        fetchUserRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      if (data) {
        setUserRoles(data.map(item => item.role as UserRole));
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setRolesLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registro exitoso",
        description: "Por favor verifica tu email para completar el registro.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    try {
      // Try global sign out (revokes refresh token server-side)
      const { error } = await supabase.auth.signOut({ scope: 'global' as any });
      if (error && !`${error.message}`.includes('session_not_found')) {
        toast({
          title: "Error al cerrar sesión",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      try {
        // Ensure local session is cleared regardless of server response
        await supabase.auth.signOut({ scope: 'local' as any });
      } catch {}

      // Extra hard reset: remove any Supabase auth keys from storage
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith('sb-') || key.startsWith('supabase.')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}

      // Clear React Query cache to avoid leaking prior user data
      try { queryClient.clear(); } catch {}

      // Local state cleanup
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRoles([]);

      // Navigate to login
      window.location.replace('/login');
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!profile?.email) {
      return { error: { message: 'No se encontró el email del usuario' } };
    }

    // Verificar contraseña actual
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword
    });
    
    if (verifyError) {
      return { error: { message: 'Contraseña actual incorrecta' } };
    }
    
    // Actualizar contraseña
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { requires_password_change: false }
    });
    
    return { error };
  };

  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  const isSuperAdmin = hasRole('super_admin');
  const isEvaluator = hasRole('evaluator');
  const isDocente = hasRole('docente');
  const requiresPasswordChange = user?.user_metadata?.requires_password_change === true;

  // Update loading state based on profile and roles loading states
  useEffect(() => {
    if (user) {
      setLoading(profileLoading || rolesLoading);
    }
  }, [user, profileLoading, rolesLoading]);

  // Clear cache whenever user changes (prevents data leakage between sessions)
  useEffect(() => {
    queryClient.clear();
  }, [user?.id]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    userRoles,
    loading,
    requiresPasswordChange,
    signIn,
    signUp,
    signOut,
    updatePassword,
    hasRole,
    isSuperAdmin,
    isEvaluator,
    isDocente,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};