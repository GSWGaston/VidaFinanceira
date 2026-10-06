"use client";

import { useEffect, useState } from "react";
import { CreditCard, Landmark, Plus, WalletCards } from "lucide-react";
import type { Account } from "@/lib/model";
import { useApp } from "./app-provider";
import { CreditCardCarousel } from "./credit-card-carousel";
import { AccountDialog, BenefitDialog } from "./forms";
import { OpenFinanceControls } from "./open-finance-connect";
import { Sheet } from "./primitives";
import { Badge, DialogFrame, LoadingCards } from "./ui";

export function AccountsCardsPage() {
  const { data, loading, error, reload } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountDialogVersion, setAccountDialogVersion] = useState(0);
  const [cardOpen, setCardOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Account | null>(null);
  const [cardDialogVersion, setCardDialogVersion] = useState(0);
  const [initialRemove, setInitialRemove] = useState(false);
  const [benefitOpen, setBenefitOpen] = useState(false);
  const [inspectedAccount, setInspectedAccount] = useState<Account | null>(
    null,
  );
  const syncing =
    data.connections?.some((connection) => connection.status === "syncing") ??
    false;

  useEffect(() => {
    if (!syncing) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      void reload();
      if (attempts >= 12) window.clearInterval(timer);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [syncing, reload]);

  const openAccount = () => {
    setAddOpen(false);
    setEditingAccount(null);
    setInitialRemove(false);
    setAccountDialogVersion((version) => version + 1);
    setAccountOpen(true);
  };
  const openAccountEditor = (account: Account, remove = false) => {
    setEditingAccount(account);
    setInitialRemove(remove);
    setAccountDialogVersion((version) => version + 1);
    setAccountOpen(true);
  };
  const openCard = () => {
    setAddOpen(false);
    setEditingCard(null);
    setInitialRemove(false);
    setCardDialogVersion((version) => version + 1);
    setCardOpen(true);
  };
  const openCardEditor = (account: Account, remove = false) => {
    setEditingCard(account);
    setInitialRemove(remove);
    setCardDialogVersion((version) => version + 1);
    setCardOpen(true);
  };
  const editSelected = (account: Account, remove = false) => {
    const hasCredit =
      account.creditLimitCents != null ||
      account.creditAvailableCents != null ||
      account.creditUsedCents != null;
    if (hasCredit) openCardEditor(account, remove);
    else openAccountEditor(account, remove);
  };
  const openBenefit = () => {
    setAddOpen(false);
    setBenefitOpen(true);
  };
  const orphanedConnections =
    data.connections?.filter(
      (connection) =>
        !data.accounts.some(
          (account) => account.active && account.connectionId === connection.id,
        ),
    ) ?? [];

  return (
    <div className="accounts-cards-page">
      <div className="accounts-cards-heading">
        <div>
          <p className="eyebrow">SEU DINHEIRO</p>
          <h1 className="page-title">Contas & cartões</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={17} /> Adicionar
        </button>
      </div>
      {error && (
        <div role="alert" className="card mb-4 p-4 text-sm">
          {error}{" "}
          <button onClick={() => void reload()} className="font-bold underline">
            Tentar novamente
          </button>
        </div>
      )}
      {loading ? (
        <LoadingCards />
      ) : (
        <>
          <CreditCardCarousel
            data={data}
            onAddManual={openCard}
            onAddAccount={openAccount}
            onEdit={(account) => editSelected(account)}
            onRemove={(account) => editSelected(account, true)}
            onInspect={setInspectedAccount}
          />
          {orphanedConnections.length > 0 && (
            <section className="accounts-connections">
              <h2 className="section-title">Conexões em andamento</h2>
              <div className="accounts-connections-list">
                {orphanedConnections.map((connection) => (
                  <div className="card" key={connection.id}>
                    <div>
                      <strong>{connection.institutionName}</strong>
                      {connection.isSandbox && (
                        <Badge color="gray">Ambiente de testes</Badge>
                      )}
                    </div>
                    <p className="muted text-xs">
                      {connection.status === "error"
                        ? "Requer atenção"
                        : connection.status === "disconnected"
                          ? "Desconectada"
                          : "Aguardando sincronização"}
                    </p>
                    {connection.status !== "disconnected" && (
                      <OpenFinanceControls
                        connectionId={connection.id}
                        itemId={connection.providerItemId}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      <Sheet open={addOpen} onOpenChange={setAddOpen} title="Adicionar">
        <div className="accounts-add-options">
          <div className="accounts-add-option">
            <Landmark size={20} />
            <div>
              <strong>Conectar banco</strong>
              <p>Via Open Finance</p>
            </div>
            <OpenFinanceControls />
          </div>
          <button onClick={openAccount}>
            <Landmark size={20} />
            <span>Adicionar conta manual</span>
          </button>
          <button onClick={openCard}>
            <CreditCard size={20} />
            <span>Adicionar cartão manual</span>
          </button>
          <button onClick={openBenefit}>
            <WalletCards size={20} />
            <span>Adicionar benefício</span>
          </button>
        </div>
      </Sheet>
      <AccountDialog
        key={accountDialogVersion}
        open={accountOpen}
        onOpenChange={setAccountOpen}
        editingAccount={editingAccount}
        initialRemove={initialRemove}
      />
      <AccountDialog
        key={cardDialogVersion}
        open={cardOpen}
        onOpenChange={setCardOpen}
        mode="card"
        editingAccount={editingCard}
        initialRemove={initialRemove}
      />
      <BenefitDialog open={benefitOpen} onOpenChange={setBenefitOpen} />
      <DialogFrame
        open={inspectedAccount !== null}
        onOpenChange={(open) => {
          if (!open) setInspectedAccount(null);
        }}
        title={inspectedAccount?.name ?? "Conta conectada"}
        description="Conta sincronizada pelo Open Finance."
      >
        <p className="muted mb-4 text-sm">{inspectedAccount?.institution}</p>
        {inspectedAccount?.connectionId && (
          <OpenFinanceControls connectionId={inspectedAccount.connectionId} />
        )}
      </DialogFrame>
    </div>
  );
}
