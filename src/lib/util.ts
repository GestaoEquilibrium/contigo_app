import type { Momento } from './tipos';

export function agora(): Date { return new Date(); }

export function momentoAtual(d = agora()): Momento {
  const h = d.getHours();
  return h < 11 ? 'manha' : h < 18 ? 'meiodia' : 'noite';
}

export function saudacao(d = agora()): string {
  const h = d.getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Data local no formato do banco (yyyy-mm-dd). */
export function dataLocal(d = agora()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function dataExtenso(d = agora()): string {
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const PERGUNTA_HUMOR: Record<Momento, string> = {
  manha: 'Como você acordou hoje?',
  meiodia: 'Como está sendo até agora?',
  noite: 'Como foi o seu dia?',
};

export const HUMOR = [
  { v: 1, t: 'Pesado' }, { v: 2, t: 'Difícil' }, { v: 3, t: 'Mais ou menos' }, { v: 4, t: 'Bem' }, { v: 5, t: 'Leve' },
];
export const ENERGIA = [
  { v: 1, t: 'No fim' }, { v: 2, t: 'Pouca' }, { v: 3, t: 'Dá pro gasto' }, { v: 4, t: 'Boa' }, { v: 5, t: 'Inteira' },
];
export const INTENCOES = ['Ir com mais calma', 'Uma coisa de cada vez', 'Pedir ajuda se precisar', 'Cuidar do meu sono', 'Só atravessar o dia'];

/** Os sete temas do Contigo. A trilha só existe de verdade quando o catálogo a publica. */
export const TEMAS = [
  { codigo: 'sono', nome: 'Sono', pergunta: 'Dormir mal', sub: 'Quatro semanas para dormir melhor' },
  { codigo: 'ansiedade', nome: 'Ansiedade', pergunta: 'Ansiedade', sub: 'Entender o alarme do corpo' },
  { codigo: 'trabalho', nome: 'Estresse no trabalho', pergunta: 'O trabalho', sub: 'Carga, limite e recuperação' },
  { codigo: 'autoestima', nome: 'Autoestima', pergunta: 'Como eu me trato', sub: 'A voz que fala com você' },
  { codigo: 'relacoes', nome: 'Relacionamentos', pergunta: 'As pessoas ao redor', sub: 'Convivência, conflito e limite' },
  { codigo: 'luto', nome: 'Luto', pergunta: 'Uma perda', sub: 'Quando alguém ou algo se vai' },
  { codigo: 'proposito', nome: 'Propósito', pergunta: 'Falta de sentido', sub: 'O que dá sentido aos dias' },
];

/** Perguntas de afinidade. A 4ª fala da fé DA PESSOA — nunca do profissional. */
export const AFINIDADE = [
  { chave: 'jeito', q: 'Como você prefere ser cuidado(a)?', o: ['Com mais acolhimento e escuta', 'Mais prático, direto ao ponto', 'Um equilíbrio dos dois', 'Ainda não sei'] },
  { chave: 'tema', q: 'O que você quer trabalhar agora?', o: ['Ansiedade ou estresse', 'Tristeza ou uma perda', 'Relacionamentos', 'Trabalho ou estudos', 'Como eu me vejo', 'Sono', 'Outra coisa'] },
  { chave: 'genero', q: 'Tem preferência sobre quem vai te atender?', o: ['Tanto faz', 'Prefiro uma mulher', 'Prefiro um homem'] },
  { chave: 'fe', q: 'Você quer que a sua fé ou os seus valores façam parte da conversa?', o: ['Sim, é importante para mim', 'Tanto faz', 'Prefiro que não entre'], nota: 'A pergunta é sobre você — nunca sobre a religião de quem te atende.' },
  { chave: 'canal', q: 'Como você prefere conversar?', o: ['Por mensagem', 'Por áudio', 'Por vídeo', 'Pessoalmente'] },
  { chave: 'historico', q: 'Você já fez terapia antes?', o: ['É a primeira vez', 'Já fiz', 'Faço atualmente'] },
  { chave: 'formato', q: 'O que combina com você agora?', o: ['Só desabafar e ser ouvido(a)', 'Um acompanhamento contínuo', 'Ainda estou decidindo'] },
];

export function estaInstalado(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch { return false; }
}
export function ehIphone(): boolean { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }

export function primeiroNome(s: string | null | undefined): string {
  return (s || '').trim().split(' ')[0] || 'você';
}

/** localStorage com try/catch: em janela privada pode não existir. */
export const local = {
  ler<T>(chave: string, padrao: T): T {
    try { const v = localStorage.getItem(chave); return v ? (JSON.parse(v) as T) : padrao; } catch { return padrao; }
  },
  gravar(chave: string, valor: unknown) { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem storage */ } },
  apagar(chave: string) { try { localStorage.removeItem(chave); } catch { /* sem storage */ } },
};

export const CHAVE_CONVITE = 'contigo.convite';
export const CHAVE_EMAIL = 'contigo.email';
export const CHAVE_INSTALACAO_VISTA = 'contigo.instalacao-vista';
