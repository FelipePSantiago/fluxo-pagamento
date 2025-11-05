// Utilitário para substituir chamadas do Firebase Functions por fetch para Vercel Functions

export async function callFunction<T = any>(functionName: string, data?: any): Promise<T> {
  try {
    // Obter token do Supabase para autenticação
    let token = null;
    let refreshAttempted = false;
    
    const getToken = async (): Promise<string | null> => {
      try {
        if (typeof window !== 'undefined') {
          // Tentar obter da sessão do Supabase no cliente
          const { supabase } = await import('@/lib/supabase/client');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Erro ao obter sessão:', error);
            return null;
          }
          
          // Se não houver sessão e ainda não tentou refresh, tentar refresh
          if (!session && !refreshAttempted) {
            console.log('Sessão não encontrada, tentando refresh...');
            refreshAttempted = true;
            
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('Erro ao refresh sessão:', refreshError);
              return null;
            }
            
            if (refreshedSession) {
              console.log('Sessão refresh com sucesso');
              return refreshedSession.access_token;
            }
          }
          
          token = session?.access_token;
          console.log(`Token obtido para ${functionName}:`, token ? `${token.substring(0, 20)}...` : 'null');
          return token;
        }
      } catch (error) {
        console.warn('Não foi possível obter token de autenticação:', error);
        return null;
      }
      return null;
    };

    const authToken = await getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Incluir token de autenticação se disponível
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log(`Chamando função ${functionName} com headers:`, Object.keys(headers));

    const response = await fetch(`/api/functions/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data || {}),
    });

    // Se receber 401 e ainda não tentou refresh, tentar refresh e chamar novamente
    if (response.status === 401 && !refreshAttempted) {
      console.log('Recebido 401, tentando refresh do token...');
      refreshAttempted = true;
      
      const newToken = await getToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        
        const retryResponse = await fetch(`/api/functions/${functionName}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data || {}),
        });
        
        if (retryResponse.ok) {
          const result = await retryResponse.json();
          console.log(`Resposta da função ${functionName} (após refresh):`, result);
          return result;
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Erro na chamada ${functionName}:`, {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // Se for erro de autenticação, fornecer mensagem mais clara
      if (response.status === 401) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Resposta da função ${functionName}:`, result);
    return result;
  } catch (error: any) {
    console.error(`Error calling function ${functionName}:`, error);
    throw error;
  }
}

// Funções específicas para manter compatibilidade
export const functions = {
  extractPricing: (dataUrl: string) => callFunction('extract-pricing', { dataUrl }),
  getProperties: () => callFunction('get-properties'),
  saveProperty: (data: any) => callFunction('save-property', data),
  generateTwoFactorSecret: () => callFunction('generate-2fa-secret'),
  verifyAndEnableTwoFactor: (data: any) => callFunction('verify-2fa', data),
  simularFinanciamentoCaixa: (data: any) => callFunction('simular-financiamento-caixa', data),
};
