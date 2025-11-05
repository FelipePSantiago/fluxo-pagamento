import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pdf from 'pdf-parse';

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
    // Verificar autenticação via sessão NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
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