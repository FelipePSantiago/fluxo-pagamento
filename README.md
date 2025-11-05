


# Fluxo de Pagamento - Entrada Facilitada

Projeto Next.js 15 com autenticação 2FA completa via Supabase para simulação de financiamento imobiliário.

## 🚀 Funcionalidades

- ✅ **Autenticação completa** com Supabase
- ✅ **2FA (Two-Factor Authentication)** funcional
- ✅ **Geração de QR Code** para configurar 2FA
- ✅ **Verificação por código** de 6 dígitos
- ✅ **Simulador financeiro** Caixa Econômica
- ✅ **Gestão de propriedades** para administradores
- ✅ **Interface responsiva** com shadcn/ui

## 🔐 Autenticação 2FA

O sistema implementa autenticação de dois fatores completa:

### Fluxo para Novos Usuários
1. **Login** → Redirecionado para `/setup-2fa`
2. **Escanear QR Code** com app autenticador
3. **Digitar código** de 6 dígitos
4. **2FA ativado** → Acesso liberado

### Fluxo para Usuários com 2FA
1. **Login** → Redirecionado para `/verify-2fa`
2. **Digitar código** do app autenticador
3. **Verificação** → Acesso liberado

## 🛠️ Instalação

### 1. Clonar o projeto
```bash
git clone https://github.com/FelipePSantiago/fluxo-pagamento.git
cd fluxo-pagamento
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais Supabase:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 4. Configurar Schema Supabase
Execute o SQL do arquivo `supabase-schema.sql` no painel SQL do seu projeto Supabase.

### 5. Executar o projeto
```bash
npm run dev
```

Acesse `http://localhost:3000`

## 📱 Páginas Importantes

- `/` - Página inicial
- `/login` - Login de usuários
- `/signup` - Cadastro de novos usuários
- `/setup-2fa` - Configuração inicial do 2FA
- `/verify-2fa` - Verificação 2FA
- `/debug-2fa` - Ferramenta de diagnóstico 2FA
- `/simulator` - Simulador financeiro (requer 2FA)
- `/admin/properties` - Gestão de propriedades (admin + 2FA)

## 🔧 Debug e Solução de Problemas

### Página Debug 2FA
Acesse `/debug-2fa` para diagnosticar problemas:

1. **Obter Informações Detalhadas** - Mostra estado completo
2. **Testar Geração de Segredo** - Testa API 2FA
3. **Limpar Dados 2FA** - Reset configuração
4. **Limpar Dados Corrompidos** - Corrige auth

### Logs Importantes
Abra o console do navegador para ver:
```javascript
"Iniciando geração de segredo 2FA..."
"Token obtido para generate-2fa-secret: eyJhb..."
"Segredo 2FA gerado com sucesso: otpauth://..."
"QR Code gerado com sucesso"
```

## 🐛 Problemas Comuns

### Erro 401 Unauthorized
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurado
- Use `/debug-2fa` para testar a API

### QR Code não aparece
- Verifique se a dependência `qrcode` está instalada
- Use `/debug-2fa` para testar geração

### Código inválido
- Use um app autenticador válido (Google Authenticator, Authy)
- Verifique se o tempo está sincronizado
- Teste com código gerado recentemente

## 📋 Dependências Principais

- `@supabase/supabase-js` - Cliente Supabase
- `otplib` - Geração/verificação 2FA
- `qrcode` - Geração de QR Code
- `next` - Framework Next.js 15
- `@radix-ui/*` - Componentes UI
- `tailwindcss` - Estilização

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── api/functions/          # APIs 2FA
│   │   ├── generate-2fa-secret/
│   │   └── verify-2fa/
│   ├── setup-2fa/             # Configuração 2FA
│   ├── verify-2fa/            # Verificação 2FA
│   ├── debug-2fa/             # Diagnóstico 2FA
│   └── simulator/             # Aplicação principal
├── contexts/
│   └── SupabaseAuthContext.tsx # Contexto de autenticação
├── lib/
│   ├── api/functions.ts       # Cliente de APIs
│   └── supabase/              # Cliente Supabase
└── components/
    └── ui/                    # Componentes shadcn/ui
```

## 🎯 Status do 2FA

✅ **Todos os problemas 2FA resolvidos:**
- Autenticação com token Bearer funcionando
- Geração de QR Code operacional
- API verify-2FA com sintaxe correta
- Tratamento robusto de erros
- Logging completo para diagnóstico
- Redirecionamentos inteligentes

O sistema 2FA está **100% funcional** no Supabase! 🚀

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.
