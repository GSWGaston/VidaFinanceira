"use client";

import { ArrowRight, Landmark, Plus } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { bankTheme, type BankTheme } from "@/lib/bank-themes";
import { balanceFor } from "@/lib/finance";
import { creditLineForAccount } from "@/lib/credit";
import { accountKinds, type Account, type FinanceData } from "@/lib/model";
import { Money } from "./ui";
import { OpenFinanceControls } from "./open-finance-connect";

type Props = {
  data: FinanceData;
  onAddManual: () => void;
  variant?: "account" | "credit";
};

export function AccountCarousel({
  data,
  onAddManual,
  variant = "account",
}: Props) {
  const accounts = data.accounts.filter(
    (account) =>
      account.active &&
      (variant === "account" || creditLineForAccount(account)),
  );
  const [selected, setSelected] = useState(0);
  const start = useRef<number | null>(null);
  const dragged = useRef(false);
  if (!accounts.length)
    return <EmptyAccounts onAddManual={onAddManual} variant={variant} />;
  const selectedIndex = Math.min(selected, accounts.length - 1);
  const active = accounts[selectedIndex];
  const move = (direction: number) =>
    setSelected((current) =>
      Math.max(
        0,
        Math.min(
          accounts.length - 1,
          Math.min(current, accounts.length - 1) + direction,
        ),
      ),
    );
  const pointerDown = (event: React.PointerEvent) => {
    start.current = event.clientX;
    dragged.current = false;
  };
  const pointerUp = (event: React.PointerEvent) => {
    if (start.current === null) return;
    const delta = event.clientX - start.current;
    dragged.current = Math.abs(delta) > 8;
    if (Math.abs(delta) > 36) move(delta < 0 ? 1 : -1);
    start.current = null;
  };
  return (
    <section
      aria-label={variant === "credit" ? "Cartões de crédito" : "Contas"}
      className="account-area"
    >
      <div
        className="account-carousel"
        onPointerDown={pointerDown}
        onPointerUp={pointerUp}
        onPointerCancel={() => {
          start.current = null;
        }}
      >
        {accounts.map((account, index) => (
          <AccountCard
            key={account.id}
            account={account}
            balance={
              variant === "credit"
                ? creditLineForAccount(account)!.available
                : balanceFor(data, account.id, "account")
            }
            variant={variant}
            selected={index === selectedIndex}
            offset={index - selectedIndex}
            onSelect={() => {
              if (!dragged.current) setSelected(index);
            }}
          />
        ))}
      </div>
      {accounts.length > 1 && (
        <div className="account-dots" aria-label="Selecionar conta">
          {accounts.map((account, index) => (
            <button
              key={account.id}
              aria-label={`Selecionar ${account.name}`}
              aria-current={index === selectedIndex}
              className={index === selectedIndex ? "active" : ""}
              onClick={() => setSelected(index)}
            />
          ))}
        </div>
      )}
      <SelectedDetails account={active} data={data} variant={variant} />
    </section>
  );
}

function AccountCard({
  account,
  balance,
  variant,
  selected,
  offset,
  onSelect,
}: {
  account: Account;
  balance: number;
  variant: "account" | "credit";
  selected: boolean;
  offset: number;
  onSelect: () => void;
}) {
  const theme = bankTheme(account);
  const side = Math.max(-2, Math.min(2, offset));
  return (
    <button
      type="button"
      aria-label={`Selecionar ${variant === "credit" ? "cartão" : "conta"} ${account.name}`}
      aria-pressed={selected}
      onClick={onSelect}
      className="account-bank-card"
      data-active={selected}
      data-side={side}
      data-pattern={theme.pattern}
      style={
        {
          "--card-bg": theme.background,
          "--card-fg": theme.foreground,
          "--card-muted": theme.muted,
        } as CSSProperties
      }
    >
      <FinancialCardFace
        institution={account.institution}
        name={account.name}
        amount={balance}
        secondary={
          variant === "credit"
            ? "Crédito disponível"
            : accountKinds[account.kind]
        }
        mode={variant === "credit" ? "Crédito" : "Saldo"}
        theme={theme}
      />
    </button>
  );
}

