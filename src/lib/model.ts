export type Account = {
  id: string;
  name: string;
  institution: string;
  kind: "checking" | "savings" | "digital" | "cash" | "investment" | "other";
  openingBalanceCents: number;
  color: string;
  active: boolean;
  source?: "manual" | "open_finance" | "import";
  connectionId?: string | null;
  externalId?: string | null;
  providerBalanceCents?: number | null;
  lastSyncedAt?: string | null;
};
export type FinancialConnection = {
  id: string;
  providerItemId: string;
  institutionName: string;
  isSandbox: boolean;
  status:
    | "connected"
    | "syncing"
    | "waiting_user_input"
    | "waiting_user_action"
    | "error"
    | "disconnected";
  lastSyncAt: string | null;
};
export type Benefit = {
  id: string;
  name: string;
  company: string;
  kind: "va" | "vr" | "mobility" | "fuel" | "other";
  openingBalanceCents: number;
  monthlyCreditCents: number;
  creditDay: number | null;
  active: boolean;
};
export type Transaction = {
  id: string;
  description: string;
  amountCents: number;
  type: "income" | "expense";
  date: string;
  category: string;
  accountId: string | null;
  benefitId: string | null;
  createdAt: string;
  source?: "manual" | "open_finance" | "csv" | "ofx" | "xlsx" | "pdf";
  possibleDuplicate?: boolean;
};
export type FinanceData = {
  accounts: Account[];
  benefits: Benefit[];
  transactions: Transaction[];
  connections?: FinancialConnection[];
};
export const categories = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Automóvel",
  "Saúde",
  "Educação",
  "Lazer",
  "Compras",
  "Assinaturas",
  "Serviços",
  "Investimentos",
  "Salário",
  "Outros",
] as const;
export const accountKinds: Record<Account["kind"], string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  digital: "Conta digital",
  cash: "Dinheiro",
  investment: "Investimentos",
  other: "Outra",
};
export const benefitKinds: Record<Benefit["kind"], string> = {
  va: "Vale Alimentação",
  vr: "Vale Refeição",
  mobility: "Vale Mobilidade",
  fuel: "Vale Combustível",
  other: "Outro",
};
