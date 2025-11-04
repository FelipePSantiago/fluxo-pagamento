import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { format, parseISO, addYears } from 'date-fns';

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

    // Verificar se é admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, enterpriseName, brand, constructionStartDate, deliveryDate } = body;

    if (!id || !enterpriseName) {
      return NextResponse.json({ error: 'ID e nome do empreendimento são obrigatórios.' }, { status: 400 });
    }

    const startDate = constructionStartDate ? format(parseISO(constructionStartDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    const deliveryDateFormatted = deliveryDate ? format(parseISO(deliveryDate), 'yyyy-MM-dd') : format(addYears(parseISO(startDate), 2), 'yyyy-MM-dd');

    const { error: upsertError } = await supabase
      .from('properties')
      .upsert({
        id,
        name: enterpriseName,
        address: '',
        city: '',
        state: '',
        value: 0,
        updated_at: new Date().toISOString(),
        created_by: user.id,
      }, {
        onConflict: 'id'
      });

    if (upsertError) {
      throw new Error('Failed to save property');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving property:', error);
    return NextResponse.json(
      { error: `Não foi possível salvar o empreendimento: ${error.message}` },
      { status: 500 }
    );
  }
}