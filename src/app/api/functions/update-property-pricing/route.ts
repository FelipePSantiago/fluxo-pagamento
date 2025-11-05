import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via sessão NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se é admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { propertyId, pricingData } = body;

    if (!propertyId || !Array.isArray(pricingData)) {
      return NextResponse.json({ error: 'propertyId e pricingData são obrigatórios.' }, { status: 400 });
    }

    // Verificar se a propriedade existe
    const property = await db.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return NextResponse.json({ error: 'Propriedade não encontrada.' }, { status: 404 });
    }

    // Processar e inserir dados de pricing
    const pricingToInsert = pricingData.map((item: any, index: number) => ({
      id: `pricing-${propertyId}-${Date.now()}-${index}`,
      propertyId: propertyId,
      unitType: item.unit_type || item.tipo_unidade || null,
      unitNumber: item.unit_number || item.numero_unidade || null,
      value: item.value ? parseFloat(String(item.value).replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
      status: item.status || 'available',
      privateArea: item.private_area ? parseFloat(String(item.private_area).replace(/[^\d.,]/g, '').replace(',', '.')) : null,
      block: item.block || item.bloco || null,
      sunPosition: item.sun_position || item.posicao_sol || null,
      typology: item.typology || item.tipologia || null,
      parkingSpaces: item.parking_spaces ? parseInt(String(item.parking_spaces)) : null,
      appraisalValue: item.appraisal_value ? parseFloat(String(item.appraisal_value).replace(/[^\d.,]/g, '').replace(',', '.')) : null,
      financingValue: item.financing_value ? parseFloat(String(item.financing_value).replace(/[^\d.,]/g, '').replace(',', '.')) : null,
      saleValue: item.sale_value ? parseFloat(String(item.sale_value).replace(/[^\d.,]/g, '').replace(',', '.')) : null,
      payments: item.payments || null,
      installments: item.installments || null,
      notaryPaymentMethod: item.notary_payment_method || null,
      notaryInstallments: item.notary_installments ? parseInt(String(item.notary_installments)) : null,
      brokerName: item.broker_name || null,
      brokerCreci: item.broker_creci || null,
      selectedUnit: item.selected_unit || null,
    }));

    // Inserir dados de pricing
    try {
      await db.propertyPricing.createMany({
        data: pricingToInsert,
        skipDuplicates: true
      });
    } catch (insertError) {
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