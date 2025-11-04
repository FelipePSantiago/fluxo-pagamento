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

    const user = await db.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const secret = authenticator.generateSecret();
    const secretUri = authenticator.keyuri(user.email!, "Entrada Facilitada", secret);

    // Salvar o segredo no banco de dados
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret,
        has2FA: false, // Ainda não está verificado
      },
    });

    return NextResponse.json({ secretUri });
  } catch (error: any) {
    console.error('Error generating 2FA secret:', error);
    return NextResponse.json(
      { error: `Não foi possível gerar o segredo 2FA: ${error.message}` },
      { status: 500 }
    );
  }
}