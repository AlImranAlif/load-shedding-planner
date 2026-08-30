import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PowerPlan | Load-Shedding Window Planner",
  description: "Plan print-shop work around power cuts and track generator usage."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
