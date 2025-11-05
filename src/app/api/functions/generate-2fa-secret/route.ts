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
    console.log('Iniciando geração de segredo 2FA...');
    
    // Verificar autenticação via token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Token de autenticação ausente ou inválido');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authToken = authHeader.substring(7);
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(authToken);

    if (error || !user) {
      console.error('Erro ao obter usuário:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Usuário autenticado:', user.email);

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Perfil não encontrado:', profileError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Perfil encontrado:', { id: profile.id, has_2fa: profile.has_2fa });

    // Verificar se 2FA já está configurado
    if (profile.has_2fa && profile.two_factor_secret) {
      console.log('2FA já está configurado para este usuário');
      return NextResponse.json({ 
        error: '2FA já está configurado para este usuário' 
      }, { status: 400 });
    }

    const secret = authenticator.generateSecret();
    const secretUri = authenticator.keyuri(user.email!, "Entrada Facilitada", secret);

    console.log('Segredo 2FA gerado com sucesso');

    // Salvar o segredo no banco de dados
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        two_factor_secret: secret,
        has_2fa: false, // Ainda não está verificado
        is_2fa_verified: false,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar perfil com segredo 2FA:', updateError);
      throw new Error('Failed to update 2FA settings');
    }

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