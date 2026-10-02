import { TransactionsPage } from "@/components/finance-pages";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialType = type === "expense" ? "expense" : "all";
  return <TransactionsPage key={initialType} initialType={initialType} />;
}
