"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
  CircleDollarSign,
  CreditCard,
  Download,
  House,
  Landmark,
  LayoutGrid,
  Menu,
  Plus,
  Settings,
  Target,
  WalletCards,
  X,
  CarFront,
  Repeat2,
  Layers3,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "./app-provider";
import { TransactionDialog } from "./forms";
const navigation = [
  { href: "/", label: "Início", icon: House },
  { href: "/transactions", label: "Transações", icon: Repeat2 },
  { href: "/planning", label: "Planejamento", icon: CalendarRange },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/accounts", label: "Contas", icon: Landmark },
  { href: "/cards", label: "Cartões", icon: CreditCard },
  { href: "/benefits", label: "Benefícios", icon: WalletCards },
  { href: "/budgets", label: "Orçamentos", icon: LayoutGrid },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/assets", label: "Patrimônio", icon: Layers3 },
  { href: "/vehicles", label: "Veículos", icon: CarFront },
  { href: "/subscriptions", label: "Assinaturas", icon: Repeat2 },
  { href: "/imports", label: "Importar dados", icon: Download },
  { href: "/settings", label: "Configurações", icon: Settings },
];
const mainMobile = navigation.slice(0, 4);
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { demo } = useApp();
  const [more, setMore] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [dark, setDark] = useState(false);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:w-[252px] lg:shrink-0 lg:flex-col border-r border-border bg-surface px-4 py-7">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 text-[19px] font-extrabold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-white">
            <CircleDollarSign size={23} />
          </span>
          Vida<span className="text-primary">Financeira</span>
        </Link>
        <p className="eyebrow mt-11 px-3">MENU PRINCIPAL</p>
        <nav
          aria-label="Navegação principal"
          className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1"
        >
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-colors ${path === href ? "bg-soft text-primary" : "text-muted hover:bg-background hover:text-foreground"}`}
            >
              <Icon size={18} strokeWidth={path === href ? 2.4 : 1.9} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 rounded-2xl bg-soft p-4">
          <p className="font-bold text-sm">Sua jornada financeira</p>
          <p className="muted mt-1 text-xs leading-relaxed">
            Organize hoje. Enxergue o amanhã.
          </p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-surface/95 px-5 backdrop-blur sm:px-9">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-extrabold lg:hidden"
          >
            <CircleDollarSign className="text-primary" size={26} />
            Vida<span className="text-primary">Financeira</span>
          </Link>
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-muted">
              Seu espaço financeiro
            </p>
            <p className="text-sm font-bold">Visão geral e controle</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex rounded-full bg-soft px-3 py-1.5 text-xs font-bold text-primary">
              {demo ? "Modo demonstração" : "Conta pessoal"}
            </span>
            <button
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={toggleTheme}
              className="btn btn-ghost !p-2"
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              onClick={() => setTransactionOpen(true)}
              className="btn btn-primary !hidden sm:!inline-flex"
            >
              <Plus size={17} />
              Nova transação
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1450px] px-5 pb-32 pt-7 sm:px-9 lg:pb-14 lg:pt-10">
          {demo && (
            <div className="mb-6 rounded-xl border border-[#cce5d3] bg-[#ecf7ee] px-4 py-2.5 text-xs font-medium text-[#326e48]">
              Dados fictícios de demonstração. Alterações são salvas somente
              neste navegador.
            </div>
          )}
          {children}
        </main>
      </div>
      <nav
        aria-label="Navegação móvel"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface shadow-[0_-8px_30px_#0000000b] lg:hidden"
      >
        {mainMobile.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            className={`flex min-h-[61px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold ${path === href ? "text-primary" : "text-muted"}`}
          >
            <Icon size={21} />
            {label === "Planejamento" ? "Planejar" : label}
          </Link>
        ))}
        <button
          onClick={() => setMore(true)}
          className="flex min-h-[61px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold text-muted"
        >
          <Menu size={21} />
          Mais
        </button>
      </nav>
      {more && (
        <div
          className="fixed inset-0 z-40 bg-[#0b221e88] lg:hidden"
          onClick={() => setMore(false)}
        >
          <div
            className="safe-bottom absolute inset-x-0 bottom-0 max-h-[80vh] overflow-auto rounded-t-[28px] bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">Mais opções</h2>
              <button
                aria-label="Fechar menu"
                className="btn btn-ghost !p-2"
                onClick={() => setMore(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navigation.slice(4).map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMore(false)}
                  className="flex min-h-14 items-center gap-3 rounded-xl bg-background px-3 text-sm font-semibold"
                >
                  <Icon size={19} className="text-primary" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      <button
        aria-label="Nova transação"
        onClick={() => setTransactionOpen(true)}
        className="fixed bottom-[76px] right-5 z-20 grid size-12 place-items-center rounded-full bg-primary text-white shadow-xl sm:hidden lg:hidden"
      >
        <Plus size={23} />
      </button>
      <TransactionDialog
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
      />
    </div>
  );
}
