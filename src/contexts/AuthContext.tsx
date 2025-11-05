'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/types';

interface AuthContextType {
  user: any;
  session: any;
  isAdmin: boolean;
  authLoading: boolean;
  profileLoading: boolean;
  isFullyAuthenticated: boolean;
  setIsFullyAuthenticated: (isAuth: boolean) => void;
  has2FA: boolean | undefined;
  is2FAVerified: boolean;
  setIs2FAVerified: (isVerified: boolean) => void;
  properties: Property[];
  propertiesLoading: boolean;
  isPageLoading: boolean;
  setIsPageLoading: (isLoading: boolean) => void;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  clearCorruptedAuth: () => Promise<void>;
  toast: any;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  authLoading: true,
  profileLoading: false,
  isFullyAuthenticated: false,
  setIsFullyAuthenticated: () => {},
  has2FA: undefined,
  is2FAVerified: false,
  setIs2FAVerified: () => {},
  properties: [],
  propertiesLoading: true,
  isPageLoading: true,
  setIsPageLoading: () => {},
  signOut: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  clearCorruptedAuth: async () => {},
  toast: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isFullyAuthenticated, setIsFullyAuthenticated] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);

  const user = session?.user || null;
  const authLoading = status === 'loading';
  const isAdmin = user?.isAdmin || false;
  const has2FA = user?.has2FA;
  const profileLoading = user && !user.has2FA; // Simplified profile loading

  // Carregar propriedades
  const loadProperties = useCallback(async () => {
    if (!user || !isFullyAuthenticated) {
      setProperties([]);
      setPropertiesLoading(false);
      return;
    }

    try {
      setPropertiesLoading(true);
      const response = await fetch('/api/functions/get-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setPropertiesLoading(false);
    }
  }, [user, isFullyAuthenticated, session?.accessToken]);

  // Sign in com email e senha
  const handleSignIn = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { error: result.error };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'Erro inesperado ao fazer login' } };
    }
  };

  // Sign up
  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Registration failed' };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: { message: 'Erro inesperado ao criar conta' } };
    }
  };

  // Sign in com Google (não implementado ainda)
  const signInWithGoogle = async () => {
    return { error: { message: 'Google sign in not implemented yet' } };
  };

  // Função para limpar dados de autenticação corrompidos
  const clearCorruptedAuth = async () => {
    try {
      // Limpar todos os dados do localStorage relacionados ao auth
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('next-auth') || key.includes('session'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // Limpar estado
      setIsFullyAuthenticated(false);
      setIs2FAVerified(false);
      setProperties([]);
      setPropertiesLoading(false);
      
      // Forçar sign out
      await signOut({ redirect: false });
      
      console.log('Corrupted auth data cleared');
    } catch (error) {
      console.error('Error clearing corrupted auth:', error);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      
      // Limpar estado local
      setIsFullyAuthenticated(false);
      setIs2FAVerified(false);
      setProperties([]);
      setPropertiesLoading(false);
      
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      // Mesmo em caso de erro, limpar estado local
      setIsFullyAuthenticated(false);
      setIs2FAVerified(false);
      setProperties([]);
      setPropertiesLoading(false);
    }
  };

  // Efeito para inicializar autenticação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentSession = await getSession();
        
        if (currentSession?.user) {
          // Se o usuário tem 2FA configurado mas não verificado
          if (currentSession.user.has2FA && !currentSession.user.is2FAVerified) {
            setIsFullyAuthenticated(false);
            setIs2FAVerified(false);
          }
          // Se o usuário não tem 2FA configurado
          else if (!currentSession.user.has2FA) {
            setIsFullyAuthenticated(false);
            setIs2FAVerified(false);
          }
          // Se o usuário tem 2FA configurado e verificado
          else if (currentSession.user.has2FA && currentSession.user.is2FAVerified) {
            setIsFullyAuthenticated(true);
            setIs2FAVerified(true);
          } else {
            setIsFullyAuthenticated(false);
            setIs2FAVerified(false);
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
      }
      
      setIsPageLoading(false);
    };

    initializeAuth();
  }, [session]);

  // Efeito para carregar propriedades quando autenticado
  useEffect(() => {
    loadProperties();
  }, [user, isFullyAuthenticated, loadProperties]);

  // Efeito para redirecionar para configuração/verificação 2FA quando necessário
  useEffect(() => {
    if (user && !authLoading && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      // Evitar redirecionamentos em páginas públicas
      const publicPages = ['/login', '/signup', '/forgot-password', '/debug-2fa', '/debug-auth'];
      const isPublicPage = publicPages.some(page => currentPath.includes(page));
      
      if (isPublicPage) {
        console.log('Página pública detectada, ignorando redirecionamentos 2FA');
        return;
      }
      
      // Se o usuário tem 2FA configurado mas não verificado
      if (user.has2FA && !is2FAVerified) {
        if (!currentPath.includes('/verify-2fa')) {
          console.log('Redirecionando para verificação 2FA - usuário tem 2FA mas não verificado');
          window.location.href = '/verify-2fa';
        }
      }
      // Se o usuário não tem 2FA configurado
      else if (!user.has2FA) {
        if (!currentPath.includes('/setup-2fa') && !currentPath.includes('/login')) {
          console.log('Redirecionando para configuração 2FA - usuário não tem 2FA');
          window.location.href = '/setup-2fa';
        }
      }
      // Se o usuário tem 2FA configurado e verificado
      else if (user.has2FA && is2FAVerified) {
        if (currentPath.includes('/verify-2fa') || currentPath.includes('/setup-2fa')) {
          console.log('2FA completo, redirecionando para simulador');
          window.location.href = '/simulator';
        }
      }
    }
  }, [user, authLoading, is2FAVerified]);

  const value: AuthContextType = {
    user,
    session,
    isAdmin,
    authLoading,
    profileLoading,
    isFullyAuthenticated,
    setIsFullyAuthenticated,
    has2FA,
    is2FAVerified,
    setIs2FAVerified,
    properties,
    propertiesLoading,
    isPageLoading,
    setIsPageLoading,
    signOut: handleSignOut,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle,
    clearCorruptedAuth,
    toast,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}