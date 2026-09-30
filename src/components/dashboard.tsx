"use client";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  Landmark,
  WalletCards,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useApp } from "./app-provider";
import { Badge, EmptyState, LoadingCards, Money } from "./ui";
import { balanceFor, categoryExpenses, dashboardTotals } from "@/lib/finance";
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
  const totals = dashboardTotals(data);
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const categories = categoryExpenses(data.transactions, month);
  const recent = [...data.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">
            VISÃO GERAL ·{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              month: "long",
              year: "numeric",
            })
              .format(now)
              .toUpperCase()}
          </p>
          <h1 className="page-title">
            Sua vida financeira,
            <br />
            <span className="text-primary">em perspectiva.</span>
          </h1>
          <p className="muted mt-2 text-sm">
            Um lugar para acompanhar o que importa.
          </p>
        </div>
        <Link className="btn btn-outline text-sm" href="/transactions">
          Ver transações <ArrowRight size={16} />
        </Link>
      </div>
      {error && (
        <div role="alert" className="card p-4">
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative overflow-hidden rounded-[22px] bg-[#176e55] p-6 text-white shadow-[0_15px_35px_#145f4733] sm:col-span-2 xl:col-span-1">
              <div className="absolute -right-10 -top-12 size-44 rounded-full border-[28px] border-white/10" />
              <div className="relative">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/80">
                    Saldo disponível
                  </span>
                  <Banknote size={21} />
                </div>
                <Money
                  cents={totals.balance}
                  className="block text-[30px] font-extrabold tracking-tight"
                />
                <p className="mt-2 text-xs text-white/70">
                  Em {data.accounts.filter((a) => a.active).length} contas
                  ativas
                </p>
              </div>
            </div>
            <Metric
              title="Entradas do mês"
              cents={totals.income}
              icon={<ArrowDownLeft size={19} />}
              color="green"
            />
            <Metric
              title="Saídas do mês"
              cents={totals.expense}
              icon={<ArrowUpRight size={19} />}
              color="red"
            />
            <Metric
              title="Resultado do mês"
              cents={totals.result}
              icon={<Banknote size={19} />}
              color="neutral"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="card p-6 lg:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">DISTRIBUIÇÃO</p>
                  <h2 className="section-title mt-1">Gastos por categoria</h2>
                </div>
                <Badge>Este mês</Badge>
              </div>
              {categories.length ? (
                <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row">
                  <div className="h-56 w-full sm:w-[55%]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories}
                          dataKey="amountCents"
                          nameKey="name"
                          innerRadius={64}
                          outerRadius={92}
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
                        <Tooltip
                          formatter={(value) => formatMoney(Number(value))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-3 sm:flex-1">
                    {categories.slice(0, 5).map((item, index) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <i
                            className="size-2.5 rounded-full"
                            style={{
                              background: colors[index % colors.length],
                            }}
                          />
                          {item.name}
                        </span>
                        <Money cents={item.amountCents} className="font-bold" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <EmptyState
                    title="Sem gastos neste mês"
                    description="Adicione uma despesa para visualizar suas categorias."
                  />
                </div>
              )}
            </div>
            <div className="card p-6 lg:col-span-2">
              <p className="eyebrow">RECURSOS RESTRITOS</p>
              <div className="mt-2 flex items-center justify-between">
                <h2 className="section-title">Seus benefícios</h2>
                <WalletCards className="text-primary" size={21} />
              </div>
              <Money
                cents={totals.benefits}
                className="mt-5 block text-3xl font-extrabold"
              />
              <p className="muted mt-1 text-xs">
                Separados do saldo financeiro disponível
              </p>
              <div className="mt-7 space-y-3">
                {data.benefits
                  .filter((item) => item.active)
                  .slice(0, 3)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl bg-background p-3 text-sm"
                    >
                      <span className="font-semibold">{item.name}</span>
                      <Money
                        cents={balanceFor(data, item.id, "benefit")}
                        className="font-bold"
                      />
                    </div>
                  ))}
                {!data.benefits.length && (
                  <p className="muted text-sm">Nenhum benefício cadastrado.</p>
                )}
              </div>
              <Link
                href="/benefits"
                className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary"
              >
                Ver benefícios <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="card p-6 lg:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">MOVIMENTAÇÃO</p>
                  <h2 className="section-title mt-1">Últimas transações</h2>
                </div>
                <Link
                  href="/transactions"
                  className="text-xs font-bold text-primary"
                >
                  Ver todas
                </Link>
              </div>
              {recent.length ? (
                <div className="mt-4 divide-y divide-border">
                  {recent.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div
                        className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.type === "income" ? "bg-[#e6f4e8] text-primary" : "bg-[#f9eeea] text-danger"}`}
                      >
                        {item.type === "income" ? (
                          <ArrowDownLeft size={18} />
                        ) : (
                          <ArrowUpRight size={18} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {item.description}
                        </p>
                        <p className="muted text-xs">
                          {item.category} ·{" "}
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
                        className={`whitespace-nowrap text-sm font-bold ${item.type === "income" ? "text-primary" : "text-foreground"}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    title="Ainda sem transações"
                    description="Registre uma entrada ou saída para acompanhar sua movimentação."
                  />
                </div>
              )}
            </div>
            <div className="space-y-4 lg:col-span-2">
              <div className="card p-6">
                <div className="flex items-center gap-2">
                  <Landmark size={19} className="text-primary" />
                  <h2 className="section-title">Suas contas</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {data.accounts
                    .filter((item) => item.active)
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <i
                            className="size-3 rounded-full"
                            style={{ background: item.color }}
                          />
                          {item.name}
                        </span>
                        <Money
                          cents={balanceFor(data, item.id, "account")}
                          className="font-bold"
                        />
                      </div>
                    ))}
                  {!data.accounts.length && (
                    <p className="muted text-sm">Nenhuma conta cadastrada.</p>
                  )}
                </div>
                <Link
                  href="/accounts"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary"
                >
                  Ver contas <ArrowRight size={15} />
                </Link>
              </div>
              <div className="card p-6">
                <div className="flex items-center gap-2">
                  <CalendarClock size={19} className="text-primary" />
                  <h2 className="section-title">Próximas despesas</h2>
                </div>
                <p className="muted mt-3 text-sm leading-relaxed">
                  Cadastre despesas recorrentes na próxima etapa para acompanhar
                  os vencimentos aqui.
                </p>
                <Link
                  href="/subscriptions"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary"
                >
                  Conhecer o recurso <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
function Metric({
  title,
  cents,
  icon,
  color,
}: {
  title: string;
  cents: number;
  icon: React.ReactNode;
  color: "green" | "red" | "neutral";
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-muted">{title}</p>
        <span
          className={`grid size-9 place-items-center rounded-xl ${color === "red" ? "bg-[#faeeeb] text-danger" : "bg-soft text-primary"}`}
        >
          {icon}
        </span>
      </div>
      <Money
        cents={cents}
        className="mt-9 block text-[25px] font-extrabold tracking-tight"
      />
      <p className="muted mt-1 text-xs">
        {color === "neutral" ? "Entradas menos saídas" : "No mês atual"}
      </p>
    </div>
  );
}
