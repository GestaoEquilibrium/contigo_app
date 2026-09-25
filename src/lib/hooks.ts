import { useCallback, useEffect, useState, type DependencyList } from 'react';

/** Carrega algo assíncrono e devolve dado, erro e um jeito de recarregar. */
export function useCarregar<T>(fn: () => Promise<T>, deps: DependencyList = []) {
  const [dado, setDado] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tick, setTick] = useState(0);
  const recarregar = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    fn().then(d => { if (vivo) { setDado(d); setErro(null); } })
      .catch(e => { if (vivo) setErro((e as Error).message); })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { dado, erro, carregando, recarregar };
}
