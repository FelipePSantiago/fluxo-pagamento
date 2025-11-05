'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function DebugAuthPage() {
  const { 
    user, 
    session, 
    authLoading, 
    profileLoading,
    isFullyAuthenticated, 
    has2FA, 
    is2FAVerified,
    isAdmin,
    clearCorruptedAuth,
    signOut 
  } = useAuth();
  
  const { data: nextAuthSession } = useSession();
  
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getDebugInfo = async () => {
    setIsLoading(true);
    try {
      const storageKeys = [];
      
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('next-auth') || key.includes('session'))) {
            storageKeys.push({
              key,
              value: localStorage.getItem(key)?.substring(0, 50) + '...'
            });
          }
        }
      }

      setDebugInfo({
        nextAuthSession: nextAuthSession ? {
          user: {
            id: nextAuthSession.user?.id,
            email: nextAuthSession.user?.email,
            name: nextAuthSession.user?.name,
            isAdmin: nextAuthSession.user?.isAdmin,
            has2FA: nextAuthSession.user?.has2FA,
            is2FAVerified: nextAuthSession.user?.is2FAVerified,
          },
          expires: nextAuthSession.expires
        } : null,
        localStorageKeys: storageKeys,
        contextState: {
          user: user ? { id: user.id, email: user.email } : null,
          authLoading,
          profileLoading,
          isFullyAuthenticated,
          has2FA,
          is2FAVerified,
          isAdmin
        }
      });
    } catch (error) {
      setDebugInfo({ error: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAuth = async () => {
    await clearCorruptedAuth();
    setDebugInfo(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 Debug de Autenticação</h1>
        <p className="text-muted-foreground">
          Use esta página para diagnosticar problemas de login e autenticação
        </p>
      </div>

      <div className="grid gap-6">
        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações de Debug</CardTitle>
            <CardDescription>
              Ferramentas para diagnosticar e corrigir problemas de autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button onClick={getDebugInfo} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Obter Informações
              </Button>
              <Button variant="outline" onClick={handleClearAuth}>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Dados Corrompidos
              </Button>
              <Button variant="destructive" onClick={signOut}>
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado Atual */}
        <Card>
          <CardHeader>
            <CardTitle>Estado Atual do Contexto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm font-mono">
              <div>👤 Usuário: {user ? `${user.email} (${user.id})` : 'Não logado'}</div>
              <div>🔄 Auth Loading: {authLoading ? 'Sim' : 'Não'}</div>
              <div>📋 Profile Loading: {profileLoading ? 'Sim' : 'Não'}</div>
              <div>👑 Admin: {isAdmin ? 'Sim' : 'Não'}</div>
              <div>✅ Fully Authenticated: {isFullyAuthenticated ? 'Sim' : 'Não'}</div>
              <div>🔐 Tem 2FA: {has2FA === undefined ? 'Não verificado' : has2FA ? 'Sim' : 'Não'}</div>
              <div>✅ 2FA Verificado: {is2FAVerified ? 'Sim' : 'Não'}</div>
              <div>📧 Sessão: {session ? 'Ativa' : 'Inativa'}</div>
              <div>📍 Página atual: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Debug */}
        {debugInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Detalhadas</CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.error ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Erro:</strong> {debugInfo.error}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {/* Sessão NextAuth */}
                  <div>
                    <h4 className="font-semibold mb-2">Sessão NextAuth:</h4>
                    {debugInfo.nextAuthSession ? (
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                        {JSON.stringify(debugInfo.nextAuthSession, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma sessão ativa</p>
                    )}
                  </div>

                  {/* localStorage */}
                  <div>
                    <h4 className="font-semibold mb-2">LocalStorage (chaves NextAuth):</h4>
                    {debugInfo.localStorageKeys?.length > 0 ? (
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                        {JSON.stringify(debugInfo.localStorageKeys, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma chave encontrada</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p>1. <strong>Obter Informações:</strong> Mostra dados detalhados da sessão atual</p>
              <p>2. <strong>Limpar Dados Corrompidos:</strong> Remove tokens inválidos do localStorage</p>
              <p>3. <strong>Sair:</strong> Faz logout completo</p>
            </div>
            
            <Alert>
              <AlertDescription>
                <strong>💡 Dica:</strong> Se estiver com erro de autenticação, 
                use "Limpar Dados Corrompidos" e depois faça login novamente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}