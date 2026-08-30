"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import type { ReactNode } from "react";

const LIENS_NAV = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/entreprises", label: "Entreprises" },
  { href: "/admin/commerciaux", label: "Commerciaux" },
  { href: "/admin/missions", label: "Missions" },
  { href: "/admin/rattachements", label: "Rattachements" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(false);
  const [autorise, setAutorise] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function verifier() {
      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.push("/login");
        return;
      }
      const { data: profil } = await supabase.from("profils").select("role").eq("id", session.session.user.id).single();
      if (profil?.role !== "admin") {
        router.push("/login");
        return;
      }
      setAutorise(true);
      setPret(true);
    }
    verifier();
  }, [router]);

  if (!pret) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-ardoise/50">Vérification…</div>;
  }
  if (!autorise) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 bg-encre text-white flex flex-col justify-between">
        <div>
          <div className="px-6 py-8">
            <img src="/logo.png" alt="Voom Impulse" className="h-8" />
            <p className="text-xs text-white/50 mt-2">Espace Admin</p>
          </div>
          <nav className="mt-2 flex flex-col">
            {LIENS_NAV.map((lien) => (
              <a key={lien.href} href={lien.href} className="px-6 py-3 text-sm text-white/80 hover:bg-ardoise transition-colors">
                {lien.label}
              </a>
            ))}
          </nav>
        </div>
        <button
          onClick={async () => { await getSupabase().auth.signOut(); router.push("/login"); }}
          className="px-6 py-6 text-xs text-white/50 border-t border-white/10 text-left"
        >
          Se déconnecter
        </button>
      </aside>
      <main className="flex-1 px-10 py-10 bg-ivoire">{children}</main>
    </div>
  );
}
