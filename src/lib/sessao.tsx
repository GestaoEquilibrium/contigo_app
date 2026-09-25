import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dados } from './dados';
import type { Conta } from './tipos';

interface Sessao {
  carregando: boolean;
  logado: boolean;
  email: string | null;
  conta: Conta | null;
  erro: string | null;
  demo: boolean;
  recarregar: () => Promise<void>;
}

const Ctx = createContext<Sessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [conta, setConta] = useState<Conta | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    try {
      const s = await dados.sessaoAtual();
      setEmail(s?.email ?? null);
      if (s) setConta(await dados.minhaConta()); else setConta(null);
      setErro(null);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
    return dados.aoMudarSessao(() => { void recarregar(); });
  }, [recarregar]);

  const valor = useMemo<Sessao>(() => ({
    carregando, logado: !!email, email, conta, erro, demo: dados.demo, recarregar,
  }), [carregando, email, conta, erro, recarregar]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSessao(): Sessao {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSessao fora do ProvedorSessao');
  return s;
}
