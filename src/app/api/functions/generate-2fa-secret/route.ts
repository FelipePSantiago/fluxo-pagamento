import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { authenticator } from 'otplib';

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando geração de segredo 2FA...');
    
    // Verificar autenticação via sessão
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('Sessão não encontrada ou inválida');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Usuário autenticado:', session.user.email);

    // Buscar perfil do usuário
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      console.error('Usuário não encontrado');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Perfil encontrado:', { id: user.id, has2FA: user.has2FA });

    // Verificar se 2FA já está configurado
    if (user.has2FA && user.twoFactorSecret) {
      console.log('2FA já está configurado para este usuário');
      return NextResponse.json({ 
        error: '2FA já está configurado para este usuário' 
      }, { status: 400 });
    }

    const secret = authenticator.generateSecret();
    const secretUri = authenticator.keyuri(user.email!, "Entrada Facilitada", secret);

    console.log('Segredo 2FA gerado com sucesso');

    // Salvar o segredo no banco de dados
    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret,
        has2FA: false, // Ainda não está verificado
        is2FAVerified: false,
      }
    });

    console.log('Segredo 2FA salvo no banco com sucesso');

    return NextResponse.json({ 
      secretUri,
      message: 'Segredo 2FA gerado com sucesso'
    });

  } catch (error: any) {
    console.error('Error generating 2FA secret:', error);
    return NextResponse.json(
      { error: `Não foi possível gerar o segredo 2FA: ${error.message}` },
      { status: 500 }
    );
  }
}