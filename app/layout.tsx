import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Voom Impulse",
  description: "Recrutement et gestion de commerciaux — mise à disposition et prospection encadrée",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-corps bg-ivoire text-encre">{children}</body>
    </html>
  );
}
