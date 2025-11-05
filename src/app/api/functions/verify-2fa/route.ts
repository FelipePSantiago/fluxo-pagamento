import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticator } from 'otplib';

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

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authToken = authHeader.substring(7);
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(authToken);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { secretUri, token } = body;

    if (!secretUri || !token) {
      return NextResponse.json({ error: 'URI do segredo e token são obrigatórios.' }, { status: 400 });
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

    const secret = new URL(secretUri).searchParams.get('secret');
    if (!secret) {
      return NextResponse.json({ error: 'Segredo inválido na URI.' }, { status: 400 });
    }

    const isValid = authenticator.verify({ token, secret });

    if (isValid) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          has_2fa: true,
          is_2fa_verified: true,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar perfil 2FA:', updateError);
        throw new Error('Failed to update 2FA verification status');
      }

      console.log('Perfil 2FA atualizado com sucesso');
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