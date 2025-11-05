import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via sessão
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar propriedades
    const properties = await db.property.findMany({
      include: {
        propertyPricing: {
          select: {
            id: true,
            propertyId: true,
            unitType: true,
            unitNumber: true,
            value: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            privateArea: true,
            block: true,
            sunPosition: true,
            typology: true,
            parkingSpaces: true,
            appraisalValue: true,
            financingValue: true,
            saleValue: true,
            payments: true,
            installments: true,
            notaryPaymentMethod: true,
            notaryInstallments: true,
            brokerName: true,
            brokerCreci: true,
            selectedUnit: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ properties });
  } catch (error: any) {
    console.error('Error getting properties:', error);
    return NextResponse.json(
      { error: `Não foi possível obter os empreendimentos: ${error.message}` },
      { status: 500 }
    );
  }
}