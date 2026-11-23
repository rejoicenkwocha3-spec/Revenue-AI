interface TrueAuthorLogoProps {
  size?: number;
  variant?: "default" | "white";
  showText?: boolean;
}

export default function TrueAuthorLogo({ size = 36, variant = "default", showText = false }: TrueAuthorLogoProps) {
  const iconSize = size;

  if (showText) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <TrueAuthorIcon size={iconSize} variant={variant} />
        <span style={{
          fontFamily: "var(--font-manrope, 'Manrope', sans-serif)",
          fontWeight: 800,
          fontSize: iconSize * 0.6,
          letterSpacing: "-0.025em",
          color: variant === "white" ? "#ffffff" : "#102A43",
          lineHeight: 1,
        }}>
          TrueAuthor
        </span>
      </div>
    );
  }

  return <TrueAuthorIcon size={iconSize} variant={variant} />;
}

function TrueAuthorIcon({ size, variant }: { size: number; variant: "default" | "white" }) {
  const s = size;
  // Colors from the uploaded logo
  const navy = variant === "white" ? "#ffffff" : "#102A43";
  const blue = variant === "white" ? "rgba(255,255,255,0.85)" : "#2864DC";
  const coral = variant === "white" ? "rgba(255,255,255,0.65)" : "#FF654F";

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TrueAuthor"
    >
      {/* T — dark navy, left side */}
      {/* Horizontal bar of T */}
      <rect x="6" y="12" width="44" height="14" rx="3" fill={navy} />
      {/* Vertical stem of T */}
      <rect x="15" y="12" width="16" height="66" rx="3" fill={navy} />

      {/* A — royal blue, right side */}
      {/* Left leg of A */}
      <polygon points="52,78 68,12 76,12 60,78" fill={blue} />
      {/* Right leg of A */}
      <polygon points="68,12 76,12 93,78 85,78" fill={blue} />
      {/* Crossbar of A */}
      <rect x="62" y="48" width="20" height="10" rx="2" fill={blue} />

      {/* Coral swoosh — diagonal stripe cutting across both letters */}
      <path
        d="M8 72 Q38 44 92 28"
        stroke={coral}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
