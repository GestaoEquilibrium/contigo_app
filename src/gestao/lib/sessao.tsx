import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dados } from './dados';
import type { AcessoMeu, MeusAcessos } from './tipos';

interface Sessao {
  carregando: boolean;
  logado: boolean;
  acessos: MeusAcessos | null;
  atual: AcessoMeu | null;          // empresa selecionada
  escolherEmpresa: (id: string) => void;
  recarregar: () => Promise<void>;
  demo: boolean;
}
const Ctx = createContext<Sessao | null>(null);
const CHAVE = 'contigo.portal.empresa';

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [logado, setLogado] = useState(false);
  const [acessos, setAcessos] = useState<MeusAcessos | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(() => { try { return localStorage.getItem(CHAVE); } catch { return null; } });

  const recarregar = useCallback(async () => {
    try {
      const s = await dados.sessaoAtual();
      setLogado(!!s);
      setAcessos(s ? await dados.meusAcessos() : null);
    } finally { setCarregando(false); }
  }, []);

  useEffect(() => { void recarregar(); return dados.aoMudarSessao(() => { void recarregar(); }); }, [recarregar]);

  const atual = useMemo(() => {
    if (!acessos || acessos.empresas.length === 0) return null;
    return acessos.empresas.find(a => a.empresa.id === empresaId) ?? acessos.empresas[0];
  }, [acessos, empresaId]);

  const escolherEmpresa = useCallback((id: string) => { setEmpresaId(id); try { localStorage.setItem(CHAVE, id); } catch { /* sem storage */ } }, []);

  const valor = useMemo<Sessao>(() => ({ carregando, logado, acessos, atual, escolherEmpresa, recarregar, demo: dados.demo }), [carregando, logado, acessos, atual, escolherEmpresa, recarregar]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSessao(): Sessao {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSessao fora do ProvedorSessao');
  return s;
}
