import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseExcel } from '@/lib/parsers/excel-parser';

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
    const { fileContent } = body;

    if (!fileContent) {
      return NextResponse.json({ error: 'Conteúdo do arquivo é obrigatório.' }, { status: 400 });
    }

    // Parsear o arquivo Excel
    let parsedData;
    try {
      parsedData = parseExcel(fileContent);
    } catch (parseError) {
      console.error('Error parsing Excel:', parseError);
      return NextResponse.json({ 
        error: 'Erro ao processar o arquivo Excel. Verifique se o formato está correto.' 
      }, { status: 400 });
    }

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return NextResponse.json({ error: 'O arquivo Excel está vazio ou não contém dados válidos.' }, { status: 400 });
    }

    // Processar cada linha do Excel
    const propertiesToInsert = [];
    const errors = [];
    let addedCount = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      
      try {
        // Mapear campos do Excel para o schema do banco
        const property = {
          id: row.id || `property-${Date.now()}-${i}`, // Gerar ID único se não existir
          name: row.name || row.nome || row['Nome do Empreendimento'] || `Empreendimento ${i + 1}`,
          address: row.address || row.endereco || row['Endereço'] || 'Endereço não informado',
          city: row.city || row.cidade || row['Cidade'] || 'Cidade não informada',
          state: row.state || row.estado || row['Estado'] || 'Estado não informado',
          value: row.value ? parseFloat(String(row.value).replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
          status: row.status || 'available',
          created_by: user.id,
          enterprise_name: row.enterprise_name || row.empresa || row['Empresa'] || row.name || row.nome,
          description: row.description || row.descricao || row['Descrição'] || null,
          image: row.image || row.imagem || row['Imagem'] || null,
          type: row.type || row.tipo || row['Tipo'] || null,
          total_units: row.total_units ? parseInt(String(row.total_units)) : null,
          available_units: row.available_units ? parseInt(String(row.available_units)) : null,
        };

        // Validar campos obrigatórios
        if (!property.name || property.name === 'Endereço não informado') {
          errors.push(`Linha ${i + 1}: Nome do empreendimento é obrigatório`);
          continue;
        }

        propertiesToInsert.push(property);
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        errors.push(`Linha ${i + 1}: Erro ao processar dados - ${rowError.message}`);
      }
    }

    // Inserir propriedades no banco
    if (propertiesToInsert.length > 0) {
      const { data: insertedProperties, error: insertError } = await supabase
        .from('properties')
        .upsert(propertiesToInsert, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Error inserting properties:', insertError);
        return NextResponse.json({ 
          error: 'Erro ao salvar propriedades no banco de dados.' 
        }, { status: 500 });
      }

      addedCount = propertiesToInsert.length;
    }

    return NextResponse.json({
      success: true,
      addedCount,
      totalProcessed: parsedData.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processados ${parsedData.length} registros. ${addedCount} novos empreendimentos adicionados.`
    });

  } catch (error: any) {
    console.error('Error in batch-create-properties:', error);
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    );
  }
}