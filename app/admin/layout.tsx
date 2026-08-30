"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import { AdminContext, TypeAdmin } from "@/lib/adminContext";
import type { ReactNode } from "react";

const LIENS_PRINCIPAL = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/entreprises", label: "Entreprises" },
  { href: "/admin/commerciaux", label: "Commerciaux" },
  { href: "/admin/rattachements", label: "Rattachements" },
  { href: "/admin/missions", label: "Missions" },
];

const LIENS_GESTION_COMPLETE = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/commerciaux", label: "Commerciaux" },
  { href: "/admin/missions", label: "Missions (Gestion complète)" },
];

const LIENS_MISE_A_DISPOSITION = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/rattachements", label: "Rattachements (Mise à disposition)" },
];

const LABEL_TYPE_ADMIN: Record<TypeAdmin, string> = {
  principal: "Admin principal",
  gestion_complete: "Admin — Gestion complète",
  mise_a_disposition: "Admin — Mise à disposition",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(false);
  const [autorise, setAutorise] = useState(false);
  const [typeAdmin, setTypeAdmin] = useState<TypeAdmin>("principal");
  const router = useRouter();

  useEffect(() => {
    async function verifier() {
      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { router.push("/login"); return; }

      const { data: profil } = await supabase.from("profils").select("role, type_admin").eq("id", session.session.user.id).single();
      if (profil?.role !== "admin") { router.push("/login"); return; }

      setTypeAdmin((profil.type_admin as TypeAdmin) ?? "principal");
      setAutorise(true);
      setPret(true);
    }
    verifier();
  }, [router]);

  if (!pret) return <div className="min-h-screen flex items-center justify-center text-sm text-ardoise/50">Vérification…</div>;
  if (!autorise) return null;

  const liens = typeAdmin === "gestion_complete" ? LIENS_GESTION_COMPLETE
    : typeAdmin === "mise_a_disposition" ? LIENS_MISE_A_DISPOSITION
    : LIENS_PRINCIPAL;

  return (
    <AdminContext.Provider value={typeAdmin}>
      <div className="flex min-h-screen">
        <aside className="w-64 shrink-0 bg-encre text-white flex flex-col justify-between">
          <div>
            <div className="px-6 py-8">
              <img src="/logo.png" alt="Voom Impulse" className="h-8" />
              <p className="text-xs text-white/50 mt-2">{LABEL_TYPE_ADMIN[typeAdmin]}</p>
            </div>
            <nav className="mt-2 flex flex-col">
              {liens.map((lien) => (
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
    </AdminContext.Provider>
  );
}
