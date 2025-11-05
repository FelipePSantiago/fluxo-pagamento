# Entrada Facilitada - Versão Vercel

Este projeto foi migrado do Firebase para a plataforma Vercel, utilizando serviços compatíveis.

## Mudanças Realizadas

### 1. Database
- **De**: Firestore (Firebase)
- **Para**: PostgreSQL com Prisma ORM
- **Schema**: Mantida a estrutura de dados equivalente

### 2. Autenticação
- **De**: Firebase Authentication
- **Para**: NextAuth.js
- **Provedores**: Google e Apple (mantidos)

### 3. Functions
- **De**: Firebase Functions
- **Para**: Vercel Functions (API Routes)
- **Lógica**: Preservada integralmente

### 4. Hosting
- **De**: Firebase Hosting
- **Para**: Vercel Edge Network
- **Configuração**: Otimizada para Vercel

## Setup para Deploy

### 1. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no painel do Vercel:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# NextAuth.js
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=seu-secret-aqui

# OAuth Providers
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
APPLE_CLIENT_ID=seu-apple-client-id
APPLE_CLIENT_SECRET=seu-apple-client-secret

# Outros serviços (se necessário)
SUMUP_APIKEY=sua-chave-sumup
GEMINI_API_KEY=sua-chave-gemini
```

### 2. Database Setup

1. Crie um banco de dados PostgreSQL no Vercel ou serviço compatível
2. Copie a string de conexão para `DATABASE_URL`
3. Execute `npx prisma db push` para criar as tabelas

### 3. OAuth Setup

#### Google OAuth
1. Vá para [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative Google+ API
4. Crie credenciais OAuth 2.0
5. Adicione `https://seu-dominio.vercel.app/api/auth/callback/google` como redirect URI

#### Apple OAuth
1. Vá para [Apple Developer](https://developer.apple.com/)
2. Crie um App ID com Sign in with Apple
3. Crie um Service ID
4. Adicione `https://seu-dominio.vercel.app/api/auth/callback/apple` como return URL

## Deploy

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Faça deploy automático ou manual

## Estrutura de Arquivos

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth.js
│   │   └── functions/             # Firebase Functions migradas
│   └── ...
├── contexts/
│   └── AuthContext.tsx            # Atualizado para NextAuth
├── lib/
│   ├── auth/
│   │   └── config.ts              # Config NextAuth
│   └── db.ts                      # Prisma Client
└── ...
prisma/
└── schema.prisma                  # Schema do banco
```

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Database
npm run db:push      # Aplicar schema
npm run db:studio    # Visualizar dados
npm run db:generate  # Gerar client

# Type checking
npm run type-check
```

## Funcionalidades Mantidas

- ✅ Autenticação com Google e Apple
- ✅ Sistema 2FA (Two-Factor Authentication)
- ✅ Simulação de financiamento Caixa
- ✅ Extração de dados de PDF
- ✅ Gestão de propriedades
- ✅ Painel administrativo
- ✅ PWA Support
- ✅ Responsividade

## Suporte

Para dúvidas sobre a migração ou configuração, consulte a documentação do Vercel ou entre em contato.