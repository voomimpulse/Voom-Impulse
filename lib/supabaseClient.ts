import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Client unique utilisé dans toute l'appli (Admin, Entreprise, Commercial).
// Les policies Row Level Security côté Supabase filtrent automatiquement
// ce que chaque rôle peut voir — pas besoin de filtrer manuellement ici.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
