"use client";
import { useState } from "react";
import { LogOut, LockKeyhole, UserCircle2 } from "lucide-react";
import { useApp } from "./app-provider";
import { supabase } from "@/lib/repository";
export function SettingsPage() {
  const { local, user } = useApp();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Senha atualizada com sucesso.");
    setBusy(false);
    if (!error) setPassword("");
  }
  return (
    <div>
      <p className="eyebrow mb-2">PREFERÊNCIAS</p>
      <h1 className="page-title">Configurações</h1>
      <p className="muted mt-2 text-sm">Gerencie seu acesso ao Ordinnum.</p>
      <div className="mt-7 grid max-w-3xl gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <UserCircle2 size={23} className="text-primary" />
            <h2 className="section-title">Conta</h2>
          </div>
          {local ? (
            <p className="muted mt-4 text-sm">
              Seus dados são armazenados apenas neste navegador.
            </p>
          ) : (
            <>
              <p className="muted mt-4 text-sm">
                Conectado como{" "}
                <strong className="text-foreground">{user?.email}</strong>
              </p>
              <button
                className="btn btn-outline mt-5"
                onClick={() => void supabase?.auth.signOut()}
              >
                <LogOut size={17} /> Sair da conta
              </button>
            </>
          )}
        </div>
        {!local && (
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <LockKeyhole size={22} className="text-primary" />
              <h2 className="section-title">Alterar senha</h2>
            </div>
            <form onSubmit={updatePassword} className="mt-5 max-w-sm space-y-3">
              <label className="label" htmlFor="new-password">
                Nova senha
              </label>
              <input
                id="new-password"
                className="input"
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button className="btn btn-primary" disabled={busy}>
                Atualizar senha
              </button>
            </form>
            {message && (
              <p role="status" className="mt-3 text-sm">
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
