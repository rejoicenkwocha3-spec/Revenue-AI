import Image from "next/image";

interface Props {
  size?: number;
  className?: string;
}

export default function SearchSproutLogo({ size = 36, className }: Props) {
  return (
    <Image
      src="/searchsprout-logo.jpg"
      alt="SearchSprout"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: "22%", objectFit: "cover" }}
    />
  );
}
