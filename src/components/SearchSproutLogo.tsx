interface Props {
  size?: number;
  className?: string;
}

export default function SearchSproutLogo({ size = 36, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background rounded rect */}
      <rect width="48" height="48" rx="11" fill="#063B38" />
      {/* S-curve body */}
      <path
        d="M31 14c0 0-2-3-7-3c-4.5 0-7 2.5-7 5.5c0 3 2.5 4.5 6 5.5c3.5 1 6 2.5 6 5.5c0 3-2.5 5.5-7 5.5c-5 0-7-3-7-3"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Magnifying glass handle */}
      <line
        x1="17"
        y1="35"
        x2="13"
        y2="39"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Green leaf */}
      <path
        d="M32 11c0 0 1-5 5-6c0 0-1 5-5 6z"
        fill="#16C653"
      />
      <path
        d="M32 11c0 0 4-3 4.5-7c0 0-4 2.5-4.5 7z"
        fill="#28D765"
      />
    </svg>
  );
}
