"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
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
  Search,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "./app-provider";
import { TransactionDialog } from "./forms";
import { Brand } from "./brand";
import { Sheet } from "./primitives";
import { dashboardTotals } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
const navigation = [
  { href: "/", label: "Início", icon: House },
  { href: "/transactions", label: "Transações", icon: Repeat2 },
  { href: "/planning", label: "Planejamento", icon: CalendarRange },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/accounts", label: "Contas & cartões", icon: Landmark },
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
  const { local, data } = useApp();
  const [more, setMore] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [localNotice, setLocalNotice] = useState(true);
  useEffect(() => {
    if (path !== "/") return;
    let frame = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      frame = 0;
      const scroll = window.scrollY;
      const progress = reducedMotion.matches
        ? 0
        : Math.min(1, Math.max(0, scroll / 170));
      const headerProgress = reducedMotion.matches
        ? Number(scroll >= 290)
        : Math.min(1, Math.max(0, (scroll - 170) / 110));
      document.documentElement.style.setProperty(
        "--home-progress",
        String(progress),
      );
      document.documentElement.style.setProperty(
        "--home-header-progress",
        String(headerProgress),
      );
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    reducedMotion.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      reducedMotion.removeEventListener("change", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--home-progress");
      document.documentElement.style.removeProperty("--home-header-progress");
    };
  }, [path]);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:w-[252px] lg:shrink-0 lg:flex-col border-r border-border bg-surface px-4 py-7">
        <Link href="/" className="flex h-10 items-center px-3">
          <Brand />
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
              className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-colors ${path === href ? "sidebar-link-active bg-soft text-primary" : "text-muted hover:bg-background hover:text-foreground"}`}
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
        <header
          className={`app-header sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-surface/95 px-5 backdrop-blur sm:px-9 ${path === "/" ? "home-topbar" : ""}`}
        >
          <Link
            href="/"
            className={`flex items-center ${path === "/" ? "home-topbar-logo" : "lg:hidden"}`}
          >
            <Brand compact />
          </Link>
          {path === "/" && (
            <>
              <Link
                href="/transactions?focus=search"
                className="home-topbar-search"
                aria-label="Pesquisar transações"
              >
                <Search size={18} /> <span>Pesquisar</span>
              </Link>
              <span className="home-topbar-balance" aria-hidden="true">
                {formatMoney(dashboardTotals(data).balance)}
              </span>
            </>
          )}
          {path !== "/" && (
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-muted">
                Seu espaço financeiro
              </p>
              <p className="text-sm font-bold">Visão geral e controle</p>
            </div>
          )}
          <div className="app-header-actions flex items-center gap-2">
            {path !== "/" && (
              <span className="hidden rounded-full bg-soft px-3 py-1.5 text-xs font-bold text-primary sm:inline-flex">
                {local ? "Dados locais" : "Conta pessoal"}
              </span>
            )}
            <button
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={toggleTheme}
              className="btn btn-ghost !p-2"
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            {path === "/" && (
              <Link
                href="/settings"
                className="home-profile-action"
                aria-label="Abrir perfil e configurações"
              >
                <UserRound size={20} />
              </Link>
            )}
            {path !== "/" && path !== "/transactions" && (
              <button
                onClick={() => setTransactionOpen(true)}
                className="btn btn-primary !hidden sm:!inline-flex"
              >
                <Plus size={17} />
                Nova transação
              </button>
            )}
          </div>
        </header>
        <main
          className={`mx-auto max-w-[1450px] px-5 pb-32 pt-7 sm:px-9 lg:pb-14 lg:pt-10 ${path === "/" ? "home-main" : ""}`}
        >
          {local && localNotice && path !== "/" && (
            <div className="local-notice mb-4 flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-secondary px-3 py-2 text-xs font-medium text-primary sm:mb-6 sm:px-4 sm:py-2.5">
              <span>
                Seus dados são salvos somente neste navegador. Configure o
                Supabase para sincronização e acesso com uma conta.
              </span>
              <button
                aria-label="Fechar aviso de dados locais"
                className="shrink-0 font-extrabold"
                onClick={() => setLocalNotice(false)}
              >
                <X size={15} />
              </button>
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
            className={`flex min-h-[61px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold ${path === href ? "mobile-nav-active text-accent-text" : "text-muted"}`}
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
      <Sheet open={more} onOpenChange={setMore} title="Mais opções">
        <div className="grid grid-cols-2 gap-2">
          {navigation.slice(4).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMore(false)}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-background px-3 text-sm font-semibold"
            >
              <Icon size={19} className="text-primary" />
              {label}
            </Link>
          ))}
        </div>
      </Sheet>
      {!["/", "/transactions", "/accounts", "/cards"].includes(path) && (
        <button
          aria-label="Nova transação"
          onClick={() => setTransactionOpen(true)}
          className="fixed bottom-[76px] right-5 z-20 grid size-12 place-items-center rounded-full bg-accent text-accent-foreground shadow-xl sm:hidden lg:hidden"
        >
          <Plus size={23} />
        </button>
      )}
      <TransactionDialog
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
      />
    </div>
  );
}
