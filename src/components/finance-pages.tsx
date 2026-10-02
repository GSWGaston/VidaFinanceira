"use client";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Search } from "lucide-react";
import { useApp } from "./app-provider";
import { AccountDialog, BenefitDialog, TransactionDialog } from "./forms";
import { EmptyState, LoadingCards, Money, Badge } from "./ui";
import { balanceFor, dashboardTotals } from "@/lib/finance";
import { accountKinds, benefitKinds } from "@/lib/model";
import { categories } from "@/lib/model";
import { supabase } from "@/lib/repository";
import { toast } from "sonner";
import { OpenFinanceControls } from "./open-finance-connect";
import { FinancialCardFace } from "./account-carousel";
import { bankTheme, institutionTheme } from "@/lib/bank-themes";
function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="muted mt-2 text-sm">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
export function AccountsPage() {
  const { data, loading, error, reload } = useApp();
  const [open, setOpen] = useState(false);
  const syncing =
    data.connections?.some((connection) => connection.status === "syncing") ??
    false;
  useEffect(() => {
    if (!syncing) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      void reload();
      if (attempts >= 12) window.clearInterval(timer);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [syncing, reload]);
  return (
    <>
      <PageHeader
        eyebrow="SEU DINHEIRO"
        title="Contas"
        subtitle="Acompanhe seu saldo disponível em cada conta."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <OpenFinanceControls />
            <button className="btn btn-outline" onClick={() => setOpen(true)}>
              <Plus size={17} /> Nova conta
            </button>
          </div>
        }
      />
      {error && <ErrorBanner error={error} reload={reload} />}
      {loading ? (
        <LoadingCards />
      ) : (
        <>
          <div className="account-total-banner mb-6">
            <p className="text-sm font-semibold text-white/75">
              Saldo financeiro total
            </p>
            <Money
              cents={dashboardTotals(data).balance}
              className="mt-2 block text-3xl font-extrabold"
            />
            <p className="mt-2 text-xs text-white/70">
              Benefícios não entram neste total.
            </p>
          </div>
          {!!data.connections?.length && (
            <section className="mb-6" aria-label="Instituições conectadas">
              <h2 className="mb-3 text-lg font-extrabold">
                Instituições conectadas
              </h2>
              <div className="grid gap-3">
                {data.connections.map((connection) => (
                  <div
                    className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    key={connection.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{connection.institutionName}</strong>
                        {connection.isSandbox && (
                          <Badge color="gray">Ambiente de testes</Badge>
                        )}
                      </div>
                      <p className="muted text-xs">
                        {connection.status === "connected"
                          ? "Conectada"
                          : connection.status === "syncing"
                            ? "Sincronizando"
                            : connection.status === "waiting_user_input"
                              ? "Aguardando confirmação no Pluggy"
                              : connection.status === "waiting_user_action"
                                ? "Aguardando ação no banco"
                                : connection.status === "error"
                                  ? "Requer atenção"
                                  : "Desconectada"}
                        {connection.lastSyncAt
                          ? ` · Atualizada em ${new Date(connection.lastSyncAt).toLocaleString("pt-BR")}`
                          : ""}
                      </p>
                    </div>
                    {connection.status !== "disconnected" && (
                      <OpenFinanceControls
                        connectionId={connection.id}
                        itemId={connection.providerItemId}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {data.accounts.length ? (
            <div className="flex flex-wrap gap-4">
              {data.accounts.map((item) => (
                <div className="financial-card-list-item" key={item.id}>
                  <div
                    className="account-bank-card"
                    data-pattern={bankTheme(item).pattern}
                    style={
                      {
                        "--card-bg": bankTheme(item).background,
                        "--card-fg": bankTheme(item).foreground,
                        "--card-muted": bankTheme(item).muted,
                      } as CSSProperties
                    }
                  >
                    <FinancialCardFace
                      institution={item.institution}
                      name={item.name}
                      amount={balanceFor(data, item.id, "account")}
                      secondary={accountKinds[item.kind]}
                      theme={bankTheme(item)}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="muted">{item.institution}</span>
                    <Badge color={item.active ? "green" : "gray"}>
                      {item.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  {item.source === "open_finance" && (
                    <p className="muted mt-2 text-xs">
                      Open Finance
                      {data.connections?.find((c) => c.id === item.connectionId)
                        ?.isSandbox
                        ? " · Ambiente de testes"
                        : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma conta cadastrada"
              description="Cadastre sua primeira conta para começar a organizar suas finanças."
            />
          )}
        </>
      )}
      <AccountDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
export function BenefitsPage() {
  const { data, loading, error, reload } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="SEUS BENEFÍCIOS"
        title="Benefícios"
        subtitle="Vale Alimentação, Refeição e outros recursos em seu próprio espaço."
        action={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={17} /> Novo benefício
          </button>
        }
      />
      {error && <ErrorBanner error={error} reload={reload} />}
      {loading ? (
        <LoadingCards />
      ) : (
        <>
          <div className="benefits-total-banner mb-6">
            <p className="text-sm font-semibold text-white/75">
              Total em benefícios
            </p>
            <Money
              cents={dashboardTotals(data).benefits}
              className="mt-2 block text-3xl font-extrabold"
            />
            <p className="mt-2 text-xs text-white/70">
              Separado do dinheiro de livre utilização.
            </p>
          </div>
          {data.benefits.length ? (
            <div className="flex flex-wrap gap-4">
              {data.benefits.map((item) => (
                <div className="financial-card-list-item" key={item.id}>
                  <div
                    className="account-bank-card"
                    data-pattern={
                      institutionTheme(item.company, item.name).pattern
                    }
                    style={
                      {
                        "--card-bg": institutionTheme(item.company, item.name)
                          .background,
                        "--card-fg": institutionTheme(item.company, item.name)
                          .foreground,
                        "--card-muted": institutionTheme(
                          item.company,
                          item.name,
                        ).muted,
                      } as CSSProperties
                    }
                  >
                    <FinancialCardFace
                      institution={item.company}
                      name={item.name}
                      amount={balanceFor(data, item.id, "benefit")}
                      secondary={benefitKinds[item.kind]}
                      theme={institutionTheme(item.company, item.name)}
                    />
                  </div>
                  <p className="muted mt-2 text-xs">
                    Crédito mensal: <Money cents={item.monthlyCreditCents} />
                    {item.creditDay ? ` · dia ${item.creditDay}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum benefício cadastrado"
              description="Adicione VA, VR ou outro benefício para acompanhar seu saldo separado das contas."
            />
          )}
        </>
      )}
      <BenefitDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
export function TransactionsPage({
  initialType = "all",
}: {
  initialType?: string;
}) {
  const { data, loading, error, reload } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState(initialType);
  const correctCategory = async (id: string, category: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("transactions")
      .update({ category, category_overridden: true })
      .eq("id", id)
      .eq("source", "open_finance");
    if (error) toast.error("Não foi possível alterar a categoria.");
    else {
      await reload();
      toast.success("Categoria atualizada.");
    }
  };
  const visible = useMemo(
    () =>
      [...data.transactions]
        .filter(
          (item) =>
            item.description
              .toLocaleLowerCase("pt-BR")
              .includes(search.toLocaleLowerCase("pt-BR")) &&
            (type === "all" || item.type === type),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.transactions, search, type],
  );
  return (
    <>
      <PageHeader
        eyebrow="HISTÓRICO"
        title="Transações"
        subtitle="Tudo o que entrou e saiu, organizado em um só lugar."
        action={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={17} /> Nova transação
          </button>
        }
      />
      {error && <ErrorBanner error={error} reload={reload} />}
      <div className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row">
        <label className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3.5 text-muted" />
          <span className="sr-only">Pesquisar transações</span>
          <input
            className="input !pl-10"
            placeholder="Pesquisar transações"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filtrar por tipo</span>
          <select
            className="input min-w-40"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </label>
      </div>
      {loading ? (
        <LoadingCards />
      ) : visible.length ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-border">
            {visible.map((item) => {
              const source =
                data.accounts.find((a) => a.id === item.accountId)?.name ??
                data.benefits.find((b) => b.id === item.benefitId)?.name ??
                "Origem removida";
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-4 sm:px-6"
                >
                  <div
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.type === "income" ? "bg-[var(--success-soft)] text-success" : "bg-[var(--danger-soft)] text-danger"}`}
                  >
                    {item.type === "income" ? (
                      <ArrowDownLeft size={19} />
                    ) : (
                      <ArrowUpRight size={19} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {item.description}
                    </p>
                    <p className="muted truncate text-xs">
                      {item.category} · {source} ·{" "}
                      {new Date(`${item.date}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                    {item.source === "open_finance" && (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="muted text-xs">
                          {item.possibleDuplicate
                            ? "Possível duplicata · "
                            : ""}
                          Open Finance
                        </span>
                        {supabase && (
                          <select
                            className="input max-w-36 text-xs"
                            aria-label={`Categoria de ${item.description}`}
                            value={item.category}
                            onChange={(event) =>
                              void correctCategory(item.id, event.target.value)
                            }
                          >
                            <option value={item.category}>
                              {item.category}
                            </option>
                            {categories
                              .filter((category) => category !== item.category)
                              .map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                  <Money
                    cents={
                      item.type === "income"
                        ? item.amountCents
                        : -item.amountCents
                    }
                    className={`whitespace-nowrap text-sm font-extrabold sm:text-base ${item.type === "income" ? "text-success" : "text-foreground"}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          title={
            search || type !== "all"
              ? "Nenhum resultado"
              : "Ainda sem transações"
          }
          description={
            search || type !== "all"
              ? "Tente outros filtros ou termos de busca."
              : "Adicione sua primeira receita ou despesa para começar."
          }
        />
      )}
      <TransactionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
function ErrorBanner({
  error,
  reload,
}: {
  error: string;
  reload: () => Promise<void>;
}) {
  return (
    <div role="alert" className="card mb-5 p-4 text-sm">
      {error}{" "}
      <button
        className="ml-2 font-bold text-primary underline"
        onClick={() => void reload()}
      >
        Tentar novamente
      </button>
    </div>
  );
}
