import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via sessão NextAuth
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
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId é obrigatório.' }, { status: 400 });
    }

    // Verificar se a propriedade existe
    const property = await db.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return NextResponse.json({ error: 'Propriedade não encontrada.' }, { status: 404 });
    }

    // Deletar todos os preços da propriedade
    try {
      await db.propertyPricing.deleteMany({
        where: { propertyId: propertyId }
      });
    } catch (deleteError) {
      console.error('Error deleting property pricing:', deleteError);
      return NextResponse.json({ 
        error: 'Erro ao excluir tabela de preços.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tabela de preços excluída com sucesso.'
    });

  } catch (error: any) {
    console.error('Error in delete-property-pricing:', error);
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    );
  }
}