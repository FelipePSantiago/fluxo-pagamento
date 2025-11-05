# Fluxo de Pagamento - Versão Migrada

Este projeto foi migrado do Supabase para tecnologias gratuitas e open-source.

## 🔄 Mudanças Realizadas

### ❌ Removido
- **Supabase**: Todas as dependências e integrações foram removidas
- **@supabase/supabase-js**
- **@supabase/auth-ui-react**
- **@supabase/auth-ui-shared**
- **@supabase/ssr**

### ✅ Adicionado
- **NextAuth.js**: Para autenticação completa e gratuita
- **Prisma**: ORM moderno com SQLite (banco de dados local/gratuito)
- **bcryptjs**: Para hash de senhas

## 🚀 Tecnologias Utilizadas

- **Next.js 15** com App Router
- **TypeScript 5**
- **Tailwind CSS 4** com shadcn/ui
- **NextAuth.js** para autenticação
- **Prisma** com SQLite
- **React Hook Form** com Zod
- **Lucide React** para ícones

## 📋 Pré-requisitos

- Node.js 18+
- npm 8+

## 🛠️ Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure o banco de dados:
```bash
npm run db:push
```

3. Crie um usuário admin (opcional):
```bash
curl -X POST http://localhost:3000/api/seed-admin
```

## 🗄️ Banco de Dados

O projeto usa **SQLite** como banco de dados, que é:
- ✅ Gratuito
- ✅ Servidor não necessário
- ✅ Fácil de fazer backup
- ✅ Rápido para desenvolvimento

### Schema

- **users**: Usuários e autenticação
- **properties**: Empreendimentos imobiliários
- **property_pricing**: Tabela de preços e unidades

## 🔐 Autenticação

### Login Padrão
- **Email**: admin@example.com
- **Senha**: admin123

### Funcionalidades
- ✅ Login com email e senha
- ✅ Registro de novos usuários
- ✅ Autenticação de dois fatores (2FA)
- ✅ Proteção de rotas
- ✅ Sessões seguras

## 📱 Funcionalidades Principais

- ✅ Simulador de financiamento imobiliário
- ✅ Cálculo de fluxo de pagamento
- ✅ Gestão de empreendimentos
- ✅ Relatórios em PDF
- ✅ Interface responsiva
- ✅ Dark mode

## 🚀 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia servidor de produção
npm run lint         # Verifica código
npm run type-check   # Verifica tipos TypeScript
npm run db:push      # Atualiza schema do banco
npm run db:generate  # Gera Prisma Client
npm run db:studio    # Abre Prisma Studio
```

## 📁 Estrutura do Projeto

```
src/
├── app/              # Páginas e API routes
├── components/       # Componentes React
├── contexts/         # Contextos de estado
├── hooks/           # Hooks personalizados
├── lib/             # Utilitários e configurações
├── types/           # Tipos TypeScript
└── styles/          # Estilos globais

prisma/
└── schema.prisma    # Schema do banco de dados
```

## 🌐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

## 📝 Notas da Migração

1. **Autenticação**: Migrada de Supabase Auth para NextAuth.js
2. **Banco de Dados**: Migrado de Supabase DB para SQLite + Prisma
3. **APIs**: Todas as rotas migradas para usar Prisma
4. **2FA**: Mantida a funcionalidade com OTLP
5. **Sessões**: Agora gerenciadas pelo NextAuth.js

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é open-source. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema durante a migração ou uso:
1. Verifique os logs de erro
2. Confirme as variáveis de ambiente
3. Reinicie o servidor de desenvolvimento
4. Verifique se o banco de dados foi inicializado corretamente