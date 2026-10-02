import Image from "next/image";

export function Brand({
  compact = false,
  auth = false,
}: {
  compact?: boolean;
  auth?: boolean;
}) {
  return (
    <span
      className={`brand-lockup ${compact ? "brand-compact" : ""} ${auth ? "brand-auth" : ""}`}
    >
      <Image
        className="brand-wordmark"
        src="/Logomarca.svg"
        width={1632}
        height={304}
        alt="Ordinnum"
        priority
      />
      <span className="brand-symbol-text" aria-label="Ordinnum">
        <Image src="/Símbolo.svg" width={562} height={304} alt="" priority />
        <span aria-hidden="true">Ordinnum</span>
      </span>
    </span>
  );
}
