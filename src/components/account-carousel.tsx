"use client";

import { Landmark, Plus } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { bankTheme, type BankTheme } from "@/lib/bank-themes";
import { balanceFor } from "@/lib/finance";
import { accountKinds, type Account, type FinanceData } from "@/lib/model";
import { Money } from "./ui";

type Props = { data: FinanceData; onAddManual: () => void };

export function AccountCarousel({ data, onAddManual }: Props) {
  const accounts = data.accounts.filter((account) => account.active);
  const [selected, setSelected] = useState(0);
  const start = useRef<number | null>(null);
  const dragged = useRef(false);
  if (!accounts.length) return <EmptyAccounts onAddManual={onAddManual} />;
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
    <section aria-label="Contas e cartões" className="account-area">
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
            balance={balanceFor(data, account.id, "account")}
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
      <SelectedDetails account={active} data={data} />
    </section>
  );
}

function AccountCard({
  account,
  balance,
  selected,
  offset,
  onSelect,
}: {
  account: Account;
  balance: number;
  selected: boolean;
  offset: number;
  onSelect: () => void;
}) {
  const theme = bankTheme(account);
  const side = Math.max(-2, Math.min(2, offset));
  return (
    <button
      type="button"
      aria-label={`Selecionar conta ${account.name}`}
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
        secondary={accountKinds[account.kind]}
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
}: {
  institution: string;
  name: string;
  amount: number;
  secondary: string;
  theme: BankTheme;
}) {
  return (
    <>
      <div className="account-card-top">
        <span className="truncate">{institution}</span>
        <span className="account-card-mode">Saldo</span>
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
}: {
  account: Account;
  data: FinanceData;
}) {
  const linked = data.transactions.filter(
    (transaction) => transaction.accountId === account.id,
  );
  const connection = data.connections?.find(
    (item) => item.id === account.connectionId,
  );
  return (
    <div className="selected-account-details card">
      <div>
        <p className="eyebrow">Conta selecionada</p>
        <h3 className="truncate">{account.name}</h3>
        <p className="muted truncate text-xs">
          {account.institution} · {accountKinds[account.kind]}
        </p>
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
    </div>
  );
}

function EmptyAccounts({ onAddManual }: { onAddManual: () => void }) {
  return (
    <div className="account-empty card">
      <div>
        <span className="account-empty-icon">
          <Landmark size={18} />
        </span>
        <div>
          <h3>Você ainda não adicionou uma conta.</h3>
          <p className="muted">Conecte seu banco ou crie uma conta manual.</p>
        </div>
      </div>
      <div className="account-empty-actions">
        <Link className="btn btn-outline" href="/accounts">
          Conectar banco
        </Link>
        <button className="btn btn-primary" onClick={onAddManual}>
          <Plus size={16} /> Conta
        </button>
      </div>
    </div>
  );
}
