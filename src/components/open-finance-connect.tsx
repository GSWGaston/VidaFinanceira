"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { supabase } from "@/lib/repository";
import { useApp } from "./app-provider";
const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((module) => module.PluggyConnect),
  { ssr: false },
);

async function callApi(path: string, method: "POST" | "DELETE", body?: object) {
  if (!supabase)
    throw new Error("Open Finance ainda não está configurado neste ambiente.");
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session)
    throw new Error("Faça login novamente para continuar.");
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const result: { error?: string; connectToken?: string; status?: string } =
    await response.json();
  if (!response.ok)
    throw new Error(
      result.error === "NOT_CONFIGURED"
        ? "Open Finance ainda não está configurado neste ambiente."
        : "Não foi possível concluir a operação. Tente novamente.",
    );
  return result;
}
export function OpenFinanceControls({
  connectionId,
  itemId,
}: {
  connectionId?: string;
  itemId?: string;
}) {
  const { local, reload } = useApp();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true);
    try {
      const result = await callApi(
        "/api/open-finance/connect-token",
        "POST",
        connectionId ? { connectionId } : {},
      );
      if (!result.connectToken)
        throw new Error("Não foi possível abrir a conexão.");
      setToken(result.connectToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha na conexão.");
    } finally {
      setBusy(false);
    }
  };
  const complete = async (id: string) => {
    setToken(null);
    setBusy(true);
    try {
      const result = await callApi("/api/open-finance/complete", "POST", {
        itemId: id,
      });
      await reload();
      toast.success(
        result.status === "connected"
          ? "Contas e transações sincronizadas."
          : "Conexão registrada. Aguarde a autorização do banco.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha na sincronização.",
      );
    } finally {
      setBusy(false);
    }
  };
  const sync = async () => {
    if (!connectionId) return;
    setBusy(true);
    try {
      await callApi(`/api/open-finance/connections/${connectionId}`, "POST");
      await reload();
      toast.success("Sincronização concluída.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha na sincronização.",
      );
    } finally {
      setBusy(false);
    }
  };
  const disconnect = async () => {
    if (
      !connectionId ||
      !window.confirm(
        "Desconectar esta instituição? O histórico importado será mantido.",
      )
    )
      return;
    setBusy(true);
    try {
      await callApi(`/api/open-finance/connections/${connectionId}`, "DELETE");
      await reload();
      toast.success("Instituição desconectada.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao desconectar.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {connectionId ? (
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-outline"
            disabled={busy}
            onClick={() => void sync()}
          >
            Sincronizar
          </button>
          <button
            className="btn btn-outline"
            disabled={busy}
            onClick={() => void start()}
          >
            Renovar acesso
          </button>
          <button
            className="btn btn-outline"
            disabled={busy}
            onClick={() => void disconnect()}
          >
            Desconectar
          </button>
        </div>
      ) : (
        <button
          className="btn btn-primary"
          disabled={busy}
          onClick={() => void start()}
        >
          + Conectar instituição
        </button>
      )}
      {local && !connectionId && (
        <span className="muted text-xs">
          Configure Supabase e Pluggy para conectar uma instituição.
        </span>
      )}
      {busy && (
        <span role="status" className="muted text-xs">
          Processando conexão…
        </span>
      )}
      {token && (
        <PluggyConnect
          key={token}
          connectToken={token}
          includeSandbox={process.env.NODE_ENV !== "production"}
          updateItem={itemId}
          allowFullscreen
          language="pt"
          onSuccess={({ item }) => void complete(item.id)}
          onClose={() => setToken(null)}
          onError={() => {
            setToken(null);
            toast.error(
              "A conexão foi interrompida. Você pode tentar novamente.",
            );
          }}
          onLoadError={() => {
            setToken(null);
            toast.error("Não foi possível abrir o Pluggy Connect.");
          }}
        />
      )}
    </>
  );
}
