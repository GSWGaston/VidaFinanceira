# Arquitetura

## Visão geral

Next.js App Router entrega as rotas. Componentes em `src/components` cuidam da interface; `src/lib` concentra modelos, validação, cálculos e persistência. A primeira fatia funcional cobre contas, benefícios e transações. Outras rotas mostram seu status no roadmap sem simular operações.

## Dados e precisão

Valores BRL são inteiros em centavos no código e `bigint` no PostgreSQL. O saldo de uma conta ou benefício é o saldo inicial somado aos lançamentos vinculados. Benefícios não entram no saldo financeiro livre. Totais do mês usam a data civil local. As transações dessa etapa suportam receita e despesa; transferências, parcelas e recorrências ficam para fases posteriores.

`FinanceRepository` define leitura e escrita. `LocalRepository` inicia vazio e persiste registros criados pelo usuário em `localStorage`; `SupabaseRepository` usa tabelas reais quando as duas variáveis públicas são configuradas. Uma limpeza única remove os antigos registros de exemplo do armazenamento local e preserva os registros criados pelo usuário que ainda tenham uma fonte válida. Dados locais não são transferidos automaticamente para uma conta Supabase.

## Supabase e segurança

`supabase/migrations/20260930141712_initial_finance_schema.sql` cria perfis, contas, benefícios e transações. Todas as tabelas públicas têm RLS com políticas por `auth.uid()`. Uma chave estrangeira composta impede que uma transação aponte para conta ou benefício de outra pessoa. Há `CHECK` para valores, tipos e fonte única. A aplicação usa apenas a chave pública; nenhuma service role é necessária no frontend. Como a aplicação usa cliente Supabase no navegador, a sessão fica sob responsabilidade do Supabase Auth e o banco aplica a autorização. Login, cadastro e recuperação de senha aparecem quando o backend está configurado.

## PWA

## Open Finance

`src/lib/open-finance` separa o contrato `OpenFinanceProvider`, o cliente HTTP Pluggy, a normalização e o serviço de sincronização. Rotas Next.js autenticadas geram Connect Token, associam Items, sincronizam e desconectam; o webhook valida um header secreto próprio e registra `eventId` para idempotência. Credenciais Pluggy e chave secreta Supabase só são usadas no servidor. A migration `20260930145211_pluggy_open_finance.sql` cria conexões e eventos e amplia contas/transações existentes com origem e IDs externos. O saldo Open Finance é uma fotografia do provider; para contas manuais, o saldo inicial continua somado aos lançamentos. Consulte [OPEN_FINANCE.md](OPEN_FINANCE.md).

## PWA

O manifest tem ícones PNG, nome e modo standalone. O service worker guarda apenas ícones e assets estáticos do Next.js. Documentos, rotas de dados e respostas financeiras não entram no cache da PWA. HTTPS é necessário para instalação fora de `localhost`.

## Limites desta fase

Sem credenciais do projeto Supabase e Pluggy, não foi possível aplicar as migrations nem executar testes de RLS ou Sandbox contra serviços reais. O esquema está versionado e deve ser aplicado antes de configurar as variáveis. Os módulos posteriores continuam no roadmap.
