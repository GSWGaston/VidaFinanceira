# VidaFinanceira

Aplicação web responsiva para acompanhar a vida financeira pessoal. A primeira versão funcional reúne contas, benefícios e transações em um Dashboard. Benefícios como VA e VR aparecem separados do dinheiro livre.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, React Hook Form, Zod, Recharts, Lucide, Supabase Auth/PostgreSQL e PWA com service worker próprio.

## Executar localmente

Requisitos: Node.js 24 ou superior e npm.

```bash
npm ci
npm run dev
```

Acesse `http://localhost:3000`. Sem variáveis de ambiente, o aplicativo inicia vazio. Os dados cadastrados ficam somente no `localStorage` deste navegador e não são sincronizados com Supabase. Ao atualizar uma instalação antiga, os registros de exemplo são removidos; registros criados pelo usuário são mantidos quando não dependem de uma conta ou benefício de exemplo.

## Configurar Supabase

1. Crie um projeto Supabase e aplique `supabase/migrations/20260930141712_initial_finance_schema.sql` no banco com o CLI ou SQL Editor.
2. Copie `.env.example` para `.env.local` e informe a URL do projeto e a **publishable key**.
3. Configure o Auth para e-mail/senha e os URLs de redirecionamento usados em desenvolvimento e produção.
4. Reinicie o servidor. O login substitui o armazenamento local e cada usuário acessa apenas seus dados via RLS.

Não configure service role key no navegador. Nunca envie `.env.local` ao Git.

## Comandos

| Comando             | Ação              |
| ------------------- | ----------------- |
| `npm run dev`       | Servidor local    |
| `npm run lint`      | ESLint            |
| `npm run typecheck` | TypeScript        |
| `npm run test`      | Testes unitários  |
| `npm run format`    | Prettier          |
| `npm run build`     | Build de produção |

## PWA

O aplicativo oferece manifest, ícones e service worker. Para instalar fora do ambiente local, publique via HTTPS. O service worker armazena somente ícones e arquivos estáticos; dados financeiros continuam sob autenticação e acesso à rede.

## Estado atual

Contas, benefícios, receitas, despesas e Dashboard estão funcionais com armazenamento local, sem registros pré-carregados. O esquema Supabase e a autenticação inicial estão implementados, mas exigem projeto e credenciais reais para validação completa. As demais áreas mostram o planejamento sem aparentar que já operam. Consulte [arquitetura](docs/ARCHITECTURE.md) e [roadmap](docs/ROADMAP.md).
