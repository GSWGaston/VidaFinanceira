"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { formatMoney } from "@/lib/money";
export function Money({
  cents,
  className = "",
}: {
  cents: number;
  className?: string;
}) {
  return <span className={className}>{formatMoney(cents)}</span>;
}
export function Percentage({ value }: { value: number }) {
  return (
    <span>
      {new Intl.NumberFormat("pt-BR", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value)}
    </span>
  );
}
export function Badge({
  children,
  color = "green",
}: {
  children: React.ReactNode;
  color?: "green" | "red" | "gray";
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${color === "green" ? "bg-[#e8f5ec] text-[#21724b]" : color === "red" ? "bg-[#faeae8] text-[#ab534e]" : "bg-background text-muted"}`}
    >
      {children}
    </span>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card flex min-h-44 flex-col items-center justify-center p-8 text-center">
      <div className="mb-3 grid size-10 place-items-center rounded-full bg-soft text-primary">
        +
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="muted mt-1 max-w-sm text-sm">{description}</p>
    </div>
  );
}
export function LoadingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="card h-36 animate-pulse bg-surface" />
      ))}
    </div>
  );
}
export function DialogFrame({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#09251f99]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[95dvh] overflow-y-auto rounded-t-[28px] bg-surface p-6 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,500px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-extrabold">
                {title}
              </Dialog.Title>
              <Dialog.Description className="muted mt-1 text-sm">
                {description ?? "Preencha os campos abaixo."}
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Fechar" className="btn btn-ghost !p-2">
              <X size={19} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
