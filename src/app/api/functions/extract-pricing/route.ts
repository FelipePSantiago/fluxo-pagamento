import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticator } from 'otplib';
import pdf from 'pdf-parse';

// Função para criar cliente Supabase apenas quando necessário
const getSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

interface ExtractPricingOutput {
  grossIncome: number;
  simulationInstallmentValue: number;
  appraisalValue: number;
  financingValue: number;
}

const processPdf = async (pdfBuffer: Buffer): Promise<ExtractPricingOutput> => {
  const pdfData = await pdf(pdfBuffer);
  const pdfText = pdfData.text;

  const extractValue = (regex: RegExp) => {
      const match = pdfText.match(regex);
      if (match && match[1]) {
          const cleanedValue = match[1].replace(/\./g, '').replace(',', '.');
          return parseFloat(cleanedValue) || 0;
      }
      return 0;
  };

  return {
    grossIncome: extractValue(/Renda Familiar:[\s\S]*?R\$\s*([\d.,]+)/i),
    simulationInstallmentValue: extractValue(/Primeira Prestação[\s\S]*?R\$\s*([\d.,]+)/i),
    appraisalValue: extractValue(/Valor do imóvel:[\s\S]*?R\$\s*([\d.,]+)/i),
    financingValue: extractValue(/Valor de Financiamento[\s\S]*?R\$\s*([\d.,]+)/i),
  };
};

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dataUrl } = body;

    if (!dataUrl) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Formato de Data URL inválido.' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(base64Data, 'base64');
    const result = await processPdf(pdfBuffer);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: `Não foi possível extrair os dados do PDF: ${error.message}` },
      { status: 500 }
    );
  }
}