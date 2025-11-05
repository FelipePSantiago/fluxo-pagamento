import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { propertyId, pricingData } = body;

    if (!propertyId || !Array.isArray(pricingData)) {
      return NextResponse.json({ error: 'propertyId e pricingData são obrigatórios.' }, { status: 400 });
    }

    // Verificar se a propriedade existe e pertence ao usuário
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Propriedade não encontrada.' }, { status: 404 });
    }

    // Processar e inserir dados de pricing
    const pricingToInsert = pricingData.map((item: any, index: number) => ({
      id: `pricing-${propertyId}-${Date.now()}-${index}`,
      property_id: propertyId,
      unit_type: item.unit_type || item.tipo_unidade || null,
      unit_number: item.unit_number || item.numero_unidade || null,
      value: item.value ? parseFloat(String(item.value).replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
      status: item.status || 'available',
      private_area: item.private_area ? parseFloat(String(item.private_area).replace(/[^\d.,]/g, '').replace(',', '.')) : null,
      block: item.block || item.bloco || null,
      sun_position: item.sun_position || item.posicao_sol || null,
      typology: item.typology || item.tipologia || null,
      parking_spaces: item.parking_spaces ? parseInt(String(item.parking_spaces)) : null,
      appraisal_value: item.appraisal_value ? parseFloat(String(item.appraisal_value).replace(/[^\d.,]/g, '').replace(',', '.')) : null,
      financing_value: item.financing_value ? parseFloat(String(item.financing_value).replace(/[^\d.,]/g, '').replace(',', '.')) : null,
      sale_value: item.sale_value ? parseFloat(String(item.sale_value).replace(/[^\d.,]/g, '').replace(',', '.')) : null,
      payments: item.payments || null,
      installments: item.installments || null,
      notary_payment_method: item.notary_payment_method || null,
      notary_installments: item.notary_installments ? parseInt(String(item.notary_installments)) : null,
      broker_name: item.broker_name || null,
      broker_creci: item.broker_creci || null,
      selected_unit: item.selected_unit || null,
    }));

    // Inserir dados de pricing
    const { data: insertedPricing, error: insertError } = await supabase
      .from('property_pricing')
      .upsert(pricingToInsert, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.error('Error inserting pricing:', insertError);
      return NextResponse.json({ 
        error: 'Erro ao salvar tabela de preços.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Tabela de preços atualizada com ${pricingToInsert.length} unidades.`,
      count: pricingToInsert.length
    });

  } catch (error: any) {
    console.error('Error in update-property-pricing:', error);
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    );
  }
}