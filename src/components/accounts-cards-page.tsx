"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Landmark,
  Plus,
  WalletCards,
} from "lucide-react";
import { useApp } from "./app-provider";
import { AccountCarousel } from "./account-carousel";
import { AccountDialog, BenefitDialog } from "./forms";
import { OpenFinanceControls } from "./open-finance-connect";
import { Sheet, Tabs } from "./primitives";
import { Badge, LoadingCards, Money } from "./ui";
import { creditOverview } from "@/lib/credit";
import { dashboardTotals } from "@/lib/finance";

export function AccountsCardsPage({
  defaultTab = "accounts",
}: {
  defaultTab?: "accounts" | "cards";
}) {
  const { data, loading, error, reload } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [benefitOpen, setBenefitOpen] = useState(false);
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
    setAccountOpen(true);
  };
  const openCard = () => {
    setAddOpen(false);
    setCardOpen(true);
  };
  const openBenefit = () => {
    setAddOpen(false);
    setBenefitOpen(true);
  };
  const activeAccounts = data.accounts.filter((account) => account.active);
  const institutions = new Set(
    activeAccounts.map((account) =>
      account.institution.toLocaleLowerCase("pt-BR"),
    ),
  ).size;
  const credit = creditOverview(data);

  return (
    <div className="accounts-cards-page">
      <div className="accounts-cards-heading">
        <div>
          <Link
            href="/"
            className="accounts-back"
            aria-label="Voltar para início"
          >
            <ArrowLeft size={20} />
          </Link>
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
        <Tabs
          defaultValue={defaultTab}
          items={[
            {
              value: "accounts",
              label: "Contas",
              content: (
                <AccountsTab
                  data={data}
                  balance={dashboardTotals(data).balance}
                  institutions={institutions}
                  onAdd={openAccount}
                />
              ),
            },
            {
              value: "cards",
              label: "Cartões",
              content: (
                <CardsTab data={data} credit={credit} onAdd={openCard} />
              ),
            },
            { value: "invoices", label: "Faturas", content: <InvoicesTab /> },
          ]}
        />
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
      <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} />
      <AccountDialog open={cardOpen} onOpenChange={setCardOpen} mode="card" />
      <BenefitDialog open={benefitOpen} onOpenChange={setBenefitOpen} />
    </div>
  );
}

type Data = ReturnType<typeof useApp>["data"];

function AccountsTab({
  data,
  balance,
  institutions,
  onAdd,
}: {
  data: Data;
  balance: number;
  institutions: number;
  onAdd: () => void;
}) {
  return (
    <div className="accounts-tab-content">
      <section className="accounts-tab-summary">
        <p>Saldo total</p>
        <Money cents={balance} />
        <small>
          {institutions} {institutions === 1 ? "instituição" : "instituições"}
        </small>
      </section>
      <AccountCarousel data={data} onAddManual={onAdd} />
      {!!data.connections?.length && (
        <section className="accounts-connections">
          <h2 className="section-title">Instituições conectadas</h2>
          <div className="accounts-connections-list">
            {data.connections.map((connection) => (
              <div className="card" key={connection.id}>
                <div>
                  <strong>{connection.institutionName}</strong>
                  {connection.isSandbox && (
                    <Badge color="gray">Ambiente de testes</Badge>
                  )}
                </div>
                <p className="muted text-xs">
                  {connection.status === "connected"
                    ? "Conectada"
                    : connection.status === "syncing"
                      ? "Sincronizando"
                      : connection.status === "error"
                        ? "Requer atenção"
                        : connection.status === "disconnected"
                          ? "Desconectada"
                          : "Aguardando autorização"}
                  {connection.lastSyncAt
                    ? ` · Atualizada em ${new Date(connection.lastSyncAt).toLocaleString("pt-BR")}`
                    : ""}
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
    </div>
  );
}

function CardsTab({
  data,
  credit,
  onAdd,
}: {
  data: Data;
  credit: ReturnType<typeof creditOverview>;
  onAdd: () => void;
}) {
  const incomplete = data.accounts.filter(
    (account) =>
      account.active &&
      account.creditLimitCents != null &&
      account.creditAvailableCents == null &&
      account.creditUsedCents == null,
  ).length;
  return (
    <div className="accounts-tab-content">
      {credit && (
        <section
          className="credit-tab-summary card"
          aria-label="Resumo do crédito"
        >
          <div>
            <span>Limite total</span>
            <Money cents={credit.totalCents} />
          </div>
          <div>
            <span>Utilizado</span>
            <Money cents={credit.usedCents} />
          </div>
          <div>
            <span>Disponível</span>
            <Money cents={credit.availableCents} />
          </div>
          <div className="credit-tab-progress">
            <span style={{ width: `${credit.usagePercentage}%` }} />
          </div>
          <p>{Math.round(credit.usagePercentage)}% utilizado</p>
        </section>
      )}
      {incomplete > 0 && (
        <p className="muted text-xs">
          {incomplete} {incomplete === 1 ? "cartão está" : "cartões estão"} sem
          informação suficiente de limite.
        </p>
      )}
      <AccountCarousel data={data} onAddManual={onAdd} variant="credit" />
    </div>
  );
}

function InvoicesTab() {
  return (
    <div className="card invoices-empty">
      <p className="eyebrow">FATURAS</p>
      <h2>Nenhuma fatura disponível</h2>
      <p className="muted">
        As contas conectadas e cadastradas ainda não fornecem dados de faturas.
        Valores de limite utilizado não são tratados como fatura.
      </p>
    </div>
  );
}
