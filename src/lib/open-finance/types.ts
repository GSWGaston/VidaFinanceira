export type ProviderItem = {
  id: string;
  clientUserId: string | null;
  status: string;
  executionStatus: string | null;
  connector: {
    id: number;
    name: string;
    imageUrl?: string | null;
    isSandbox?: boolean;
  };
  error?: { code?: string } | null;
};
export type ProviderAccount = {
  id: string;
  itemId: string;
  type: string;
  subtype?: string | null;
  name: string;
  marketingName?: string | null;
  balance: number;
  currencyCode?: string | null;
};
export type ProviderTransaction = {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  category?: string | null;
  currencyCode?: string | null;
  status?: string | null;
};
export interface OpenFinanceProvider {
  createConnectToken(userId: string, itemId?: string): Promise<string>;
  getItem(itemId: string): Promise<ProviderItem>;
  getAccounts(itemId: string): Promise<ProviderAccount[]>;
  getTransactions(
    accountId: string,
    filter: { dateFrom?: string; createdAtFrom?: string; ids?: string[] },
  ): Promise<ProviderTransaction[]>;
  disconnectConnection(itemId: string): Promise<void>;
}
