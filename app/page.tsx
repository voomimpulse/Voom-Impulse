"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Facture, LABEL_STATUT_FACTURE } from "@/lib/types";

interface Stats {
  nbCommerciaux: number;
  nbEntreprises: number;
  nbMissionsActives: number;
  facturesImpayees: Facture[];
  revenuService1: number;
  revenuService2: number;
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const [commerciaux, entreprises, missions, factures] = await Promise.all([
        supabase.from("commerciaux").select("id", { count: "exact", head: true }),
        supabase.from("entreprises").select("id", { count: "exact", head: true }),
        supabase.from("missions").select("id", { count: "exact", head: true }).eq("statut", "active"),
        supabase.from("factures").select("*"),
      ]);

      const toutesFactures = (factures.data ?? []) as Facture[];
      const impayees = toutesFactures.filter((f) => f.statut !== "payee");
      const revenuService1 = toutesFactures
        .filter((f) => f.service === "service_1_mise_a_disposition" && f.statut === "payee")
        .reduce((total, f) => total + Number(f.montant), 0);
      const revenuService2 = toutesFactures
        .filter((f) => f.service === "service_2_gestion_complete" && f.statut === "payee")
        .reduce((total, f) => total + Number(f.montant), 0);

      setStats({
        nbCommerciaux: commerciaux.count ?? 0,
        nbEntreprises: entreprises.count ?? 0,
        nbMissionsActives: missions.count ?? 0,
        facturesImpayees: impayees,
        revenuService1,
        revenuService2,
      });
      setChargement(false);
    }
    charger();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-encre">Tableau de bord</h1>
      <p className="text-sm text-ardoise/60 mt-1">Vue d'ensemble des deux services</p>

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Carte label="Commerciaux au vivier" valeur={String(stats.nbCommerciaux)} />
            <Carte label="Entreprises partenaires" valeur={String(stats.nbEntreprises)} />
            <Carte label="Missions actives" valeur={String(stats.nbMissionsActives)} />
            <Carte
              label="Factures impayées"
              valeur={String(stats.facturesImpayees.length)}
              note={stats.facturesImpayees.length > 0 ? "à relancer" : undefined}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Carte
              label="Revenu encaissé — Service 1"
              valeur={`${stats.revenuService1.toLocaleString("fr-FR")} FCFA`}
              note="Mise à disposition, 15 000 FCFA/mois/commercial"
            />
            <Carte
              label="Revenu encaissé — Service 2"
              valeur={`${stats.revenuService2.toLocaleString("fr-FR")} FCFA`}
              note="Commission sur marge, gestion complète"
            />
          </div>

          {stats.facturesImpayees.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg text-encre">Factures à suivre</h2>
              <div className="mt-3 divide-y divide-ardoise/10 bg-white border border-ardoise/10 rounded-sm">
                {stats.facturesImpayees.map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-encre/80">{f.montant.toLocaleString("fr-FR")} FCFA</span>
                    <span
                      className={
                        f.statut === "en_retard"
                          ? "text-rouille font-medium"
                          : "text-ocre font-medium"
                      }
                    >
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
