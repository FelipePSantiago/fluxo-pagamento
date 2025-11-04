import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import chromium from '@sparticuz/chromium';
import puppeteer, { type Page } from 'puppeteer-core';

const NAVIGATION_TIMEOUT = 90000; // 90 segundos

async function takeScreenshot(page: Page, filename: string) {
  try {
    const screenshot = await page.screenshot({ 
      encoding: 'base64'
    });
    console.log(`[SCREENSHOT] ${filename}: Capturada com sucesso`);
    return screenshot;
  } catch (error: any) {
    console.error(`[DEBUG] Erro ao capturar screenshot: ${error.message}`);
    return null;
  }
}

function formatarDataCaixa(data: string): string {
  if (!data) return '';
  
  if (data.includes('/')) return data;
  
  const partes = data.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  
  return data;
}

function formatarValorCaixa(valor: string | number): string {
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
  return Math.round(numero).toString();
}

const SELECTORS_CORRIGIDOS = {
    pagina1: { 
        origemRecurso: '#origemRecurso', 
        submitButton: 'a[onclick*="document.getElementById(\'form\').submit();"]' 
    },
    pagina2: { 
        categoriaImovel: '#categoriaImovel', 
        cidade: '#cidade', 
        valorImovel: '#valorImovel', 
        renda: '#renda', 
        submitButton: 'a[onclick*="document.getElementById(\'form\').submit();"]' 
    },
    pagina3: { 
        dataNascimento: '#dataNascimento', 
        submitButton: 'a[onclick*="document.getElementById(\'form\').submit();"]' 
    },
    pagina4: { 
        opcaoEnquadramento: 'a[href="listaenquadramentos.modalidade/3074"]'
    },
    pagina5: { 
        sistemaAmortizacao: '#rcrRge', 
        submitButton: 'a[onclick*="document.getElementById(\'form\').submit();"]' 
    },
    pagina6: { 
        prazoObra: '#prazoObra',
        calcularButton: 'a.submit',
        avancarButton: 'a.submit'
    },
    pagina7: { 
        resultsTable: '#idTabelaResumo' 
    },
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { renda, dataNascimento, valorImovel, sistemaAmortizacao } = body;

    if (!renda || !dataNascimento || !valorImovel || !sistemaAmortizacao) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios para a simulação.' }, { status: 400 });
    }

    let browser = null;
    let page: Page | null = null;

    try {
      console.log(`[DEBUG] Iniciando Puppeteer...`);
      browser = await puppeteer.launch({
        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
      
      page = await browser.newPage();
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
      await page.setUserAgent(userAgent);
      page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

      // ETAPA 1 - Selecionar origem do recurso
      console.log(`[DEBUG] ETAPA 1: Navegando para página inicial...`);
      await page.goto('https://www.portaldeempreendimentos.caixa.gov.br/simulador/', { 
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT
      });

      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina1.origemRecurso, { timeout: 15000 });
      await page.select(SELECTORS_CORRIGIDOS.pagina1.origemRecurso, '15'); // SBPE
      console.log(`[DEBUG] Origem SBPE selecionada`);

      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina1.submitButton, { timeout: 10000 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT }),
        page.click(SELECTORS_CORRIGIDOS.pagina1.submitButton)
      ]);
      console.log(`[DEBUG] ✅ Etapa 1 concluída`);

      // ETAPA 2 - Dados do imóvel
      console.log(`[DEBUG] ETAPA 2: Preenchendo dados do imóvel...`);
      
      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina2.categoriaImovel, { timeout: 15000 });
      
      // Preencher categoria do imóvel
      await page.select(SELECTORS_CORRIGIDOS.pagina2.categoriaImovel, '16'); // CONSTRUCAO/AQ TER CONST
      
      // Preencher cidade
      await page.type(SELECTORS_CORRIGIDOS.pagina2.cidade, 'Brasilia - DF', { delay: 100 });
      
      // Preencher valor do imóvel
      const valorImovelFormatado = formatarValorCaixa(valorImovel);
      await page.type(SELECTORS_CORRIGIDOS.pagina2.valorImovel, valorImovelFormatado, { delay: 100 });
      console.log(`[DEBUG] Valor imóvel formatado: ${valorImovelFormatado}`);
      
      // Preencher renda familiar
      const rendaFormatada = formatarValorCaixa(renda);
      await page.type(SELECTORS_CORRIGIDOS.pagina2.renda, rendaFormatada, { delay: 100 });
      console.log(`[DEBUG] Renda formatada: ${rendaFormatada}`);

      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina2.submitButton, { timeout: 10000 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT }),
        page.click(SELECTORS_CORRIGIDOS.pagina2.submitButton)
      ]);
      console.log(`[DEBUG] ✅ Etapa 2 concluída`);

      // ETAPA 3 - Data de nascimento
      console.log(`[DEBUG] ETAPA 3: Preenchendo data de nascimento...`);
      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina3.dataNascimento, { timeout: 15000 });
      
      const dataNascimentoFormatada = formatarDataCaixa(dataNascimento);
      console.log(`[DEBUG] Data nascimento original: ${dataNascimento} -> Formatada: ${dataNascimentoFormatada}`);
      
      await page.type(SELECTORS_CORRIGIDOS.pagina3.dataNascimento, dataNascimentoFormatada, { delay: 100 });

      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina3.submitButton, { timeout: 10000 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT }),
        page.click(SELECTORS_CORRIGIDOS.pagina3.submitButton)
      ]);
      console.log(`[DEBUG] ✅ Etapa 3 concluída`);

      // ETAPA 4 - Enquadramento
      console.log(`[DEBUG] ETAPA 4: Selecionando enquadramento...`);
      await new Promise(resolve => setTimeout(resolve, 3000));

      const currentUrl = page.url();
      console.log(`[DEBUG] URL atual: ${currentUrl}`);

      if (!currentUrl.includes('listaenquadramentos')) {
        console.log(`[DEBUG] ❌ Não estamos na página de enquadramento. URL: ${currentUrl}`);
        throw new Error(`Página incorreta: esperada listaenquadramentos, obtida: ${currentUrl}`);
      }

      try {
        console.log(`[DEBUG] Estratégia 1: Buscando seletor específico...`);
        
        await page.waitForSelector('a[href="listaenquadramentos.modalidade/3074"]', { 
          timeout: 10000 
        });
        
        console.log(`[DEBUG] ✅ Seletor encontrado. Tentando clique...`);
        
        await Promise.all([
          page.waitForNavigation({ 
            waitUntil: 'networkidle2', 
            timeout: NAVIGATION_TIMEOUT 
          }),
          page.click('a[href="listaenquadramentos.modalidade/3074"]')
        ]);
        
        console.log(`[DEBUG] ✅ Navegação via clique normal bem-sucedida`);
        
      } catch (error: any) {
        console.log(`[DEBUG] Estratégia 1 falhou: ${error.message}`);
        
        try {
          console.log(`[DEBUG] Estratégia 2: Buscando por conteúdo...`);
          
          const elemento3074 = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const targetLink = links.find(link => 
              link.textContent?.includes('3074') || 
              link.getAttribute('href')?.includes('3074')
            );
            return targetLink ? targetLink.outerHTML : null;
          });
          
          if (elemento3074) {
            console.log(`[DEBUG] ✅ Elemento encontrado por conteúdo. Clique via JavaScript...`);
            
            await page.evaluate(() => {
              const links = Array.from(document.querySelectorAll('a'));
              const targetLink = links.find(link => 
                link.textContent?.includes('3074') || 
                link.getAttribute('href')?.includes('3074')
              ) as HTMLAnchorElement;
              if (targetLink) {
                targetLink.click();
              }
            });
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log(`[DEBUG] ✅ Navegação via clique no elemento encontrado`);
          } else {
            throw new Error('Elemento não encontrado por conteúdo');
          }
          
        } catch (error2: any) {
          console.log(`[DEBUG] Estratégia 2 falhou: ${error2.message}`);
          
          try {
            console.log(`[DEBUG] Estratégia 3: Clique direto via JavaScript...`);
            
            const cliqueExecutado = await page.evaluate(() => {
              const link = document.querySelector('a[href="listaenquadramentos.modalidade/3074"]') as HTMLAnchorElement;
              if (link) {
                console.log(`[JS] Clicando no link: ${link.href}`);
                link.click();
                return true;
              } else {
                const allLinks = Array.from(document.querySelectorAll('a'));
                const targetLink = allLinks.find(a => 
                  a.getAttribute('href')?.includes('3074') || 
                  a.textContent?.includes('3074')
                ) as HTMLAnchorElement;
                if (targetLink) {
                  console.log(`[JS] Clique fallback no link: ${targetLink.href}`);
                  targetLink.click();
                  return true;
                } else {
                  return false;
                }
              }
            });
            
            if (cliqueExecutado) {
              await new Promise(resolve => setTimeout(resolve, 5000));
              console.log(`[DEBUG] ✅ Navegação via JavaScript bem-sucedida`);
            } else {
              throw new Error('Nenhum link com 3074 encontrado');
            }
            
          } catch (error3: any) {
            console.log(`[DEBUG] Estratégia 3 falhou: ${error3.message}`);
            throw new Error(`Falha ao selecionar enquadramento após 3 tentativas`);
          }
        }
      }

      const finalUrl = page.url();
      console.log(`[DEBUG] URL final após etapa 4: ${finalUrl}`);

      if (!finalUrl.includes('selecionaapolice')) {
        console.log(`[DEBUG] ❌ Não chegamos na página correta (selecionaapolice). URL: ${finalUrl}`);
        
        if (finalUrl.includes('listaenquadramentos')) {
          console.log(`[DEBUG] Ainda em listaenquadramentos. Tentando navegação direta...`);
          try {
            await page.goto('https://www.portaldeempreendimentos.caixa.gov.br/simulador/selecionaapolice', {
              waitUntil: 'networkidle2',
              timeout: NAVIGATION_TIMEOUT
            });
            console.log(`[DEBUG] ✅ Navegação direta bem-sucedida`);
          } catch (navError: any) {
            console.log(`[DEBUG] ❌ Falha na navegação direta: ${navError.message}`);
            throw new Error(`Não foi possível acessar a página de seleção de apólice`);
          }
        } else {
          console.log(`[DEBUG] ⚠️  Em página diferente do esperado, mas continuando...`);
        }
      } else {
        console.log(`[DEBUG] ✅ Chegamos na página correta: selecionaapolice`);
      }

      // ETAPA 5 - Sistema de amortização
      console.log(`[DEBUG] ETAPA 5: Selecionando sistema de amortização...`);
      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina5.sistemaAmortizacao, { timeout: 15000 });
      
      if (sistemaAmortizacao === 'SAC') {
        await page.select(SELECTORS_CORRIGIDOS.pagina5.sistemaAmortizacao, '2');
      } else {
        await page.select(SELECTORS_CORRIGIDOS.pagina5.sistemaAmortizacao, '1'); // PRICE
      }
      
      console.log(`[DEBUG] Sistema ${sistemaAmortizacao} selecionado`);

      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina5.submitButton, { timeout: 10000 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT }),
        page.click(SELECTORS_CORRIGIDOS.pagina5.submitButton)
      ]);
      console.log(`[DEBUG] ✅ Etapa 5 concluída`);

      // ETAPA 6 - Prazo da obra
      console.log(`[DEBUG] ETAPA 6: Preenchendo prazo da obra...`);
      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina6.prazoObra, { timeout: 15000 });
      
      await page.type(SELECTORS_CORRIGIDOS.pagina6.prazoObra, '36', { delay: 100 });
      console.log(`[DEBUG] Prazo de 36 meses informado`);

      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina6.calcularButton, { timeout: 10000 });
      await page.click(SELECTORS_CORRIGIDOS.pagina6.calcularButton);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log(`[DEBUG] ✅ Etapa 6 concluída`);

      // ETAPA 7 - Extrair resultados
      console.log(`[DEBUG] ETAPA 7: Extraindo resultados...`);
      await page.waitForSelector(SELECTORS_CORRIGIDOS.pagina7.resultsTable, { timeout: 15000 });
      
      const resultados = await page.evaluate(() => {
        const tabela = document.querySelector('#idTabelaResumo');
        if (!tabela) return null;
        
        const linhas = tabela.querySelectorAll('tr');
        const dados: any = {};
        
        linhas.forEach(linha => {
          const celulas = linha.querySelectorAll('td');
          if (celulas.length >= 2) {
            const chave = celulas[0].textContent?.trim();
            const valor = celulas[1].textContent?.trim();
            if (chave && valor) {
              dados[chave] = valor;
            }
          }
        });
        
        return dados;
      });

      if (!resultados) {
        throw new Error('Não foi possível extrair os resultados da simulação');
      }

      console.log(`[DEBUG] ✅ Resultados obtidos:`, resultados);

      return NextResponse.json({ 
        success: true, 
        resultados,
        mensagem: 'Simulação concluída com sucesso'
      });

    } catch (error: any) {
      console.error('Erro durante a simulação:', error);
      return NextResponse.json(
        { error: `Erro durante a simulação: ${error.message}` },
        { status: 500 }
      );
    } finally {
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
      }
    }

  } catch (error: any) {
    console.error('Error in simulation:', error);
    return NextResponse.json(
      { error: `Erro na simulação: ${error.message}` },
      { status: 500 }
    );
  }
}