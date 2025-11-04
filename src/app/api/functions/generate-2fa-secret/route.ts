import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticator } from 'otplib';

// Criar cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const secret = authenticator.generateSecret();
    const secretUri = authenticator.keyuri(user.email!, "Entrada Facilitada", secret);

    // Salvar o segredo no banco de dados
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        two_factor_secret: secret,
        has_2fa: false, // Ainda não está verificado
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Failed to update 2FA settings');
    }

    return NextResponse.json({ secretUri });
  } catch (error: any) {
    console.error('Error generating 2FA secret:', error);
    return NextResponse.json(
      { error: `Não foi possível gerar o segredo 2FA: ${error.message}` },
      { status: 500 }
    );
  }
}