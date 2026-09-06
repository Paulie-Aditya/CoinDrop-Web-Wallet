import logoUrl from "../assets/coindrop-logo.webp";

/** The CoinDrop logo mark — the coin + drop, used exactly as supplied. */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logoUrl}
      width={size}
      height={size}
      alt=""
      className={className}
      draggable={false}
    />
  );
}
