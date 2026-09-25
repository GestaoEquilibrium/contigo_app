import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Só a chave anon entra aqui. A service_role nunca chega ao aplicativo:
 * quem protege o dado é a RLS no banco. Sem as duas variáveis, o app roda
 * em modo demonstração (dados só neste aparelho).
 */
export const supabase: SupabaseClient | null =
  url && anon && url.startsWith('https://')
    ? createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
      })
    : null;
