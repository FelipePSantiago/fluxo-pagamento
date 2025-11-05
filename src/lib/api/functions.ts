// Utilitário para substituir chamadas do Firebase Functions por fetch para Vercel Functions

export async function callFunction<T = any>(functionName: string, data?: any): Promise<T> {
  try {
    // Obter token do NextAuth para autenticação
    let token = null;
    
    const getToken = async (): Promise<string | null> => {
      try {
        if (typeof window !== 'undefined') {
          // Tentar obter da sessão do NextAuth no cliente
          const response = await fetch('/api/auth/session');
          const session = await response.json();
          
          if (session?.user) {
            console.log(`Sessão NextAuth obtida para ${functionName}:`, session.user.email);
            return 'authenticated'; // NextAuth usa cookies, não precisamos do token diretamente
          }
        }
      } catch (error) {
        console.warn('Não foi possível obter sessão de autenticação:', error);
        return null;
      }
      return null;
    };

    const authToken = await getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    console.log(`Chamando função ${functionName} com headers:`, Object.keys(headers));

    const response = await fetch(`/api/functions/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data || {}),
    });

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
