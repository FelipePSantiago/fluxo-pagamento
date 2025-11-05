'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, ShieldCheck, Settings } from 'lucide-react';
import { functions } from '@/lib/api/functions';
import { useSession } from 'next-auth/react';

export default function Debug2FAPage() {
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
  const [testResult, setTestResult] = useState<any>(null);

  const getDetailedDebugInfo = async () => {
    setIsLoading(true);
    try {
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
        contextState: {
          user: user ? { id: user.id, email: user.email } : null,
          authLoading,
          profileLoading,
          isFullyAuthenticated,
          has2FA,
          is2FAVerified,
          isAdmin
        },
        localStorage2FA: user ? localStorage.getItem(`2fa-verified-${user.id}`) : null
      });
    } catch (error) {
      setDebugInfo({ error: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const testGenerate2FASecret = async () => {
    setIsLoading(true);
    try {
      console.log('Testando geração de segredo 2FA...');
      const result = await functions.generateTwoFactorSecret();
      setTestResult({
        success: true,
        data: result,
        message: 'Segredo 2FA gerado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro no teste de geração 2FA:', error);
      setTestResult({
        success: false,
        error: error.message,
        message: 'Falha ao gerar segredo 2FA'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clear2FAData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Limpar localStorage
      localStorage.removeItem(`2fa-verified-${user.id}`);
      
      setTestResult({
        success: true,
        message: 'Dados 2FA limposos com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao limpar dados 2FA:', error);
      setTestResult({
        success: false,
        error: error.message,
        message: 'Falha ao limpar dados 2FA'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔐 Debug 2FA</h1>
        <p className="text-muted-foreground">
          Ferramenta para diagnosticar problemas de autenticação de dois fatores
        </p>
      </div>

      <div className="grid gap-6">
        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações de Debug 2FA</CardTitle>
            <CardDescription>
              Teste e corrija problemas relacionados ao 2FA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button onClick={getDetailedDebugInfo} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Obter Informações Detalhadas
              </Button>
              <Button variant="outline" onClick={testGenerate2FASecret} disabled={isLoading}>
                <Settings className="mr-2 h-4 w-4" />
                Testar Geração de Segredo
              </Button>
              <Button variant="outline" onClick={clear2FAData} disabled={isLoading}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Limpar Dados 2FA
              </Button>
              <Button variant="destructive" onClick={clearCorruptedAuth}>
                Limpar Dados Corrompidos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado Atual */}
        <Card>
          <CardHeader>
            <CardTitle>Estado Atual do 2FA</CardTitle>
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

        {/* Informações Detalhadas */}
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

                  {/* Contexto */}
                  <div>
                    <h4 className="font-semibold mb-2">Estado do Contexto:</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                      {JSON.stringify(debugInfo.contextState, null, 2)}
                    </pre>
                  </div>

                  {/* LocalStorage */}
                  <div>
                    <h4 className="font-semibold mb-2">LocalStorage (2FA):</h4>
                    <p className="text-sm font-mono">
                      {debugInfo.localStorage2FA || 'Não encontrado'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resultado dos Testes */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado dos Testes</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                <AlertDescription>
                  <strong>{testResult.success ? '✅ Sucesso' : '❌ Erro'}</strong>: {testResult.message}
                  {testResult.error && (
                    <div className="mt-2 text-sm">
                      <strong>Detalhes:</strong> {testResult.error}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
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
              <p>1. <strong>Obter Informações:</strong> Mostra dados detalhados da sessão e perfil</p>
              <p>2. <strong>Testar Geração:</strong> Testa a API de geração de segredo 2FA</p>
              <p>3. <strong>Limpar Dados 2FA:</strong> Remove configuração 2FA para recomeçar</p>
              <p>4. <strong>Limpar Dados Corrompidos:</strong> Remove tokens inválidos</p>
            </div>
            
            <Alert>
              <AlertDescription>
                <strong>💡 Dica:</strong> Use esta página para diagnosticar problemas na configuração 2FA.
                Verifique os logs no console do navegador para mais detalhes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}