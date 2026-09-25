import type { Dados } from './tipos';
import { supabase } from './supabase';
import { DadosSupabase } from './dados.supabase';
import { DadosDemo } from './dados.demo';

/** Fachada: com as chaves no .env fala com o banco; sem elas, demonstração local. */
export const dados: Dados = supabase ? new DadosSupabase(supabase) : new DadosDemo();
