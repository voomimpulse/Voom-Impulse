"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

export default function TableauDeBordCommercial() {
  const [pret, setPret] = useState(false);
  const [missions, setMissions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function charger() {
      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { router.push("/login"); return; }

      const { data: profil } = await supabase.from("profils").select("role, commercial_id").eq("id", session.session.user.id).single();
      if (profil?.role !== "commercial" || !profil.commercial_id) { router.push("/login"); return; }

      const { data: m } = await supabase
        .from("missions")
        .select("id, statut, service, entreprises(nom)")
        .eq("commercial_id", profil.commercial_id);
      setMissions(m ?? []);
      setPret(true);
    }
    charger();
  }, [router]);

  if (!pret) return <div className="min-h-screen flex items-center justify-center text-sm text-ardoise/50">Chargement…</div>;

  return (
    <div className="min-h-screen bg-ivoire px-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-encre">Mon espace commercial</h1>
        <button onClick={async () => { await getSupabase().auth.signOut(); router.push("/"); }} className="text-xs text-ardoise/50">
          Se déconnecter
        </button>
      </div>

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Mes missions</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {missions.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucune mission pour l'instant — vous serez contacté dès qu'une opportunité correspond à votre profil.</p>}
        {missions.map((m) => (
          <div key={m.id} className="px-4 py-3 text-sm flex justify-between">
            <span>{m.entreprises?.nom ?? "Entreprise à confirmer"}</span>
            <span className="text-ardoise/50">{m.statut}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
