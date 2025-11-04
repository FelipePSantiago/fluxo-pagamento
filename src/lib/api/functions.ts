// Utilitário para substituir chamadas do Firebase Functions por fetch para Vercel Functions

export async function callFunction<T = any>(functionName: string, data?: any): Promise<T> {
  try {
    const response = await fetch(`/api/functions/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
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