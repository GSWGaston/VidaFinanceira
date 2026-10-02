# Ordinnum

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

1. Crie um projeto Supabase e aplique as migrations de `supabase/migrations` em ordem com o CLI.
2. Copie `.env.example` para `.env.local` e informe a URL do projeto e a **publishable key**.
3. Configure o Auth para e-mail/senha e os URLs de redirecionamento usados em desenvolvimento e produção.
4. Reinicie o servidor. O login substitui o armazenamento local e cada usuário acessa apenas seus dados via RLS.

Não configure service role key no navegador. Nunca envie `.env.local` ao Git.

## Open Finance

A integração de leitura com Pluggy conecta instituições, importa contas, saldos e transações e permite sincronizar e desconectar. Requer Supabase e credenciais Pluggy configuradas no servidor. Em desenvolvimento o widget inclui Sandbox; em produção, conectores Sandbox ficam ocultos. Veja [configuração e teste Sandbox](docs/OPEN_FINANCE.md).

O resumo de crédito usa limites informados no cadastro manual ou campos de crédito disponíveis no modelo de contas. A integração Pluggy atual não importa limites; contas sem dados de limite não geram valores de crédito fictícios. A migration `account_credit_overview` deve ser aplicada ao Supabase para persistir novos limites. Cartões que compartilham uma linha de crédito são somados uma vez quando possuem o mesmo `credit_line_id` na mesma conexão; sem esse identificador, não é possível confirmar o compartilhamento automaticamente.

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

Contas, benefícios, receitas, despesas e Dashboard funcionam com armazenamento local, sem registros pré-carregados. O esquema Supabase, a autenticação e a integração Pluggy estão implementados, mas exigem projeto, migrations e credenciais reais para validação completa. Consulte [arquitetura](docs/ARCHITECTURE.md) e [roadmap](docs/ROADMAP.md).
