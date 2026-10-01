"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  WalletCards,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useApp } from "./app-provider";
import { AccountCarousel } from "./account-carousel";
import { AccountDialog } from "./forms";
import { Badge, LoadingCards, Money } from "./ui";
import { balanceFor, categoryExpenses, dashboardTotals } from "@/lib/finance";
import { creditOverview, type CreditOverview } from "@/lib/credit";
import { formatMoney } from "@/lib/money";

const colors = [
  "#227b5d",
  "#a8cf81",
  "#e8b565",
  "#8fbac8",
  "#aa9ccb",
  "#d18f7c",
];

export function Dashboard() {
  const { data, loading, error, reload } = useApp();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const totals = dashboardTotals(data);
  const credit = creditOverview(data);
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const categories = categoryExpenses(data.transactions, month);
  const recent = [...data.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  return (
    <div className="dashboard space-y-3 sm:space-y-7">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">
            {new Intl.DateTimeFormat("pt-BR", {
              month: "long",
              year: "numeric",
            })
              .format(now)
              .toUpperCase()}
          </p>
          <h1 className="page-title">Visão geral</h1>
        </div>
        <Link className="dashboard-transactions-link" href="/transactions">
          Transações <ArrowRight size={15} />
        </Link>
      </header>
      {error && (
        <div role="alert" className="card p-4 text-sm">
          {error}{" "}
          <button
            onClick={() => void reload()}
            className="ml-2 font-bold text-primary underline"
          >
            Tentar novamente
          </button>
        </div>
      )}
      {loading ? (
        <LoadingCards />
      ) : (
        <>
          <section
            className="financial-overview"
            aria-label="Resumo financeiro"
          >
            <div className="available-balance">
              <div className="available-balance-decoration" />
              <div className="relative">
                <div className="available-balance-label">
                  <span>Saldo disponível</span>
                  <Banknote size={19} />
                </div>
                <Money
                  cents={totals.balance}
                  className="available-balance-value"
                />
                <p>
                  Em {data.accounts.filter((account) => account.active).length}{" "}
                  {data.accounts.filter((account) => account.active).length ===
                  1
                    ? "conta ativa"
                    : "contas ativas"}
                </p>
                {credit && <CreditSummary credit={credit} />}
              </div>
            </div>
            <FinancialSummary totals={totals} />
          </section>
          <section className="accounts-section">
            <div className="accounts-section-heading">
              <div>
                <p className="eyebrow">SEU DINHEIRO</p>
                <h2>Contas & cartões</h2>
              </div>
              <div className="accounts-section-actions">
                <Link
                  href="/accounts"
                  aria-label="Ver e conectar contas"
                  className="btn btn-ghost accounts-more"
                >
                  •••
                </Link>
                <button
                  onClick={() => setAccountDialogOpen(true)}
                  className="btn btn-outline accounts-add"
                >
                  + Conta
                </button>
              </div>
            </div>
            <AccountCarousel
              data={data}
              onAddManual={() => setAccountDialogOpen(true)}
            />
          </section>
          <div className="dashboard-grid-top">
            <CategoryCard categories={categories} />
            <BenefitsCard cents={totals.benefits} data={data} />
          </div>
          <div className="dashboard-grid-bottom">
            <RecentTransactions recent={recent} />
            <UpcomingExpenses />
          </div>
        </>
      )}
      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
      />
    </div>
  );
}

function CreditSummary({ credit }: { credit: CreditOverview }) {
  const percentage = Math.round(credit.usagePercentage);
  return (
    <div className="credit-summary">
      <div className="credit-summary-top">
        <span>Crédito disponível</span>
        <span className="credit-summary-amount">
          <Money cents={credit.availableCents} />
          <span> de </span>
          <Money cents={credit.totalCents} />
        </span>
      </div>
      <div
        className="credit-progress"
        role="progressbar"
        aria-label="Limite de crédito utilizado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <span style={{ width: `${credit.usagePercentage}%` }} />
      </div>
      <div className="credit-summary-bottom">
        <span>
          <Money cents={credit.usedCents} /> utilizado
        </span>
        <span>{percentage}% utilizado</span>
      </div>
      {credit.incompleteLines > 0 && (
        <p className="credit-summary-note">
          Limites conhecidos de {credit.knownLines}{" "}
          {credit.knownLines === 1 ? "linha" : "linhas"}
        </p>
      )}
    </div>
  );
}

function FinancialSummary({
  totals,
}: {
  totals: ReturnType<typeof dashboardTotals>;
}) {
  const items = [
    {
      title: "Entradas",
      cents: totals.income,
      kind: "income" as const,
      icon: <ArrowDownLeft size={16} />,
    },
    {
      title: "Saídas",
      cents: totals.expense,
      kind: "expense" as const,
      icon: <ArrowUpRight size={16} />,
    },
    {
      title: "Resultado",
      cents: totals.result,
      kind: "result" as const,
      icon: <Banknote size={16} />,
    },
  ];
  return (
    <div className="financial-summary">
      {items.map((item) => (
        <div className={`financial-summary-item ${item.kind}`} key={item.title}>
          <span>
            {item.icon}
            {item.title}
          </span>
          <Money cents={item.cents} />
        </div>
      ))}
    </div>
  );
}

function CategoryCard({
  categories,
}: {
  categories: ReturnType<typeof categoryExpenses>;
}) {
  return (
    <section className="card dashboard-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">DISTRIBUIÇÃO</p>
          <h2>Gastos por categoria</h2>
        </div>
        <Badge>Este mês</Badge>
      </div>
      {categories.length ? (
        <div className="category-content">
          <div className="category-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="amountCents"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  strokeWidth={0}
                  paddingAngle={3}
                >
                  {categories.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="category-list">
            {categories.slice(0, 5).map((item, index) => (
              <div key={item.name}>
                <span>
                  <i style={{ background: colors[index % colors.length] }} />
                  {item.name}
                </span>
                <Money cents={item.amountCents} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <CompactEmpty
          title="Sem gastos neste mês"
          description="Adicione uma despesa para visualizar suas categorias."
        />
      )}
    </section>
  );
}

function BenefitsCard({
  cents,
  data,
}: {
  cents: number;
  data: ReturnType<typeof useApp>["data"];
}) {
  const benefits = data.benefits.filter((item) => item.active).slice(0, 3);
  return (
    <section className="card dashboard-panel benefits-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">RECURSOS RESTRITOS</p>
          <h2>Seus benefícios</h2>
        </div>
        <WalletCards className="text-primary" size={20} />
      </div>
      <Money cents={cents} className="benefits-value" />
      <p className="muted text-xs">Separados do saldo disponível</p>
      {benefits.length ? (
        <div className="benefit-list">
          {benefits.map((item) => (
            <div key={item.id}>
              <span>{item.name}</span>
              <Money cents={balanceFor(data, item.id, "benefit")} />
            </div>
          ))}
        </div>
      ) : (
        <p className="benefits-empty">Nenhum benefício cadastrado.</p>
      )}
      <Link href="/benefits" className="panel-link">
        Ver benefícios <ArrowRight size={15} />
      </Link>
    </section>
  );
}

function RecentTransactions({
  recent,
}: {
  recent: ReturnType<typeof useApp>["data"]["transactions"];
}) {
  return (
    <section className="card dashboard-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">MOVIMENTAÇÃO</p>
          <h2>Últimas transações</h2>
        </div>
        <Link href="/transactions" className="panel-link">
          Ver todas
        </Link>
      </div>
      {recent.length ? (
        <div className="recent-list">
          {recent.map((item) => (
            <div key={item.id}>
              <span
                className={
                  item.type === "income" ? "income-icon" : "expense-icon"
                }
              >
                {item.type === "income" ? (
                  <ArrowDownLeft size={17} />
                ) : (
                  <ArrowUpRight size={17} />
                )}
              </span>
              <div>
                <strong>{item.description}</strong>
                <small>
                  {item.category} ·{" "}
                  {new Date(`${item.date}T12:00:00`).toLocaleDateString(
                    "pt-BR",
                  )}
                </small>
              </div>
              <Money
                cents={
                  item.type === "income" ? item.amountCents : -item.amountCents
                }
                className={item.type === "income" ? "income-value" : ""}
              />
            </div>
          ))}
        </div>
      ) : (
        <CompactEmpty
          title="Ainda sem transações"
          description="Registre uma entrada ou saída para acompanhar sua movimentação."
        />
      )}
    </section>
  );
}

function UpcomingExpenses() {
  return (
    <section className="card dashboard-panel upcoming-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PLANEJAMENTO</p>
          <h2>Próximas despesas</h2>
        </div>
        <CalendarClock className="text-primary" size={20} />
      </div>
      <p className="muted">
        Quando você cadastrar despesas recorrentes, os próximos vencimentos
        aparecerão aqui.
      </p>
      <Link href="/subscriptions" className="panel-link">
        Conhecer o recurso <ArrowRight size={15} />
      </Link>
    </section>
  );
}

function CompactEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="compact-empty">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
