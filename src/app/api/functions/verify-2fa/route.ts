import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { authenticator } from 'otplib';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { secretUri, token } = body;

    if (!secretUri || !token) {
      return NextResponse.json({ error: 'URI do segredo e token são obrigatórios.' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const secret = new URL(secretUri).searchParams.get('secret');
    if (!secret) {
      return NextResponse.json({ error: 'Segredo inválido na URI.' }, { status: 400 });
    }

    const isValid = authenticator.verify({ token, secret });

    if (isValid) {
      await db.user.update({
        where: { id: user.id },
        data: {
          has2FA: true,
          is2FAVerified: true,
        },
      });
    }

    return NextResponse.json({ success: isValid });
  } catch (error: any) {
    console.error('Error verifying 2FA:', error);
    return NextResponse.json(
      { error: `Não foi possível verificar o 2FA: ${error.message}` },
      { status: 500 }
    );
  }
}