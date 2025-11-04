import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const properties = await db.property.findMany({
      include: {
        pricing: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
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