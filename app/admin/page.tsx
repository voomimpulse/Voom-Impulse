"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { useTypeAdmin } from "@/lib/adminContext";
import { Facture, LABEL_STATUT_FACTURE } from "@/lib/types";

interface Stats {
  nbCommerciaux: number;
  nbEntreprises: number;
  nbMissionsActives: number;
  facturesImpayees: Facture[];
  revenuService1: number;
  revenuService2: number;
}

interface LigneSuivi {
  nom: string;
  entreprise: string;
  activation: any;
}

function Carte({ label, valeur, note }: { label: string; valeur: string; note?: string }) {
  return (
    <div className="bg-white border border-ardoise/10 rounded-sm p-6">
      <p className="text-xs uppercase tracking-wide text-ardoise/60">{label}</p>
      <p className="chiffre font-display text-3xl mt-2 text-encre">{valeur}</p>
      {note && <p className="text-xs text-ardoise/50 mt-1">{note}</p>}
    </div>
  );
}

export default function TableauDeBord() {
  const typeAdmin = useTypeAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [suivi, setSuivi] = useState<LigneSuivi[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const supabase = getSupabase();
      const aujourdhui = new Date().toISOString().slice(0, 10);

      let requeteMissions = supabase
        .from("missions")
        .select("id, latitude, service, commerciaux(nom), entreprises(nom)")
        .not("latitude", "is", null)
        .not("commercial_id", "is", null);
      if (typeAdmin === "gestion_complete") requeteMissions = requeteMissions.eq("service", "service_2_gestion_complete");
      if (typeAdmin === "mise_a_disposition") requeteMissions = requeteMissions.eq("service", "service_1_mise_a_disposition");
      const { data: missionsAvecZone } = await requeteMissions;

      if (missionsAvecZone && missionsAvecZone.length > 0) {
        const ids = missionsAvecZone.map((m: any) => m.id);
        const { data: activations } = await supabase.from("activations").select("mission_id, statut, heure_activation").in("mission_id", ids).eq("date_jour", aujourdhui);
        const activationsParMission: Record<string, any> = {};
        (activations ?? []).forEach((a: any) => { activationsParMission[a.mission_id] = a; });
        setSuivi(missionsAvecZone.map((m: any) => ({
          nom: m.commerciaux?.nom ?? "—",
          entreprise: m.entreprises?.nom ?? "—",
          activation: activationsParMission[m.id] ?? null,
        })));
      } else {
        setSuivi([]);
      }

      if (typeAdmin === "principal") {
        const [commerciaux, entreprises, missions, factures] = await Promise.all([
          supabase.from("commerciaux").select("id", { count: "exact", head: true }),
          supabase.from("entreprises").select("id", { count: "exact", head: true }),
          supabase.from("missions").select("id", { count: "exact", head: true }).eq("statut", "active"),
          supabase.from("factures").select("*"),
        ]);
        const toutesFactures = (factures.data ?? []) as Facture[];
        const impayees = toutesFactures.filter((f) => f.statut !== "payee");
        const revenuService1 = toutesFactures.filter((f) => f.service === "service_1_mise_a_disposition" && f.statut === "payee").reduce((t, f) => t + Number(f.montant), 0);
        const revenuService2 = toutesFactures.filter((f) => f.service === "service_2_gestion_complete" && f.statut === "payee").reduce((t, f) => t + Number(f.montant), 0);
        setStats({
          nbCommerciaux: commerciaux.count ?? 0,
          nbEntreprises: entreprises.count ?? 0,
          nbMissionsActives: missions.count ?? 0,
          facturesImpayees: impayees,
          revenuService1,
          revenuService2,
        });
      }

      setChargement(false);
    }
    charger();
  }, [typeAdmin]);

  const actifs = suivi.filter((s) => s.activation?.statut === "actif");
  const absents = suivi.filter((s) => !s.activation || s.activation.statut !== "actif");

  return (
    <div>
      <h1 className="font-display text-2xl text-encre">Tableau de bord</h1>
      <p className="text-sm text-ardoise/60 mt-1">
        {typeAdmin === "gestion_complete" && "Suivi Service 2 — Gestion complète"}
        {typeAdmin === "mise_a_disposition" && "Suivi Service 1 — Mise à disposition"}
        {typeAdmin === "principal" && "Vue d'ensemble des deux services"}
      </p>

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      {suivi.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-ardoise/60">Suivi du jour — qui est actif</h2>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <Carte label="Actifs aujourd'hui" valeur={String(actifs.length)} />
            <Carte label="Absents / non détectés" valeur={String(absents.length)} />
          </div>
          <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
            {suivi.map((s, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="text-encre">{s.nom}</span>
                  <span className="text-ardoise/40 text-xs ml-2">{s.entreprise}</span>
                </div>
                {s.activation?.statut === "actif" ? (
                  <span className="text-xs text-vert">
                    Actif depuis {new Date(s.activation.heure_activation).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : s.activation?.statut === "hors_zone" ? (
                  <span className="text-xs text-ocre">Hors zone</span>
                ) : (
                  <span className="text-xs text-rouille">Absent</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Carte label="Commerciaux au vivier" valeur={String(stats.nbCommerciaux)} />
            <Carte label="Entreprises partenaires" valeur={String(stats.nbEntreprises)} />
            <Carte label="Missions actives" valeur={String(stats.nbMissionsActives)} />
            <Carte label="Factures impayées" valeur={String(stats.facturesImpayees.length)} note={stats.facturesImpayees.length > 0 ? "à relancer" : undefined} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Carte label="Revenu encaissé — Service 1" valeur={`${stats.revenuService1.toLocaleString("fr-FR")} FCFA`} note="Mise à disposition" />
            <Carte label="Revenu encaissé — Service 2" valeur={`${stats.revenuService2.toLocaleString("fr-FR")} FCFA`} note="Gestion complète" />
          </div>

          {stats.facturesImpayees.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg text-encre">Factures à suivre</h2>
              <div className="mt-3 divide-y divide-ardoise/10 bg-white border border-ardoise/10 rounded-sm">
                {stats.facturesImpayees.map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-encre/80">{f.montant.toLocaleString("fr-FR")} FCFA</span>
                    <span className={f.statut === "en_retard" ? "text-rouille font-medium" : "text-ocre font-medium"}>
                      {LABEL_STATUT_FACTURE[f.statut]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
