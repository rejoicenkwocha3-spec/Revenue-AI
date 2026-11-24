interface TrueAuthorLogoProps {
  size?: number;
  variant?: "default" | "white";
  showText?: boolean;
}

export default function TrueAuthorLogo({ size = 36, variant = "default", showText = false }: TrueAuthorLogoProps) {
  if (showText) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LogoMark size={size} variant={variant} />
        <span style={{
          fontFamily: "var(--font-manrope, 'Manrope', sans-serif)",
          fontWeight: 800,
          fontSize: size * 0.58,
          letterSpacing: "-0.02em",
          color: variant === "white" ? "#ffffff" : "#102A43",
          lineHeight: 1,
        }}>
          TrueAuthor
        </span>
      </div>
    );
  }
  return <LogoMark size={size} variant={variant} />;
}

function LogoMark({ size, variant }: { size: number; variant: "default" | "white" }) {
  const navy  = variant === "white" ? "#ffffff"             : "#102A43";
  const blue  = variant === "white" ? "rgba(255,255,255,0.8)" : "#2563EB";
  const coral = variant === "white" ? "rgba(255,255,255,0.6)" : "#E8502A";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TrueAuthor"
    >
      {/* ── T (navy) ─────────────────────────────── */}
      {/* Horizontal crossbar */}
      <rect x="4" y="8" width="52" height="18" rx="3" fill={navy} />
      {/* Vertical stem */}
      <rect x="14" y="8" width="18" height="76" rx="3" fill={navy} />

      {/* ── A (royal blue) ───────────────────────── */}
      {/* Left leg */}
      <polygon points="46,86 66,8 76,8 56,86" fill={blue} />
      {/* Right leg */}
      <polygon points="66,8 76,8 96,86 86,86" fill={blue} />
      {/* Crossbar of A */}
      <rect x="57" y="50" width="22" height="10" rx="2" fill={blue} />

      {/* ── Coral swoosh ─────────────────────────── */}
      <path
        d="M4,76 C30,58 60,42 97,24"
        stroke={coral}
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
