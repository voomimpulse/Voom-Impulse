import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Le nuage Vercel reconstruit la page à chaque appel (page dynamique).
export const dynamic = "force-dynamic";

// Client admin (service role) : utilisé UNIQUEMENT côté serveur, à l'intérieur
// du handler (jamais au niveau module, sinon le build Vercel échoue faute de
// variables).
function adminSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const cleService = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient(url, cleService, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Pour l'instant, tous les admins voient tout (tableaux de bord séparés plus tard).
async function authentifierAdmin(request: NextRequest) {
  const jeton = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!jeton) return null;

  const admin = adminSupabase();
  const { data: resultat } = await admin.auth.getUser(jeton);
  if (!resultat?.user) return null;

  const { data: profil } = await admin
    .from("profils")
    .select("id, role")
    .eq("id", resultat.user.id)
    .maybeSingle();
  if (!profil || profil.role !== "admin") return null;
  return profil;
}

const STATUTS_VALIDES = ["nouvelle", "en_traitement", "traitee", "refusee"];

export async function GET(request: NextRequest) {
  const appelant = await authentifierAdmin(request);
  if (!appelant) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const admin = adminSupabase();

  const statut = new URL(request.url).searchParams.get("statut");
  const id = new URL(request.url).searchParams.get("id");

  // Jointures vers la fiche de l'auteur pour afficher son nom côté admin.
  let requete = admin.from("demandes").select("*, entreprises(nom), commerciaux(nom)").order("created_at", { ascending: false });
  if (statut && STATUTS_VALIDES.includes(statut)) requete = requete.eq("statut", statut);
  if (id) requete = requete.eq("id", id);

  const { data: demandes, error } = await requete;
  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  return NextResponse.json({ demandes: demandes ?? [] });
}

export async function PATCH(request: NextRequest) {
  const appelant = await authentifierAdmin(request);
  if (!appelant) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const admin = adminSupabase();

  const { id, statut, note_admin } = await request.json().catch(() => ({}) as any);
  if (typeof id !== "string") {
    return NextResponse.json({ erreur: "Demande manquante" }, { status: 400 });
  }

  const mise_a_jour: Record<string, unknown> = {};
  if (typeof statut === "string" && STATUTS_VALIDES.includes(statut)) {
    mise_a_jour.statut = statut;
    if (statut === "traitee" || statut === "refusee") mise_a_jour.traitee_at = new Date().toISOString();
  }
  if (typeof note_admin === "string") mise_a_jour.note_admin = note_admin;
  if (Object.keys(mise_a_jour).length === 0) {
    return NextResponse.json({ erreur: "Rien à mettre à jour" }, { status: 400 });
  }

  const { error } = await admin.from("demandes").update(mise_a_jour).eq("id", id);
  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
