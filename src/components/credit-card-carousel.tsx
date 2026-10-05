"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Plus } from "lucide-react";
import { bankTheme } from "@/lib/bank-themes";
import { relationshipOverview } from "@/lib/relationship";
import { accountKinds, type Account, type FinanceData } from "@/lib/model";
import { Money } from "./ui";
import { OpenFinanceControls } from "./open-finance-connect";

export function PortraitBankCard({
  account,
  selected = false,
}: {
  account: Account;
  selected?: boolean;
}) {
  const theme = bankTheme(account);
  return (
    <div
      className="portrait-bank-card"
      data-pattern={theme.pattern}
      data-selected={selected}
      style={
        {
          "--card-bg": theme.background,
          "--card-fg": theme.foreground,
          "--card-muted": theme.muted,
        } as CSSProperties
      }
    >
      <div className="portrait-bank-card-head">
        <span className="portrait-bank-mark">{theme.mark}</span>
        <span className="portrait-bank-type">
          {account.creditLimitCents != null ||
          account.creditAvailableCents != null ||
          account.creditUsedCents != null
            ? "crédito"
            : "conta"}
        </span>
      </div>
      <div className="portrait-bank-art" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="portrait-bank-card-foot">
        <span className="portrait-bank-chip" aria-hidden="true" />
        <span className="portrait-bank-name">{account.name}</span>
        <span className="portrait-bank-institution">{account.institution}</span>
      </div>
    </div>
  );
}

