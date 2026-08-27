import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// La connexion Supabase n'est créée qu'au moment où elle est réellement utilisée,
// dans le navigateur — jamais pendant la construction du site sur Vercel.
export function getSupabase(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
