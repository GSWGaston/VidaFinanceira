"use client";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "outline" | "ghost" }) {
  return <button className={`btn btn-${variant} ${className}`} {...props} />;
}
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`input ${className}`} {...props} />;
}
export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`input ${className}`} {...props} />;
}
export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`card ${className}`} {...props} />;
}
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-soft ${className}`}
    />
  );
}
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)]" />
        <Dialog.Content className="safe-bottom fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-auto rounded-t-[28px] bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-xl font-extrabold">
              {title}
            </Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="btn btn-ghost !p-2">
              <X size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">{title}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Dropdown({
  trigger,
  items,
}: {
  trigger: ReactNode;
  items: { label: string; onSelect: () => void }[];
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          className="z-50 min-w-44 rounded-xl border border-border bg-surface p-1 shadow-xl"
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              onSelect={item.onSelect}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm outline-none focus:bg-soft"
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
export function Tabs({
  items,
  defaultValue,
}: {
  items: { value: string; label: string; content: ReactNode }[];
  defaultValue: string;
}) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue}>
      <TabsPrimitive.List className="flex gap-1 rounded-xl bg-background p-1">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className="min-h-10 flex-1 rounded-lg px-3 text-sm font-bold text-muted data-[state=active]:bg-surface data-[state=active]:text-accent-text data-[state=active]:ring-1 data-[state=active]:ring-accent data-[state=active]:shadow-sm"
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className="mt-4"
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
export function Tooltip({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{trigger}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={5}
            className="z-50 rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg"
          >
            {children}
            <TooltipPrimitive.Arrow className="fill-foreground" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