export function CreditCardCarousel({
  data,
  onAddManual,
  onAddAccount,
  onEdit,
}: {
  data: FinanceData;
  onAddManual: () => void;
  onAddAccount: () => void;
  onEdit: (account: Account) => void;
}) {
  const accounts = data.accounts.filter((account) => account.active);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; scroll: number } | null>(null);
  const moved = useRef(false);
  const selectedIndex = Math.max(
    0,
    accounts.findIndex((account) => account.id === selectedId),
  );
  const selected = accounts[selectedIndex];

  useEffect(() => {
    if (selectedId && !accounts.some((account) => account.id === selectedId)) {
      const frame = requestAnimationFrame(() =>
        setSelectedId(accounts[0]?.id ?? null),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [selectedId, accounts]);

  function center(index: number) {
    const container = viewport.current;
    const card = container?.children[index] as HTMLElement | undefined;
    if (!container || !card) return;
    container.scrollTo({
      left:
        card.offsetLeft -
        container.offsetLeft -
        (container.clientWidth - card.clientWidth) / 2,
      behavior: "smooth",
    });
    setSelectedId(accounts[index].id);
  }

  function syncSelection() {
    const container = viewport.current;
    if (!container) return;
    const middle =
      container.getBoundingClientRect().left + container.clientWidth / 2;
    let nearest = 0;
    let distance = Infinity;
    Array.from(container.children).forEach((node, index) => {
      const bounds = node.getBoundingClientRect();
      const difference = Math.abs(bounds.left + bounds.width / 2 - middle);
      if (difference < distance) {
        nearest = index;
        distance = difference;
      }
    });
    if (accounts[nearest]) setSelectedId(accounts[nearest].id);
  }

  if (!accounts.length)
    return (
      <div className="account-empty card">
        <div>
          <CreditCard size={22} />
          <div>
            <h3>Nenhuma conta ou cartão cadastrado</h3>
            <p className="muted">
              Adicione uma conta, um cartão manual ou conecte seu banco.
            </p>
          </div>
        </div>
        <div className="account-empty-actions">
          <button className="btn btn-outline" onClick={onAddAccount}>
            Adicionar conta
          </button>
          <button className="btn btn-primary" onClick={onAddManual}>
            <Plus size={16} /> Adicionar cartão
          </button>
        </div>
      </div>
    );

  const {
    credit,
    hasCredit,
    hasAccount,
    balanceCents,
    linkedTransactionsCount,
  } = relationshipOverview(data, selected);
  const connection = data.connections?.find(
    (item) => item.id === selected.connectionId,
  );
  return (
    <section className="credit-carousel-area" aria-label="Contas e cartões">
      <div
        className="credit-carousel-viewport"
        ref={viewport}
        onScroll={syncSelection}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") {
            pointer.current = {
              x: event.clientX,
              scroll: event.currentTarget.scrollLeft,
            };
            moved.current = false;
          }
        }}
        onPointerMove={(event) => {
          if (pointer.current) {
            const delta = event.clientX - pointer.current.x;
            if (Math.abs(delta) > 5)
              event.currentTarget.scrollLeft = pointer.current.scroll - delta;
          }
        }}
        onPointerUp={(event) => {
          if (pointer.current)
            moved.current = Math.abs(event.clientX - pointer.current.x) > 12;
          pointer.current = null;
        }}
        onPointerCancel={() => {
          pointer.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            center(
              Math.max(
                0,
                Math.min(
                  accounts.length - 1,
                  selectedIndex + (event.key === "ArrowRight" ? 1 : -1),
                ),
              ),
            );
          }
        }}
        tabIndex={0}
        aria-label="Deslize ou use as setas para escolher uma instituição"
      >
        {accounts.map((account, index) => (
          <button
            type="button"
            className="credit-carousel-item"
            key={account.id}
            aria-label={`Selecionar ${account.name}`}
            aria-pressed={index === selectedIndex}
            onClick={() => {
              if (!moved.current) center(index);
              moved.current = false;
            }}
          >
            <PortraitBankCard
              account={account}
              selected={index === selectedIndex}
            />
          </button>
        ))}
      </div>
      {accounts.length > 1 && (
        <div className="account-dots" aria-label="Selecionar instituição">
          {accounts.map((account, index) => (
            <button
              key={account.id}
              type="button"
              aria-label={`Selecionar ${account.name}`}
              aria-current={index === selectedIndex}
              className={index === selectedIndex ? "active" : ""}
              onClick={() => center(index)}
            />
          ))}
        </div>
      )}
      <div className="relationship-details card" aria-live="polite">
        <header className="relationship-details-header">
          <p className="eyebrow">CONTA / CARTÃO SELECIONADO</p>
          <h2>{selected.name}</h2>
          <p className="muted">
            {selected.institution}
            {hasAccount ? ` · ${accountKinds[selected.kind]}` : ""}
          </p>
        </header>
        <div className="relationship-sections">
          {hasCredit && (
            <section className="relationship-section" aria-label="Crédito">
              <h3>CRÉDITO</h3>
              {credit ? (
                <div className="relationship-stats">
                  <div>
                    <span>Limite total</span>
                    <Money cents={credit.total} />
                  </div>
                  <div>
                    <span>Limite utilizado</span>
                    <Money cents={credit.used} />
                  </div>
                  <div>
                    <span>Limite disponível</span>
                    <Money cents={credit.available} />
                  </div>
                </div>
              ) : (
                <p className="muted text-sm">
                  Dados de limite ainda incompletos.
                </p>
              )}
            </section>
          )}
          {hasAccount && (
            <section className="relationship-section" aria-label="Conta">
              <h3>CONTA</h3>
              <div className="relationship-stats">
                <div>
                  <span>Saldo em conta</span>
                  {balanceCents !== null ? (
                    <Money cents={balanceCents} />
                  ) : (
                    <strong>Indisponível</strong>
                  )}
                </div>
                <div>
                  <span>Movimentações vinculadas</span>
                  <strong>
                    {linkedTransactionsCount}{" "}
                    {linkedTransactionsCount === 1 ? "registro" : "registros"}
                  </strong>
                </div>
                <div>
                  <span>Tipo de conta</span>
                  <strong>{accountKinds[selected.kind]}</strong>
                </div>
                {selected.lastSyncedAt && (
                  <div>
                    <span>Última sincronização</span>
                    <strong>
                      {new Date(selected.lastSyncedAt).toLocaleString("pt-BR")}
                    </strong>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
        <div className="relationship-actions">
          <Link href="/transactions" className="panel-link">
            Ver transações <ArrowRight size={15} />
          </Link>
          {hasCredit &&
            (!selected.source || selected.source === "manual") &&
            !selected.connectionId && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onEdit(selected)}
              >
                Editar cartão
              </button>
            )}
          {connection && connection.status !== "disconnected" && (
            <OpenFinanceControls
              connectionId={connection.id}
              itemId={connection.providerItemId}
            />
          )}
        </div>
      </div>
    </section>
  );
}
