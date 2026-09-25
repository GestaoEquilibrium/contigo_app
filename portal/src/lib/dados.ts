import type { DadosPortal } from './tipos';
import { supabase } from './supabase';
import { DadosSupabase } from './dados.supabase';
import { DadosDemo } from './dados.demo';

/** Com as chaves no .env fala com o banco; sem elas, demonstração com dados inventados. */
export const dados: DadosPortal = supabase ? new DadosSupabase(supabase) : new DadosDemo();
