"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  CreditCard,
  ListFilter,
  Plus,
  CalendarRange,
  WalletCards,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useApp } from "./app-provider";
import { TransactionDialog } from "./forms";
import { Badge, LoadingCards, Money } from "./ui";
import { balanceFor, categoryExpenses, dashboardTotals } from "@/lib/finance";
import { creditOverview, type CreditOverview } from "@/lib/credit";
import { formatMoney } from "@/lib/money";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export function Dashboard() {
  const { data, loading, error, reload } = useApp();
  const [transactionOpen, setTransactionOpen] = useState(false);
  const totals = dashboardTotals(data);
  const credit = creditOverview(data);
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const categories = categoryExpenses(data.transactions, month);
  const recent = [...data.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  return (
    <div className="dashboard home-dashboard">
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
        <div className="space-y-4">
          <div className="home-hero animate-pulse" aria-hidden="true" />
          <LoadingCards />
        </div>
      ) : (
        <>
          <section className="home-hero" aria-label="Resumo financeiro">
            <div className="home-hero-content">
              <div className="home-hero-balance">
                <p className="home-hero-eyebrow">Sua visão geral</p>
                <h1>Saldo disponível</h1>
                <Money cents={totals.balance} className="home-hero-value" />
                <p className="home-hero-count">
                  Em {data.accounts.filter((account) => account.active).length}{" "}
                  {data.accounts.filter((account) => account.active).length ===
                  1
                    ? "conta ativa"
                    : "contas ativas"}
                </p>
                {credit && <CreditSummary credit={credit} />}
              </div>
              <QuickActions onNewTransaction={() => setTransactionOpen(true)} />
            </div>
            <span id="home-hero-sentinel" aria-hidden="true" />
          </section>
          <div className="home-content-grid">
            <section className="home-monthly" aria-label="Resumo do mês">
              <div className="home-section-heading">
                <p className="eyebrow">ESTE MÊS</p>
                <span className="muted text-xs">
                  {new Intl.DateTimeFormat("pt-BR", {
                    month: "long",
                    year: "numeric",
                  }).format(now)}
                </span>
              </div>
              <FinancialSummary totals={totals} />
            </section>
            <CategoryCard
              categories={categories}
              onNewExpense={() => setTransactionOpen(true)}
            />
            <BenefitsCard cents={totals.benefits} data={data} />
            <RecentTransactions recent={recent} />
            <UpcomingExpenses />
          </div>
        </>
      )}
      <TransactionDialog
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
      />
    </div>
  );
}

function QuickActions({ onNewTransaction }: { onNewTransaction: () => void }) {
  const actions = [
    { label: "Cartões", icon: CreditCard, href: "/cards" },
    { label: "Gastos", icon: ListFilter, href: "/transactions?type=expense" },
  ];
  return (
    <div className="home-quick-actions" aria-label="Ações rápidas">
      {actions.slice(0, 2).map(({ label, icon: Icon, href }) => (
        <Link key={label} href={href} className="home-quick-action">
          <span>
            <Icon size={19} />
          </span>
          {label}
        </Link>
      ))}
      <button
        className="home-quick-action home-quick-action-main"
        onClick={onNewTransaction}
      >
        <span>
          <Plus size={21} />
        </span>
        Lançar
      </button>
      <Link href="/planning" className="home-quick-action">
        <span>
          <CalendarRange size={19} />
        </span>
        Planejar
      </Link>
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
        <div
          className={`financial-summary-item ${item.kind} ${item.kind === "result" ? (item.cents < 0 ? "negative" : "positive") : ""}`}
          key={item.title}
        >
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
  onNewExpense,
}: {
  categories: ReturnType<typeof categoryExpenses>;
  onNewExpense: () => void;
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
            {categories.slice(0, 4).map((item, index) => (
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
        <>
          <CompactEmpty
            title="Sem gastos neste mês"
            description="Adicione uma despesa para visualizar suas categorias."
          />
          <button className="panel-link mt-2" onClick={onNewExpense}>
            + Registrar gasto
          </button>
        </>
      )}
      {categories.length > 0 && (
        <Link href="/reports" className="panel-link mt-4">
          Ver relatório <ArrowRight size={15} />
        </Link>
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
      {benefits.length ? (
        <>
          <Money cents={cents} className="benefits-value" />
          <p className="muted text-xs">Separados do saldo disponível</p>
          <div className="benefit-list">
            {benefits.map((item) => (
              <div key={item.id}>
                <span>{item.name}</span>
                <Money cents={balanceFor(data, item.id, "benefit")} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="benefits-empty">Nenhum benefício cadastrado.</p>
      )}
      <Link href="/benefits" className="panel-link">
        {benefits.length ? "Ver benefícios" : "Adicionar benefício"}{" "}
        <ArrowRight size={15} />
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
