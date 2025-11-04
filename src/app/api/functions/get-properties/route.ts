import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Buscar propriedades
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        *,
        property_pricing (
          id,
          property_id,
          unit_type,
          unit_number,
          value,
          status,
          created_at,
          updated_at,
          private_area,
          block,
          sun_position,
          typology,
          parking_spaces,
          appraisal_value,
          financing_value,
          sale_value,
          payments,
          installments,
          notary_payment_method,
          notary_installments,
          broker_name,
          broker_creci,
          selected_unit
        )
      `)
      .order('created_at', { ascending: false });

    if (propertiesError) {
      throw new Error('Failed to fetch properties');
    }

    return NextResponse.json({ properties });
  } catch (error: any) {
    console.error('Error getting properties:', error);
    return NextResponse.json(
      { error: `Não foi possível obter os empreendimentos: ${error.message}` },
      { status: 500 }
    );
  }
}