export function FinancialCardFace({
  institution,
  name,
  amount,
  secondary,
  theme,
  mode = "Saldo",
}: {
  institution: string;
  name: string;
  amount: number;
  secondary: string;
  theme: BankTheme;
  mode?: string;
}) {
  return (
    <>
      <div className="account-card-top">
        <span className="truncate">{institution}</span>
        <span className="account-card-mode">{mode}</span>
      </div>
      <Money cents={amount} className="account-card-amount" />
      <div className="account-card-subline">{secondary}</div>
      <div className="account-card-footer">
        <span className="truncate">{name}</span>
        <strong aria-hidden="true">{theme.mark}</strong>
      </div>
    </>
  );
}

function SelectedDetails({
  account,
  data,
  variant,
}: {
  account: Account;
  data: FinanceData;
  variant: "account" | "credit";
}) {
  const linked = data.transactions.filter(
    (transaction) => transaction.accountId === account.id,
  );
  const connection = data.connections?.find(
    (item) => item.id === account.connectionId,
  );
  const credit = creditLineForAccount(account);
  return (
    <div className="selected-account-details card">
      <div className="selected-account-main">
        <p className="eyebrow">
          {variant === "credit" ? "Cartão selecionado" : "Conta selecionada"}
        </p>
        <h3 className="truncate">{account.name}</h3>
        <p className="muted truncate text-xs">
          {account.institution} · {accountKinds[account.kind]}
        </p>
        <div className="selected-account-stats">
          {variant === "account" ? (
            <div>
              <span>Saldo em conta</span>
              <Money cents={balanceFor(data, account.id, "account")} />
            </div>
          ) : credit ? (
            <>
              <div>
                <span>Limite total</span>
                <Money cents={credit.total} />
              </div>
              <div>
                <span>Utilizado</span>
                <Money cents={credit.used} />
              </div>
              <div>
                <span>Disponível</span>
                <Money cents={credit.available} />
              </div>
            </>
          ) : null}
          <div>
            <span>Movimentações</span>
            <strong>
              {linked.length} {linked.length === 1 ? "registro" : "registros"}
            </strong>
          </div>
        </div>
        {account.lastSyncedAt && (
          <p className="muted text-xs">
            Última sincronização:{" "}
            {new Date(account.lastSyncedAt).toLocaleString("pt-BR")}
          </p>
        )}
        <Link href="/transactions" className="panel-link mt-3">
          Ver transações <ArrowRight size={15} />
        </Link>
      </div>
      <div className="selected-account-meta">
        <span>
          {linked.length}{" "}
          {linked.length === 1 ? "movimentação" : "movimentações"}
        </span>
        {connection && (
          <span>
            {connection.isSandbox
              ? "Ambiente de testes"
              : connection.status === "connected"
                ? "Sincronizada"
                : "Sincronizando"}
          </span>
        )}
      </div>
      {connection && connection.status !== "disconnected" && (
        <div className="selected-account-manage">
          <p className="eyebrow">GERENCIAR CONEXÃO</p>
          <OpenFinanceControls
            connectionId={connection.id}
            itemId={connection.providerItemId}
          />
        </div>
      )}
    </div>
  );
}

function EmptyAccounts({
  onAddManual,
  variant,
}: {
  onAddManual: () => void;
  variant: "account" | "credit";
}) {
  return (
    <div className="account-empty card">
      <div>
        <span className="account-empty-icon">
          <Landmark size={18} />
        </span>
        <div>
          <h3>
            {variant === "credit"
              ? "Nenhum cartão com limite disponível."
              : "Você ainda não adicionou uma conta."}
          </h3>
          <p className="muted">
            {variant === "credit"
              ? "Cadastre um cartão manual com limite conhecido."
              : "Conecte seu banco ou crie uma conta manual."}
          </p>
        </div>
      </div>
      <div className="account-empty-actions">
        {variant === "account" && (
          <Link className="btn btn-outline" href="/accounts">
            Conectar banco
          </Link>
        )}
        <button className="btn btn-primary" onClick={onAddManual}>
          <Plus size={16} /> {variant === "credit" ? "Cartão" : "Conta"}
        </button>
      </div>
    </div>
  );
}
