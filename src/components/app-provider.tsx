"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { toast, Toaster } from "sonner";
import type { Account, Benefit, FinanceData, Transaction } from "@/lib/model";
import {
  DemoRepository,
  SupabaseRepository,
  supabase,
  supabaseConfigured,
  type FinanceRepository,
} from "@/lib/repository";
import { PwaRegister } from "./pwa-register";
import { AuthGate } from "./auth-gate";

type AppContextValue = {
  data: FinanceData;
  loading: boolean;
  error: string | null;
  demo: boolean;
  user: User | null;
  reload: () => Promise<void>;
  addAccount: (item: Account) => Promise<void>;
  addBenefit: (item: Benefit) => Promise<void>;
  addTransaction: (item: Transaction) => Promise<void>;
};
const AppContext = createContext<AppContextValue | null>(null);
const empty: FinanceData = { accounts: [], benefits: [], transactions: [] };
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [data, setData] = useState<FinanceData>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const repo = useMemo<FinanceRepository | null>(
    () =>
      supabaseConfigured
        ? user && supabase
          ? new SupabaseRepository(supabase, user.id)
          : null
        : new DemoRepository(),
    [user],
  );
  const reload = useCallback(async () => {
    if (!repo) return;
    setLoading(true);
    setError(null);
    try {
      setData(await repo.load());
    } catch {
      setError("Não foi possível carregar seus dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [repo]);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setUser(data.user);
        setAuthReady(true);
      })
      .catch(() => setAuthReady(true));
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null),
    );
    return () => subscription.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setData(empty);
        setLoading(Boolean(repo));
      }
    });
    if (repo)
      repo
        .load()
        .then((result) => {
          if (active) {
            setData(result);
            setError(null);
          }
        })
        .catch(() => {
          if (active)
            setError("Não foi possível carregar seus dados. Tente novamente.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    return () => {
      active = false;
    };
  }, [repo]);
  const mutate = async (
    action: (repository: FinanceRepository) => Promise<void>,
  ) => {
    if (!repo) throw new Error("Faça login para continuar.");
    try {
      await action(repo);
      await reload();
      toast.success("Salvo com sucesso.");
    } catch (cause) {
      toast.error(
        "Não foi possível salvar. Confira os dados e tente novamente.",
      );
      throw cause;
    }
  };
  const value: AppContextValue = {
    data,
    loading,
    error,
    demo: !supabaseConfigured,
    user,
    reload,
    addAccount: (item) => mutate((repository) => repository.addAccount(item)),
    addBenefit: (item) => mutate((repository) => repository.addBenefit(item)),
    addTransaction: (item) =>
      mutate((repository) => repository.addTransaction(item)),
  };
  return (
    <AppContext.Provider value={value}>
      <PwaRegister />
      <Toaster position="top-right" richColors />
      {authReady ? (
        supabaseConfigured && !user ? (
          <AuthGate />
        ) : (
          children
        )
      ) : (
        <div className="p-8">Carregando sua sessão…</div>
      )}
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("AppProvider ausente");
  return value;
}
