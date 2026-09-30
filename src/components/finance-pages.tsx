"use client";
import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Plus,
  Search,
  WalletCards,
} from "lucide-react";
import { useApp } from "./app-provider";
import { AccountDialog, BenefitDialog, TransactionDialog } from "./forms";
import { EmptyState, LoadingCards, Money, Badge } from "./ui";
import { balanceFor, dashboardTotals } from "@/lib/finance";
import { accountKinds, benefitKinds } from "@/lib/model";
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
  return (
    <>
      <PageHeader
        eyebrow="SEU DINHEIRO"
        title="Contas"
        subtitle="Acompanhe seu saldo disponível em cada conta."
        action={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={17} /> Nova conta
          </button>
        }
      />
      {error && <ErrorBanner error={error} reload={reload} />}
      {loading ? (
        <LoadingCards />
      ) : (
        <>
          <div className="mb-6 rounded-[22px] bg-[#176e55] p-6 text-white">
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
          {data.accounts.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.accounts.map((item) => (
                <div className="card p-6" key={item.id}>
                  <div className="flex items-start justify-between">
                    <span
                      className="grid size-11 place-items-center rounded-xl text-white"
                      style={{ background: item.color }}
                    >
                      <Landmark size={21} />
                    </span>
                    <Badge color={item.active ? "green" : "gray"}>
                      {item.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <h2 className="mt-5 text-lg font-extrabold">{item.name}</h2>
                  <p className="muted text-xs">
                    {item.institution} · {accountKinds[item.kind]}
                  </p>
                  <div className="mt-6 border-t border-border pt-4">
                    <p className="muted text-xs">Saldo atual</p>
                    <Money
                      cents={balanceFor(data, item.id, "account")}
                      className="mt-1 block text-2xl font-extrabold"
                    />
                  </div>
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
          <div className="mb-6 rounded-[22px] bg-[#295d74] p-6 text-white">
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.benefits.map((item) => (
                <div className="card p-6" key={item.id}>
                  <div className="flex items-start justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-[#d9ebf2] text-[#295d74]">
                      <WalletCards size={22} />
                    </span>
                    <Badge>{benefitKinds[item.kind]}</Badge>
                  </div>
                  <h2 className="mt-5 text-lg font-extrabold">{item.name}</h2>
                  <p className="muted text-xs">{item.company}</p>
                  <div className="mt-6 border-t border-border pt-4">
                    <p className="muted text-xs">Saldo atual</p>
                    <Money
                      cents={balanceFor(data, item.id, "benefit")}
                      className="mt-1 block text-2xl font-extrabold"
                    />
                    <p className="muted mt-3 text-xs">
                      Crédito mensal: <Money cents={item.monthlyCreditCents} />
                      {item.creditDay ? ` · dia ${item.creditDay}` : ""}
                    </p>
                  </div>
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
export function TransactionsPage() {
  const { data, loading, error, reload } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
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
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.type === "income" ? "bg-soft text-primary" : "bg-[#faeeeb] text-danger"}`}
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
                  </div>
                  <Money
                    cents={
                      item.type === "income"
                        ? item.amountCents
                        : -item.amountCents
                    }
                    className={`whitespace-nowrap text-sm font-extrabold sm:text-base ${item.type === "income" ? "text-primary" : "text-foreground"}`}
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
