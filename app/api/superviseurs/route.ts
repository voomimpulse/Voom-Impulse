import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Client admin (service role) : utilisé UNIQUEMENT côté serveur pour créer et
// supprimer des comptes superviseur, et pour lire les profils sans être bloqué
// par la RLS. La clé reste dans les variables secrètes de Vercel.
function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const cleService = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient(url, cleService, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Vérifie le JWT de l'appelant et renvoie son profil (via la table profils).
async function authentifier(request: NextRequest) {
  const jeton = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!jeton) return null;

  const admin = adminSupabase();
  const { data: utilisateur } = await admin.auth.getUser(jeton);
  if (!utilisateur?.user) return null;

  const { data: profil } = await admin
    .from("profils")
    .select("id, role, entreprise_id")
    .eq("id", utilisateur.user.id)
    .maybeSingle();
  if (!profil || profil.role !== "entreprise" || !profil.entreprise_id) return null;
  return profil;
}

export async function GET(request: NextRequest) {
  const appelant = await authentifier(request);
  if (!appelant) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  const admin = adminSupabase();
  const { data: superviseurs, error } = await admin
    .from("profils")
    .select("id, nom")
    .eq("role", "superviseur")
    .eq("entreprise_id", appelant.entreprise_id);

  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  const liste = [];
  for (const s of superviseurs ?? []) {
    const { data: utilisateur } = await admin.auth.admin.getUserById(s.id);
    liste.push({ id: s.id, nom: s.nom ?? null, email: utilisateur?.user?.email ?? "" });
  }

  return NextResponse.json({ superviseurs: liste });
}

export async function POST(request: NextRequest) {
  const appelant = await authentifier(request);
  if (!appelant) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  const { nom, email, motDePasse } = await request.json();
  if (!nom || !email || !motDePasse || String(motDePasse).length < 8) {
    return NextResponse.json(
      { erreur: "Nom, email et mot de passe de 8 caractères minimum requis" },
      { status: 400 }
    );
  }

  const admin = adminSupabase();
  const { data: cree, error: erreurCreation } = await admin.auth.admin.createUser({
    email: String(email).trim().toLowerCase(),
    password: String(motDePasse),
    email_confirm: true,
    user_metadata: { nom: String(nom).trim() },
  });

  if (erreurCreation || !cree?.user) {
    const message =
      erreurCreation?.message ?? "Création impossible";
    const convivial = message.includes("already registered") || message.includes("already been registered")
      ? "Cet email a déjà un compte."
      : message;
    return NextResponse.json({ erreur: convivial }, { status: 400 });
  }

  const { error: erreurProfil } = await admin.from("profils").insert({
    id: cree.user.id,
    role: "superviseur",
    entreprise_id: appelant.entreprise_id,
    nom: String(nom).trim(),
  });

  if (erreurProfil) {
    // On ne laisse pas un compte auth sans profil derrière lui.
    await admin.auth.admin.deleteUser(cree.user.id);
    return NextResponse.json(
      { erreur: "Profil impossible : " + erreurProfil.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: cree.user.id, nom: String(nom).trim(), email });
}

export async function DELETE(request: NextRequest) {
  const appelant = await authentifier(request);
  if (!appelant) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ erreur: "Superviseur manquant" }, { status: 400 });
  }

  const admin = adminSupabase();
  // On ne supprime un compte que s'il s'agit bien d'un superviseur de
  // l'entreprise de l'appelant — jamais celui d'une autre entreprise.
  const { data: cible } = await admin
    .from("profils")
    .select("id, role, entreprise_id")
    .eq("id", id)
    .maybeSingle();

  if (!cible || cible.role !== "superviseur" || cible.entreprise_id !== appelant.entreprise_id) {
    return NextResponse.json({ erreur: "Superviseur introuvable" }, { status: 404 });
  }

  const { error: erreurSuppression } = await admin.auth.admin.deleteUser(id);
  if (erreurSuppression) {
    return NextResponse.json(
      { erreur: "Suppression impossible : " + erreurSuppression.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
