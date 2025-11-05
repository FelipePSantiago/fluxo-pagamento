'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { Property } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  authLoading: boolean;
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
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  authLoading: true,
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isFullyAuthenticated, setIsFullyAuthenticated] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const authLoading = !user && !session;
  const isAdmin = profile?.is_admin || false;
  const has2FA = profile?.has_2fa;

  // Carregar perfil do usuário
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
      
      // Definir como fully authenticated após carregar o perfil
      if (data) {
        // Se o usuário não tem 2FA configurado, já está fully authenticated
        if (!data.has_2fa) {
          setIsFullyAuthenticated(true);
          setIs2FAVerified(true);
        } else {
          // Se tem 2FA, verificar se já foi verificado nesta sessão
          const wasVerified = localStorage.getItem(`2fa-verified-${userId}`);
          if (wasVerified === "true") {
            setIs2FAVerified(true);
            setIsFullyAuthenticated(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Carregar propriedades
  const loadProperties = async () => {
    if (!user || !isFullyAuthenticated) {
      setProperties([]);
      setPropertiesLoading(false);
      return;
    }

    try {
      setPropertiesLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading properties:', error);
        return;
      }

      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setPropertiesLoading(false);
    }
  };

  // Sign in com email e senha
  const signIn = async (email: string, password: string) => {
    try {
      // Limpar sessão anterior antes de fazer login
      await supabase.auth.signOut({ scope: 'local' });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      // Login bem-sucedido
      console.log('Sign in successful:', data.user?.email);
      return { error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error: { message: 'Erro inesperado ao fazer login' } };
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    return { error };
  };

  // Sign in com Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/simulator`,
      },
    });
    return { error };
  };

  // Função para limpar dados de autenticação corrompidos
  const clearCorruptedAuth = async () => {
    try {
      // Limpar todos os dados do localStorage relacionados ao auth
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // Limpar estado
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsFullyAuthenticated(false);
      setIs2FAVerified(false);
      setProperties([]);
      setPropertiesLoading(false);
      
      // Forçar sign out no Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('Corrupted auth data cleared');
    } catch (error) {
      console.error('Error clearing corrupted auth:', error);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Limpar estado local independentemente do erro
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsFullyAuthenticated(false);
      setIs2FAVerified(false);
      setProperties([]);
      setPropertiesLoading(false);
      
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      // Mesmo em caso de erro, limpar estado local
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsFullyAuthenticated(false);
      setIs2FAVerified(false);
      setProperties([]);
      setPropertiesLoading(false);
    }
  };

  // Efeito para inicializar autenticação
  useEffect(() => {
    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Limpar dados inválidos
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsFullyAuthenticated(false);
          setIs2FAVerified(false);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        // Limpar estado em caso de erro
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsFullyAuthenticated(false);
        setIs2FAVerified(false);
      }
      
      setIsPageLoading(false);
    };

    getInitialSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadProfile(session.user.id);
          } else {
            setProfile(null);
            setIsFullyAuthenticated(false);
            setIs2FAVerified(false);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          // Limpar estado em caso de erro
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsFullyAuthenticated(false);
          setIs2FAVerified(false);
        }
        
        setIsPageLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Efeito para carregar propriedades quando autenticado
  useEffect(() => {
    loadProperties();
  }, [user, isFullyAuthenticated]);

  // Efeito para redirecionar para verificação 2FA quando necessário
  useEffect(() => {
    if (user && profile && profile.has_2fa && !is2FAVerified && typeof window !== 'undefined') {
      // Verificar se não está já na página de verificação 2FA
      if (!window.location.pathname.includes('/verify-2fa')) {
        window.location.href = '/verify-2fa';
      }
    }
  }, [user, profile, is2FAVerified]);

  const value: AuthContextType = {
    user,
    session,
    isAdmin,
    authLoading,
    isFullyAuthenticated,
    setIsFullyAuthenticated,
    has2FA,
    is2FAVerified,
    setIs2FAVerified,
    properties,
    propertiesLoading,
    isPageLoading,
    setIsPageLoading,
    signOut,
    signIn,
    signUp,
    signInWithGoogle,
    clearCorruptedAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}