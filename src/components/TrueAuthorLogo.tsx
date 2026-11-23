"use client";

interface TrueAuthorLogoProps {
  size?: number;
  variant?: "default" | "white";
}

export default function TrueAuthorLogo({ size = 36, variant = "default" }: TrueAuthorLogoProps) {
  const primary = variant === "white" ? "#FFFFFF" : "#155EEF";
  const navy = variant === "white" ? "#FFFFFF" : "#102A43";
  const coral = variant === "white" ? "rgba(255,255,255,0.7)" : "#FF654F";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document base */}
      <rect x="8" y="4" width="28" height="36" rx="3" fill={navy} />
      <rect x="10" y="6" width="24" height="32" rx="2" fill="white" opacity="0.08" />

      {/* T and A letterforms cut into document */}
      {/* Horizontal bar of T */}
      <rect x="12" y="12" width="14" height="3.5" rx="1.5" fill={primary} />
      {/* Vertical stem of T */}
      <rect x="17.5" y="15.5" width="3.5" height="8" rx="1.5" fill={primary} />

      {/* A shape */}
      <path
        d="M28 32 L33 20 L38 32"
        stroke={coral}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="30" y1="27.5" x2="36" y2="27.5" stroke={coral} strokeWidth="2.5" strokeLinecap="round" />

      {/* Checkmark verification badge */}
      <circle cx="38" cy="10" r="8" fill={primary} />
      <path
        d="M34.5 10L37 12.5L41.5 7.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
