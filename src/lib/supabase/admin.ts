import { createClient } from "@supabase/supabase-js";

// Usa a service role key — nunca importe este módulo em um componente "use client".
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
