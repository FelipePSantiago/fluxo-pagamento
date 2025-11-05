import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { format, parseISO, addYears } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via sessão
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se é admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, enterpriseName, brand, constructionStartDate, deliveryDate } = body;

    if (!id || !enterpriseName) {
      return NextResponse.json({ error: 'ID e nome do empreendimento são obrigatórios.' }, { status: 400 });
    }

    const startDate = constructionStartDate ? format(parseISO(constructionStartDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    const deliveryDateFormatted = deliveryDate ? format(parseISO(deliveryDate), 'yyyy-MM-dd') : format(addYears(parseISO(startDate), 2), 'yyyy-MM-dd');

    await db.property.upsert({
      where: { id },
      update: {
        name: enterpriseName,
        address: '',
        city: '',
        state: '',
        value: 0,
        updatedAt: new Date(),
      },
      create: {
        id,
        name: enterpriseName,
        address: '',
        city: '',
        state: '',
        value: 0,
        createdBy: session.user.id,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving property:', error);
    return NextResponse.json(
      { error: `Não foi possível salvar o empreendimento: ${error.message}` },
      { status: 500 }
    );
  }
}