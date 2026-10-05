import { creditLineForAccount } from "./credit";
import { balanceFor } from "./finance";
import type { Account, FinanceData } from "./model";

export function relationshipOverview(data: FinanceData, account: Account) {
  const linkedTransactions = data.transactions.filter(
    (item) => item.accountId === account.id,
  );
  const hasCredit =
    account.creditLimitCents != null ||
    account.creditAvailableCents != null ||
    account.creditUsedCents != null;
  const hasAccount = account.hasLinkedAccount !== false;
  const balanceKnown =
    account.source !== "open_finance" ||
    account.providerBalanceCents != null ||
    account.openingBalanceCents !== 0 ||
    linkedTransactions.length > 0;
  return {
    hasCredit,
    credit: hasCredit ? creditLineForAccount(account) : null,
    hasAccount,
    balanceCents:
      hasAccount && balanceKnown
        ? balanceFor(data, account.id, "account")
        : null,
    linkedTransactionsCount: hasAccount ? linkedTransactions.length : null,
  };
}
