import { describe, expect, it } from "vitest";
import { institutionTheme, normalizeInstitutionName } from "./bank-themes";

describe("institution themes", () => {
  it.each([
    ["Banco Inter S.A.", "inter"],
    ["Nu Pagamentos", "nubank"],
    ["Banco do Brasil", "banco_do_brasil"],
    ["Itaú", "itau"],
    ["iFood Benefícios", "ifood"],
    ["Raiô", "raio"],
    ["C6 Bank", "c6"],
    ["Green Card", "green_card"],
    ["Mercado Pago", "mercado_pago"],
    ["Pluxee", "pluxee"],
    ["Caju", "caju"],
    ["Sicoob", "sicoob"],
    ["Edenred", "edenred"],
    ["Flash Benefícios", "flash"],
    ["Sicredi", "sicredi"],
    ["Alelo", "alelo"],
    ["Ben Benefícios", "ben"],
    ["Swile", "swile"],
    ["Caixa", "caixa"],
    ["Bradesco", "bradesco"],
    ["Santander", "santander"],
    ["Uplivit Brasil", "uplivit"],
    ["PicPay", "picpay"],
  ])("recognizes %s", (institution, expected) => {
    expect(normalizeInstitutionName(institution)).toBe(expected);
  });

  it("uses a readable Ordinnum fallback for an unknown institution", () => {
    const theme = institutionTheme("Banco Novo");
    expect(theme.background).toContain("#7a3e2b");
    expect(theme.foreground).toBe("#fff");
    expect(theme.mark).toBe("BA");
  });
});
