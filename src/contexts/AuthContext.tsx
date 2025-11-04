'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Property } from '@/types';

interface AuthContextType {
  user: any | null;
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
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isFullyAuthenticated, setIsFullyAuthenticated] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);

  const authLoading = status === 'loading';
  const user = session?.user || null;
  const isAdmin = user?.email === 'santiago.physics@gmail.com' || user?.email === 'test@test.com';
  const [has2FA, setHas2FA] = useState<boolean | undefined>(undefined);

  // Carregar propriedades
  useEffect(() => {
    if (user && isFullyAuthenticated) {
      loadProperties();
    } else {
      setProperties([]);
      setPropertiesLoading(false);
    }
  }, [user, isFullyAuthenticated]);

  const loadProperties = async () => {
    try {
      setPropertiesLoading(true);
      const response = await fetch('/api/functions/get-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}