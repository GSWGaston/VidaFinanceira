"use client";
import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import {
  cardInstitutionById,
  cardInstitutions,
  normalizeInstitutionName,
} from "@/lib/bank-themes";
import { PortraitBankCard } from "./credit-card-carousel";
import { accountSchema, benefitSchema, transactionSchema } from "@/lib/schemas";
import {
  accountKinds,
  benefitKinds,
  categories,
  type Account,
  type Benefit,
  type Transaction,
} from "@/lib/model";
import { useApp } from "./app-provider";
import { DialogFrame } from "./ui";
type AccountFields = {
  name: string;
  institution: string;
  kind: Account["kind"];
  openingBalance: string;
  color: string;
  creditLimit?: string;
  creditAvailable?: string;
  hasLinkedAccount: boolean;
};
type BenefitFields = {
  name: string;
  company: string;
  kind: Benefit["kind"];
  openingBalance: string;
  monthlyCredit: string;
  creditDay: number;
};
type TransactionFields = {
  description: string;
  amount: string;
  type: Transaction["type"];
  date: string;
  category: string;
  source: string;
};
function ErrorText({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-2 text-xs text-danger">
      {message}
    </p>
  );
}
export function AccountDialog({
  open,
  onOpenChange,
  mode = "account",
  editingAccount = null,
  initialRemove = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "account" | "card";
  editingAccount?: Account | null;
  initialRemove?: boolean;
}) {
  const { addAccount, updateCard, removeCard } = useApp();
  const [confirmRemove, setConfirmRemove] = useState(initialRemove);
  const { register, handleSubmit, reset, control } = useForm<AccountFields>({
    defaultValues: editingAccount
      ? {
          name: editingAccount.name,
          institution:
            editingAccount.institutionId ??
            normalizeInstitutionName(editingAccount.institution) ??
            "",
          kind: editingAccount.kind,
          openingBalance: (editingAccount.openingBalanceCents / 100)
            .toFixed(2)
            .replace(".", ","),
          color: editingAccount.color,
          creditLimit: ((editingAccount.creditLimitCents ?? 0) / 100)
            .toFixed(2)
            .replace(".", ","),
          creditAvailable: (
            (editingAccount.creditAvailableCents ??
              (editingAccount.creditLimitCents ?? 0) -
                (editingAccount.creditUsedCents ?? 0)) / 100
          )
            .toFixed(2)
            .replace(".", ","),
          hasLinkedAccount: editingAccount.hasLinkedAccount ?? true,
        }
      : {
          kind: "checking",
          openingBalance: "0",
          color: "#7a3e2b",
          institution: mode === "card" ? cardInstitutions[0]?.id : "",
          hasLinkedAccount: mode !== "card",
        },
  });
  const institutionValue = useWatch({ control, name: "institution" });
  const cardName = useWatch({ control, name: "name" });
  const hasLinkedAccount = useWatch({ control, name: "hasLinkedAccount" });
  const selectedInstitution = cardInstitutionById(institutionValue);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(raw: AccountFields) {
    setError("");
    const result = accountSchema.safeParse(
      mode === "card"
        ? { ...raw, institution: selectedInstitution?.name ?? raw.institution }
        : raw,
    );
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (
      mode === "card" &&
      (result.data.creditLimit === null || result.data.creditAvailable === null)
    ) {
      setError("Informe o limite total e o crédito disponível do cartão.");
      return;
    }
    if (mode === "card" && !selectedInstitution) {
      setError("Selecione uma instituição disponível.");
      return;
    }
    setBusy(true);
    try {
      const account: Account = {
        ...editingAccount,
        id: editingAccount?.id ?? crypto.randomUUID(),
        name: result.data.name,
        institution: result.data.institution,
        institutionId: mode === "card" ? selectedInstitution?.id : null,
        hasLinkedAccount: mode === "card" ? raw.hasLinkedAccount : true,
        kind: result.data.kind,
        openingBalanceCents: result.data.openingBalance,
        color: result.data.color,
        active: editingAccount?.active ?? true,
        source: editingAccount?.source ?? "manual",
        creditLimitCents: result.data.creditLimit,
        creditAvailableCents: result.data.creditAvailable,
      };
      if (editingAccount) await updateCard(account);
      else await addAccount(account);
      reset();
      onOpenChange(false);
    } catch {
      setError("Não foi possível cadastrar a conta.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title={
        confirmRemove
          ? "Excluir cartão"
          : mode === "card"
            ? editingAccount
              ? "Editar cartão"
              : "Novo cartão manual"
            : "Nova conta"
      }
      description={
        mode === "card"
          ? "Informe o limite do cartão e, se houver, a conta vinculada."
          : "Cadastre uma conta para acompanhar seu saldo."
      }
    >
      {confirmRemove ? (
        <div className="space-y-4">
          <p>
            Remover o cartão <strong>{editingAccount?.name}</strong>? As
            transações serão preservadas.
            {editingAccount?.hasLinkedAccount !== false &&
              " A conta vinculada também será mantida."}
          </p>
          {error && <ErrorText message={error} />}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setConfirmRemove(false)}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={async () => {
                if (!editingAccount) return;
                setBusy(true);
                setError("");
                try {
                  await removeCard(editingAccount);
                  onOpenChange(false);
                } catch {
                  setError("Não foi possível remover o cartão.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Excluir cartão
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <label className="label" htmlFor="account-name">
              {mode === "card" ? "Nome do cartão" : "Nome da conta"}
            </label>
            <input
              id="account-name"
              className="input"
              required
              {...register("name")}
            />
          </div>
          <div>
            <label className="label" htmlFor="account-bank">
              Instituição
            </label>
            {mode === "card" ? (
              <select
                id="account-bank"
                className="input"
                required
                {...register("institution")}
              >
                <option value="">Selecione</option>
                {cardInstitutions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="account-bank"
                className="input"
                required
                {...register("institution")}
              />
            )}
          </div>
          {mode === "card" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("hasLinkedAccount")} />
              Este cartão também tem uma conta vinculada
            </label>
          )}
          {(hasLinkedAccount || mode === "account") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="account-kind">
                  Tipo
                </label>
                <select
                  id="account-kind"
                  className="input"
                  {...register("kind")}
                >
                  {Object.entries(accountKinds).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="account-balance">
                  {mode === "card"
                    ? "Saldo da conta vinculada (R$)"
                    : "Saldo inicial (R$)"}
                </label>
                <input
                  id="account-balance"
                  className="input"
                  inputMode="decimal"
                  required
                  {...register("openingBalance")}
                />
              </div>
            </div>
          )}
          {mode === "card" && selectedInstitution && (
            <div className="card-form-preview">
              <PortraitBankCard
                account={{
                  id: editingAccount?.id ?? "preview",
                  name: cardName || "Seu cartão",
                  institution: selectedInstitution.name,
                  institutionId: selectedInstitution.id,
                  kind: "checking",
                  openingBalanceCents: 0,
                  color: "#7a3e2b",
                  active: true,
                }}
              />
            </div>
          )}
          {mode === "account" && (
            <div>
              <label className="label" htmlFor="account-color">
                Cor
              </label>
              <input
                id="account-color"
                type="color"
                className="h-10 w-16 cursor-pointer"
                {...register("color")}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="account-credit-limit">
                Limite de crédito (R$)
              </label>
              <input
                id="account-credit-limit"
                className="input"
                inputMode="decimal"
                placeholder={mode === "card" ? "Obrigatório" : "Opcional"}
                {...register("creditLimit")}
              />
            </div>
            <div>
              <label className="label" htmlFor="account-credit-available">
                Crédito disponível (R$)
              </label>
              <input
                id="account-credit-available"
                className="input"
                inputMode="decimal"
                placeholder={mode === "card" ? "Obrigatório" : "Opcional"}
                {...register("creditAvailable")}
              />
            </div>
          </div>
          {error && <ErrorText message={error} />}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy
              ? "Salvando…"
              : mode === "card"
                ? "Salvar cartão"
                : "Salvar conta"}
          </button>
          {editingAccount && (
            <div className="border-t pt-4">
              <button
                type="button"
                className="btn btn-outline w-full"
                onClick={() => setConfirmRemove(true)}
              >
                Remover cartão
              </button>
            </div>
          )}
        </form>
      )}
    </DialogFrame>
  );
}
export function BenefitDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addBenefit } = useApp();
  const { register, handleSubmit, reset } = useForm<BenefitFields>({
    defaultValues: {
      kind: "va",
      openingBalance: "0",
      monthlyCredit: "0",
      creditDay: 5,
    },
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(raw: BenefitFields) {
    setError("");
    const result = benefitSchema.safeParse(raw);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      await addBenefit({
        id: crypto.randomUUID(),
        name: result.data.name,
        company: result.data.company,
        kind: result.data.kind,
        openingBalanceCents: result.data.openingBalance,
        monthlyCreditCents: result.data.monthlyCredit,
        creditDay: result.data.creditDay,
        active: true,
      });
      reset();
      onOpenChange(false);
    } catch {
      setError("Não foi possível cadastrar o benefício.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Novo benefício"
      description="Benefícios aparecem separados do dinheiro livre."
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label className="label" htmlFor="benefit-name">
            Nome
          </label>
          <input
            id="benefit-name"
            className="input"
            required
            {...register("name")}
          />
        </div>
        <div>
          <label className="label" htmlFor="benefit-company">
            Empresa
          </label>
          <input
            id="benefit-company"
            className="input"
            required
            {...register("company")}
          />
        </div>
        <div>
          <label className="label" htmlFor="benefit-kind">
            Tipo
          </label>
          <select id="benefit-kind" className="input" {...register("kind")}>
            {Object.entries(benefitKinds).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="benefit-balance">
              Saldo atual (R$)
            </label>
            <input
              id="benefit-balance"
              className="input"
              inputMode="decimal"
              required
              {...register("openingBalance")}
            />
          </div>
          <div>
            <label className="label" htmlFor="benefit-credit">
              Crédito mensal (R$)
            </label>
            <input
              id="benefit-credit"
              className="input"
              inputMode="decimal"
              required
              {...register("monthlyCredit")}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="benefit-day">
            Dia esperado do crédito
          </label>
          <input
            id="benefit-day"
            className="input"
            type="number"
            min="1"
            max="28"
            required
            {...register("creditDay", { valueAsNumber: true })}
          />
        </div>
        {error && <ErrorText message={error} />}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Salvando…" : "Salvar benefício"}
        </button>
      </form>
    </DialogFrame>
  );
}
export function TransactionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, addTransaction } = useApp();
  const { register, handleSubmit, reset } = useForm<TransactionFields>({
    defaultValues: {
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
      category: "Alimentação",
      source: "",
    },
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(raw: TransactionFields) {
    setError("");
    const [sourceKind, sourceId] = raw.source.split(":");
    const result = transactionSchema.safeParse({
      ...raw,
      sourceKind,
      sourceId,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (
      (sourceKind === "account" &&
        !data.accounts.some((item) => item.id === sourceId)) ||
      (sourceKind === "benefit" &&
        !data.benefits.some((item) => item.id === sourceId))
    ) {
      setError("Selecione uma origem válida.");
      return;
    }
    setBusy(true);
    try {
      await addTransaction({
        id: crypto.randomUUID(),
        description: result.data.description,
        amountCents: result.data.amount,
        type: result.data.type,
        date: result.data.date,
        category: result.data.category,
        accountId: sourceKind === "account" ? sourceId : null,
        benefitId: sourceKind === "benefit" ? sourceId : null,
        createdAt: new Date().toISOString(),
      });
      reset();
      onOpenChange(false);
    } catch {
      setError("Não foi possível salvar a transação.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Nova transação"
      description="Registre uma entrada ou saída."
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="label">
            <input type="radio" value="expense" {...register("type")} /> Despesa
          </label>
          <label className="label">
            <input type="radio" value="income" {...register("type")} /> Receita
          </label>
        </div>
        <div>
          <label className="label" htmlFor="tx-description">
            Descrição
          </label>
          <input
            id="tx-description"
            className="input"
            required
            {...register("description")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="tx-amount">
              Valor (R$)
            </label>
            <input
              id="tx-amount"
              className="input"
              inputMode="decimal"
              required
              {...register("amount")}
            />
          </div>
          <div>
            <label className="label" htmlFor="tx-date">
              Data
            </label>
            <input
              id="tx-date"
              className="input"
              type="date"
              required
              {...register("date")}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="tx-category">
            Categoria
          </label>
          <select id="tx-category" className="input" {...register("category")}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="tx-source">
            Conta ou benefício
          </label>
          <select
            id="tx-source"
            className="input"
            required
            {...register("source")}
          >
            <option value="">Selecione</option>
            <optgroup label="Contas">
              {data.accounts
                .filter((item) => item.active)
                .map((item) => (
                  <option key={item.id} value={`account:${item.id}`}>
                    {item.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Benefícios">
              {data.benefits
                .filter((item) => item.active)
                .map((item) => (
                  <option key={item.id} value={`benefit:${item.id}`}>
                    {item.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
        {!data.accounts.length && !data.benefits.length && (
          <p className="muted text-sm">
            Cadastre uma conta ou benefício antes de lançar transações.
          </p>
        )}
        {error && <ErrorText message={error} />}
        <button
          className="btn btn-primary w-full"
          disabled={busy || (!data.accounts.length && !data.benefits.length)}
        >
          {busy ? "Salvando…" : "Salvar transação"}
        </button>
      </form>
    </DialogFrame>
  );
}
