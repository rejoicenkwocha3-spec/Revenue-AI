"use client";

interface ClimateBookLogoProps {
  size?: number;
  className?: string;
}

export default function ClimateBookLogo({ size = 40, className = "" }: ClimateBookLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ClimateBooks"
    >
      {/* Rising gold sun arc */}
      <path
        d="M40 29 A17 17 0 0 1 57 46 L23 46 A17 17 0 0 1 40 29Z"
        fill="#D9AD55"
      />
      {/* Layer 1 — top ledger page */}
      <path
        d="M16 48 Q40 42 64 48 L58 56 Q40 50 22 56Z"
        fill="#174D36"
      />
      {/* Layer 2 */}
      <path
        d="M18 57 Q40 51 62 57 L56 65 Q40 59 24 65Z"
        fill="#0B352B"
      />
      {/* Layer 3 — base */}
      <path
        d="M20 66 Q40 61 60 66 L54 73 Q40 69 26 73Z"
        fill="#063024"
      />
      {/* Subtle page line on layer 1 */}
      <line x1="27" y1="51" x2="53" y2="48" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      {/* Subtle page line on layer 2 */}
      <line x1="27" y1="60" x2="55" y2="57" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
    </svg>
  );
}
