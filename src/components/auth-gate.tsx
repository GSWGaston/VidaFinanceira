"use client";
import { useState } from "react";
import { supabase } from "@/lib/repository";
import { Brand } from "./brand";
export function AuthGate() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    try {
      const result =
        mode === "reset"
          ? await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${location.origin}/settings`,
            })
          : mode === "signup"
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode !== "login")
        setMessage(
          mode === "signup"
            ? "Confira seu e-mail para confirmar a conta."
            : "Enviamos o link de recuperação para seu e-mail.",
        );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível continuar.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen grid place-items-center p-5">
      <div className="card w-full max-w-md p-8">
        <div className="mb-7">
          <Brand auth />
        </div>
        <h1 className="page-title">
          {mode === "login"
            ? "Bem-vindo de volta"
            : mode === "signup"
              ? "Crie sua conta"
              : "Recuperar senha"}
        </h1>
        <p className="muted mt-2 mb-7">Sua vida financeira em perspectiva.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {mode !== "reset" && (
            <div>
              <label className="label" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                className="input"
                type="password"
                minLength={6}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy
              ? "Aguarde…"
              : mode === "login"
                ? "Entrar"
                : mode === "signup"
                  ? "Cadastrar"
                  : "Enviar link"}
          </button>
        </form>
        {message && (
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            className="text-primary underline"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setMessage("");
            }}
          >
            {mode === "signup" ? "Já tenho conta" : "Criar conta"}
          </button>
          <button
            type="button"
            className="text-primary underline"
            onClick={() => {
              setMode(mode === "reset" ? "login" : "reset");
              setMessage("");
            }}
          >
            {mode === "reset" ? "Voltar" : "Esqueci minha senha"}
          </button>
        </div>
      </div>
    </main>
  );
}
