import type { Account } from "./model";

export type BankTheme = {
  background: string;
  foreground: string;
  muted: string;
  mark: string;
  pattern: "circle" | "diagonal" | "blocks" | "cross" | "organic";
};

const themes: Record<string, BankTheme> = {
  mercado_pago: {
    background: "linear-gradient(135deg,#171d2c,#30425f)",
    foreground: "#fff",
    muted: "#d7e5ff",
    mark: "MP",
    pattern: "circle",
  },
  pluxee: {
    background: "linear-gradient(135deg,#00d86b,#00c95c)",
    foreground: "#113c2a",
    muted: "#164a31",
    mark: "pluxee",
    pattern: "cross",
  },
  caju: {
    background: "linear-gradient(135deg,#ff2954,#e82c4d)",
    foreground: "#fff",
    muted: "#ffe7eb",
    mark: "caju",
    pattern: "organic",
  },
  ifood: {
    background: "linear-gradient(135deg,#be002d,#980025)",
    foreground: "#fff",
    muted: "#ffe1e8",
    mark: "iFood",
    pattern: "circle",
  },
  sicoob: {
    background: "linear-gradient(135deg,#00a99b,#087a78)",
    foreground: "#fff",
    muted: "#dcfffa",
    mark: "Sicoob",
    pattern: "blocks",
  },
  edenred: {
    background: "linear-gradient(135deg,#ef6f82,#923391)",
    foreground: "#fff",
    muted: "#ffe8f4",
    mark: "Edenred",
    pattern: "diagonal",
  },
  flash: {
    background: "linear-gradient(135deg,#fc2688,#e81b78)",
    foreground: "#fff",
    muted: "#ffe1f0",
    mark: "flash",
    pattern: "circle",
  },
  raio: {
    background: "linear-gradient(135deg,#e95d13,#d4a317)",
    foreground: "#fff",
    muted: "#fff1d4",
    mark: "Raiô",
    pattern: "organic",
  },
  sicredi: {
    background: "linear-gradient(135deg,#073f2d,#0b5c3a)",
    foreground: "#fff",
    muted: "#d7f7e8",
    mark: "Sicredi",
    pattern: "diagonal",
  },
  alelo: {
    background: "linear-gradient(135deg,#d5df39,#acc82c)",
    foreground: "#0a5841",
    muted: "#235d3e",
    mark: "alelo",
    pattern: "circle",
  },
  ben: {
    background: "linear-gradient(135deg,#f7c900,#ec6c2d)",
    foreground: "#302137",
    muted: "#473349",
    mark: "ben",
    pattern: "organic",
  },
  swile: {
    background: "linear-gradient(135deg,#101012,#292b2e)",
    foreground: "#fff",
    muted: "#e2e2e2",
    mark: "swile",
    pattern: "circle",
  },
  nubank: {
    background: "linear-gradient(135deg,#731cc2,#4d0f8e)",
    foreground: "#fff",
    muted: "#efe0ff",
    mark: "nu",
    pattern: "circle",
  },
  caixa: {
    background: "linear-gradient(135deg,#0073bb,#159bd0)",
    foreground: "#fff",
    muted: "#e5f7ff",
    mark: "CAIXA",
    pattern: "blocks",
  },
  bradesco: {
    background: "linear-gradient(135deg,#bb092a,#910b23)",
    foreground: "#fff",
    muted: "#ffe5e9",
    mark: "Bradesco",
    pattern: "diagonal",
  },
  green_card: {
    background: "linear-gradient(135deg,#00d921,#087e39)",
    foreground: "#fff",
    muted: "#e2ffe6",
    mark: "green",
    pattern: "blocks",
  },
  banco_do_brasil: {
    background: "linear-gradient(135deg,#ffe91b,#ffcf27)",
    foreground: "#143d9a",
    muted: "#174b9a",
    mark: "BB",
    pattern: "diagonal",
  },
  itau: {
    background: "linear-gradient(135deg,#ff8b16,#ed6712)",
    foreground: "#fff",
    muted: "#fff0dc",
    mark: "Itaú",
    pattern: "circle",
  },
  santander: {
    background: "linear-gradient(135deg,#f12727,#c70f20)",
    foreground: "#fff",
    muted: "#ffe6e6",
    mark: "Santander",
    pattern: "organic",
  },
  uplivit: {
    background: "linear-gradient(135deg,#f9a000,#e68012)",
    foreground: "#153d78",
    muted: "#255188",
    mark: "Uplivit",
    pattern: "circle",
  },
  inter: {
    background: "linear-gradient(135deg,#ff8d20,#e85c12)",
    foreground: "#fff",
    muted: "#fff0df",
    mark: "inter",
    pattern: "organic",
  },
  c6: {
    background: "linear-gradient(135deg,#e7e7e6,#bfc3c4)",
    foreground: "#172021",
    muted: "#344345",
    mark: "C6",
    pattern: "diagonal",
  },
  picpay: {
    background: "linear-gradient(135deg,#16c477,#09a66b)",
    foreground: "#083b2c",
    muted: "#13543c",
    mark: "PicPay",
    pattern: "circle",
  },
};

const aliases: [RegExp, keyof typeof themes][] = [
  [/mercado\s*pago|mercadopago/i, "mercado_pago"],
  [/pluxee|sodexo/i, "pluxee"],
  [/caju/i, "caju"],
  [/i\s?food/i, "ifood"],
  [/sicoob/i, "sicoob"],
  [/edenred|ticket\s?flex/i, "edenred"],
  [/flash/i, "flash"],
  [/rai[oô]/i, "raio"],
  [/sicredi/i, "sicredi"],
  [/alelo/i, "alelo"],
  [/\bben\b/i, "ben"],
  [/swile/i, "swile"],
  [/nubank|nu\s?pagamentos|\bnu\b/i, "nubank"],
  [/caixa/i, "caixa"],
  [/bradesco/i, "bradesco"],
  [/green\s?card/i, "green_card"],
  [/banco\s?do\s?brasil|\bbb\b/i, "banco_do_brasil"],
  [/ita[uú]/i, "itau"],
  [/santander/i, "santander"],
  [/uplivit/i, "uplivit"],
  [/\binter\b/i, "inter"],
  [/\bc6\b/i, "c6"],
  [/picpay/i, "picpay"],
];

export function normalizeInstitutionName(value: string): string | null {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
  return aliases.find(([pattern]) => pattern.test(normalized))?.[1] ?? null;
}

export function institutionTheme(institution: string, name = ""): BankTheme {
  const key = normalizeInstitutionName(`${institution} ${name}`);
  return key
    ? themes[key]
    : {
        background: "linear-gradient(135deg,#176e55,#0c5942)",
        foreground: "#fff",
        muted: "#dcf4e9",
        mark: institution.trim().slice(0, 2).toUpperCase() || "VF",
        pattern: "circle",
      };
}

export function bankTheme(account: Account): BankTheme {
  return institutionTheme(account.institution, account.name);
}
