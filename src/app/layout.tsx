import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClimateBooks: AI-Powered Climate Accounting and Sustainability Platform",
  description: "ClimateBooks helps businesses measure their carbon footprint, manage sustainability data and create meaningful climate reports with intelligent AI-powered tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
