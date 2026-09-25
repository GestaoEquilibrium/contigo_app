/* Ícones de linha, simples. Cada um é uma função para o JSX ficar leve. */
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' };
type P = { className?: string };

export const Casa = (p: P) => <svg {...base} {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>;
export const TrilhaIco = (p: P) => <svg {...base} {...p}><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.2 16.5c4.5-1.5 3-7 7.6-8.7" /></svg>;
export const Balao = (p: P) => <svg {...base} {...p}><path d="M21 12a8 8 0 0 1-8 8H8l-4 3v-6a8 8 0 1 1 17-5z" /></svg>;
export const Pessoa = (p: P) => <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const Pessoas = (p: P) => <svg {...base} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 14.5a5 5 0 0 1 6 5" /></svg>;
export const Coracao = (p: P) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 21s-7-4.6-9.3-8.6C.9 9 2.4 5 6.2 5c2 0 3.3 1 4 2.2C11 6 12.3 5 14.3 5c3.8 0 5.3 4 3.5 7.4C19 16.4 12 21 12 21z" /></svg>;
export const Boia = (p: P) => <svg {...base} strokeWidth={2.2} {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M5.6 5.6l3.5 3.5M18.4 5.6l-3.5 3.5M5.6 18.4l3.5-3.5M18.4 18.4l-3.5-3.5" /></svg>;
export const Tel = (p: P) => <svg {...base} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>;
export const Seta = (p: P) => <svg {...base} strokeWidth={2.2} {...p}><path d="M9 6l6 6-6 6" /></svg>;
export const Volta = (p: P) => <svg {...base} strokeWidth={2.2} {...p}><path d="M15 6l-6 6 6 6" /></svg>;
export const Ok = (p: P) => <svg {...base} strokeWidth={2.6} {...p}><path d="M5 12l5 5L20 7" /></svg>;
export const Ouvir = (p: P) => <svg {...base} {...p}><path d="M3 10v4h4l5 4V6l-5 4H3z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a8 8 0 0 1 0 11" /></svg>;
export const Parar = (p: P) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="6" y="6" width="12" height="12" rx="2" /></svg>;
export const Cadeado = (p: P) => <svg {...base} {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
export const OlhoNao = (p: P) => <svg {...base} {...p}><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.1A10 10 0 0 1 12 5c5 0 9 4 10 7a13 13 0 0 1-3 4.2M6.6 6.6C4.3 8 2.7 10 2 12c1 3 5 7 10 7a9.7 9.7 0 0 0 4.4-1" /></svg>;
export const Lixo = (p: P) => <svg {...base} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
export const Compartilhar = (p: P) => <svg {...base} {...p}><path d="M12 3v13" /><path d="M8 7l4-4 4 4" /><path d="M5 12v8h14v-8" /></svg>;
export const Mais = (p: P) => <svg {...base} strokeWidth={2.4} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const Pontos = (p: P) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>;
export const Celular = (p: P) => <svg {...base} {...p}><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></svg>;
export const Vento = (p: P) => <svg {...base} {...p}><path d="M3 8h11a3 3 0 1 0-3-3" /><path d="M3 12h15a3 3 0 1 1-3 3" /><path d="M3 16h8" /></svg>;
export const Lua = (p: P) => <svg {...base} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;
export const Sol = (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const Lapis = (p: P) => <svg {...base} {...p}><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M13 7l3 3" /></svg>;
export const Envelope = (p: P) => <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
export const Bussola = (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>;

/** Carinha do humor: 1 = pesado … 5 = leve */
export function Carinha({ n }: { n: number }) {
  const bocas: Record<number, string> = {
    1: 'M15 31c2-4 6-6 9-6s7 2 9 6 M13 16l6 2 M35 16l-6 2',
    2: 'M16 30c2-2.5 5-4 8-4s6 1.5 8 4',
    3: 'M16 29h16',
    4: 'M16 27c2 2.5 5 4 8 4s6-1.5 8-4',
    5: 'M14 26c2.5 5 6 7 10 7s7.5-2 10-7',
  };
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--coral600)' }}>
      <circle cx="24" cy="24" r="20" fill="var(--coral-tint)" />
      <circle cx="17.5" cy="20" r="1.8" fill="currentColor" stroke="none" /><circle cx="30.5" cy="20" r="1.8" fill="currentColor" stroke="none" />
      <path d={bocas[n] ?? bocas[3]} />
    </svg>
  );
}

/** Barras da energia: 1 a 5 cheias */
export function Barras({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 48 48">
      {[1, 2, 3, 4, 5].map(i => {
        const h = 8 + i * 6;
        return <rect key={i} x={4 + (i - 1) * 8.5} y={40 - h} width="6" height={h} rx="2" fill={i <= n ? 'var(--coral500)' : 'var(--linha)'} />;
      })}
    </svg>
  );
}
