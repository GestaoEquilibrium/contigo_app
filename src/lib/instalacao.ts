import { useEffect, useReducer } from 'react';
import { CHAVE_INSTALACAO_VISTA, estaInstalado, local } from './util';

/**
 * Instalação "de verdade" na tela do celular.
 *
 * No Android (Chrome, Edge, Samsung) o navegador avisa que o app pode ser
 * instalado (`beforeinstallprompt`); guardamos esse aviso e mostramos um
 * botão nosso, que abre a caixa nativa de instalação. No iPhone não existe
 * esse caminho — lá é sempre Compartilhar → Adicionar à Tela de Início.
 */
type EventoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const CHAVE_DISPENSADO = 'contigo.instalar.dispensado';

let evento: EventoInstalar | null = null;
let instaladoAgora = false;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach(f => f());

/** Chamar uma vez, antes de o React desenhar: o aviso do navegador chega cedo. */
export function prepararInstalacao() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();               // segura o banner do navegador; mostramos o nosso
    evento = e as EventoInstalar;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    evento = null; instaladoAgora = true;
    local.gravar(CHAVE_INSTALACAO_VISTA, true);
    avisar();
  });
}

export function podeInstalarDireto() { return evento !== null; }

export async function instalarDireto(): Promise<'aceito' | 'recusado' | 'indisponivel'> {
  if (!evento) return 'indisponivel';
  const e = evento;
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === 'accepted') { evento = null; instaladoAgora = true; local.gravar(CHAVE_INSTALACAO_VISTA, true); }
  avisar();
  return outcome === 'accepted' ? 'aceito' : 'recusado';
}

export function dispensarLembrete() { local.gravar(CHAVE_DISPENSADO, true); avisar(); }

/** Estado vivo para as telas. */
export function useInstalacao() {
  const [, forcar] = useReducer((n: number) => n + 1, 0);
  useEffect(() => { ouvintes.add(forcar); return () => { ouvintes.delete(forcar); }; }, []);
  const instalado = estaInstalado() || instaladoAgora;
  return {
    instalado,
    direto: !instalado && podeInstalarDireto(),
    lembrar: !instalado && podeInstalarDireto() && !local.ler<boolean>(CHAVE_DISPENSADO, false),
  };
}
