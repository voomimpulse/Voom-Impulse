import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Voom Impulse — Espace Admin",
  description: "Pilotage des commerciaux, entreprises partenaires et facturation",
  manifest: "/manifest.json",
};

const LIENS_NAV = [
  { href: "/", label: "Tableau de bord" },
  { href: "/entreprises", label: "Entreprises" },
  { href: "/commerciaux", label: "Commerciaux" },
  { href: "/missions", label: "Missions" },
];

function MarquePulse() {
  // Signature de la marque : une ligne d'impulsion, écho du nom "Voom Impulse".
  return (
    <svg width="72" height="20" viewBox="0 0 72 20" fill="none" aria-hidden="true">
      <path
        d="M0 10 H20 L26 2 L32 18 L38 6 L42 10 H72"
        stroke="#C8963E"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-corps">
        <div className="flex min-h-screen">
          <aside className="w-64 shrink-0 bg-encre text-ivoire flex flex-col justify-between">
            <div>
              <div className="px-6 py-8">
                <MarquePulse />
                <p className="mt-3 font-display text-lg tracking-tight">Voom Impulse</p>
                <p className="text-xs text-ardoiseclair mt-1">Espace Admin</p>
              </div>
              <nav className="mt-2 flex flex-col">
                {LIENS_NAV.map((lien) => (
                  <a
                    key={lien.href}
                    href={lien.href}
                    className="px-6 py-3 text-sm text-ivoire/80 hover:bg-ardoise hover:text-ivoire transition-colors border-l-2 border-transparent hover:border-ocre"
                  >
                    {lien.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="px-6 py-6 text-xs text-ardoiseclair border-t border-ardoise">
              Service 1 — Mise à disposition
              <br />
              Service 2 — Gestion complète
            </div>
          </aside>
          <main className="flex-1 px-10 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
