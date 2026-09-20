import type { SVGProps } from "react";

/** Lucide-style stroked icons, inlined so there's no icon-font dependency. */

const paths: Record<string, string> = {
  arrowDownLeft: "M17 7 7 17M17 17H7V7",
  arrowUpRight: "M7 17 17 7M7 7h10v10",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  external: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  check: "M20 6 9 17l-5-5",
  copy: "M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2Z M5 15H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1",
  chevronDown: "m6 9 6 6 6-6",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  wallet: "M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M21 12h-6a2 2 0 0 0 0 4h6v-4Z",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  alertTriangle:
    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z M12 9v4 M12 17h.01",
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: keyof typeof paths;
  size?: number;
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}

/** Brand glyphs (filled, single-color). */
export function BrandIcon({ name, size = 18 }: { name: "discord" | "telegram" | "google"; size?: number }) {
  if (name === "discord") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.369A19.79 19.79 0 0 0 16.885 3c-.146.264-.32.62-.439.9a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.444-.9A19.74 19.74 0 0 0 3.677 4.37C.533 9.05-.32 13.58.106 18.057a19.9 19.9 0 0 0 6.075 3.077c.487-.667.921-1.376 1.293-2.12a12.9 12.9 0 0 1-2.037-.978c.171-.126.338-.257.5-.393a14.2 14.2 0 0 0 12.126 0c.164.14.331.271.5.393-.65.383-1.334.71-2.04.98.372.742.805 1.45 1.292 2.118a19.86 19.86 0 0 0 6.078-3.077c.5-5.177-.838-9.673-3.51-13.69ZM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.42 0-1.332.955-2.42 2.157-2.42 1.21 0 2.176 1.098 2.157 2.42 0 1.334-.955 2.42-2.157 2.42Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.332.955-2.42 2.157-2.42 1.21 0 2.176 1.098 2.157 2.42 0 1.334-.946 2.42-2.157 2.42Z" />
      </svg>
    );
  }
  if (name === "telegram") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21.94 4.7 18.9 19.06c-.23 1.01-.83 1.26-1.68.79l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73L18.6 5.9c.37-.33-.08-.51-.58-.18L5.7 13.6l-4.6-1.44c-1-.31-1.02-1 .21-1.48L20.6 3.25c.83-.31 1.56.2 1.34 1.45Z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.39Z" />
      <path d="M12 24c3.1 0 5.7-1.03 7.6-2.8l-3.72-2.9c-1.03.7-2.35 1.1-3.88 1.1-2.98 0-5.5-2.02-6.4-4.73H1.75v2.98A11.98 11.98 0 0 0 12 24Z" />
      <path d="M5.6 14.28a7.2 7.2 0 0 1 0-4.56V6.74H1.75a12 12 0 0 0 0 10.52l3.85-2.98Z" />
      <path d="M12 4.74c1.68 0 3.2.58 4.4 1.72l3.3-3.3C17.7 1.24 15.1.2 12 .2A11.98 11.98 0 0 0 1.75 6.74l3.85 2.98C6.5 6.76 9.02 4.74 12 4.74Z" />
    </svg>
  );
}
