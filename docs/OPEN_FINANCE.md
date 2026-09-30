# Open Finance com Pluggy

## Arquitetura e escopo

O fluxo é somente leitura: Pluggy Connect → `OpenFinanceProvider`/`PluggyProvider` → serviço de sincronização → tabelas comuns `accounts` e `transactions` → telas e Dashboard existentes. Credenciais, API Key, token de webhook e chave secreta do Supabase ficam somente no servidor. O navegador recebe apenas o Connect Token temporário.

O PluggyProvider usa a API HTTP tipada e reutiliza a API Key em memória por até 110 minutos. Em implantações com várias instâncias, cada instância possui seu próprio cache. Uma resposta 401 renova a chave. O serviço confirma `clientUserId` do Item com o UUID do usuário Supabase antes de persistir dados. Endpoints autenticados revalidam o bearer token com `getUser()` e conferem ownership da conexão.

## Configuração

1. Crie um projeto em [Supabase](https://supabase.com/dashboard) e aplique, na ordem, as migrations em `supabase/migrations` com o Supabase CLI vinculado ao projeto (`npx supabase link --project-ref ...` e `npx supabase db push`). Configure Auth por e-mail/senha e URLs de redirecionamento.
2. Crie uma conta no [painel Pluggy](https://dashboard.pluggy.ai/) e copie **Client ID** e **Client Secret** das credenciais de API.
3. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`. Obtenha a chave secreta no painel Supabase, em Settings → API Keys. Ela deve permanecer exclusivamente no servidor. Configure as mesmas variáveis no ambiente de hospedagem.
4. Gere um token aleatório longo para `PLUGGY_WEBHOOK_TOKEN` e configure o mesmo valor como header `X-VIDA-WEBHOOK-TOKEN` em cada webhook no painel/API Pluggy. Não registre os valores no Git.
5. Reinicie `npm run dev`. Sem configuração, o app continua no modo local e informa que Open Finance não está disponível.

## Sandbox e primeiro teste

Em desenvolvimento, o Connect Widget oficial inclui conectores Sandbox; em produção, `includeSandbox` é falso. Contas e conexões Sandbox exibem **Ambiente de testes**. Faça login no app, abra **Contas → Conectar instituição**, escolha **Sandbox / Pluggy Bank** e use as credenciais de teste fornecidas pela Pluggy (`user-ok`, `password-ok`, MFA `123456`). O widget cuida de MFA, OAuth e autorização. Quando o widget concluir, `/api/open-finance/complete` associa o Item ao usuário, importa contas BANK em BRL, saldos e transações e atualiza a tela. Confirme saldo, lançamentos e Dashboard; recarregue a página e clique **Sincronizar** para confirmar persistência sem duplicação. Em produção, use conectores reais e credenciais de produção após validar consentimento, callbacks e disponibilidade.

O servidor solicita Connect Token em `POST /api/open-finance/connect-token` com `options.clientUserId` e `options.avoidDuplicates`. A opção de renovar usa `itemId` no token e `updateItem` no widget. A sincronização manual usa `POST /api/open-finance/connections/[id]`; `DELETE` desconecta o Item, desativa as contas e preserva histórico. Enquanto uma conexão está sincronizando, a tela verifica o status a cada 15 segundos por até três minutos. A sincronização inicial busca até 365 dias de transações disponíveis e as posteriores revisitam 45 dias para capturar correções. Contas usam páginas; transações usam o cursor de `/v2/transactions`. Há limite de 100 páginas por recurso para evitar loops; um excesso resulta em erro visível, sem truncar silenciosamente.

## Webhooks

Cadastre **uma URL HTTPS pública**, `https://SEU-DOMINIO/api/webhooks/pluggy`, para os eventos:

`item/created`, `item/updated`, `item/deleted`, `item/error`, `item/waiting_user_input`, `item/waiting_user_action`, `transactions/created`, `transactions/updated`, `transactions/deleted`.

Em cada registro configure o header personalizado `X-VIDA-WEBHOOK-TOKEN: <PLUGGY_WEBHOOK_TOKEN>` pela API Pluggy (`POST /webhooks` com `url`, `event` e `headers`; o painel não exibe headers personalizados). O endpoint compara o segredo em tempo constante, grava o `eventId` com unicidade e responde rapidamente; o processamento ocorre após a resposta. Eventos repetidos recebem 200 e não são processados de novo. Eventos de transações criadas usam `transactionsCreatedAtFrom`; atualizadas usam os IDs recebidos, inclusive fora da janela de 45 dias. Para desenvolvimento local, use um deployment de preview ou túnel HTTPS que encaminhe a rota; `localhost` não é URL válida para cadastro. O token é um segredo **nosso** compartilhado via header, não uma assinatura nativa atribuída à Pluggy. Eventos com falha ficam com status `error` na tabela `webhook_events`; sincronize manualmente após corrigir a causa.

## Dados e segurança

A migration `20260930145211_pluggy_open_finance.sql` cria `financial_connections`, `categorization_rules`, `webhook_events` e estende as tabelas existentes. RLS restringe as tabelas do usuário; operações privilegiadas usam a chave secreta somente após validar sessão, ownership e `clientUserId`. O navegador não pode criar registros com `source=open_finance` nem alterar saldos do provider. `provider + external_id` impede contas repetidas, e `provider + account_id + external_id` impede transações repetidas. O merge em SQL preserva uma categoria com `category_overridden=true`.

Valores são normalizados em centavos inteiros. Saldos importados são fotografias do provider e não recebem a soma das transações importadas. Transações pendentes, de valor zero ou moeda diferente de BRL são ignoradas. Contas removidas são desativadas; transações removidas são marcadas `provider_deleted` e saem das consultas, mantendo registro histórico no banco. Uma possível duplicata de lançamento manual é sinalizada por fingerprint e não apagada automaticamente. Regras de categorização priorizam padrões do usuário, depois a categoria do provider, depois **Sem categoria**.

## Problemas comuns

- **Open Finance ainda não configurado:** confira as cinco variáveis de Supabase/Pluggy, aplique ambas as migrations e reinicie o servidor.
- **401 na rota:** faça login novamente; o bearer token Supabase pode ter expirado.
- **Item aguardando ação:** conclua a autorização no widget/banco e use **Renovar acesso** quando necessário.
- **Instituição indisponível/erro:** aguarde, confira o status no painel Pluggy e tente sincronizar novamente. Registros anteriores permanecem no banco.
- **Webhook não chega:** confirme URL HTTPS, evento, header e token idêntico nos dois lados. Um túnel que mudou de URL exige novo cadastro.
- **Saldo diferente do histórico importado:** o saldo vem como fotografia atual da Pluggy, enquanto a importação inicial cobre apenas o intervalo configurado.

Sem credenciais reais neste ambiente, ainda é necessário aplicar a migration no projeto Supabase e executar o fluxo Sandbox acima para validar a integração externa.
