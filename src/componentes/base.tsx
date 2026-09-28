import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Balao, Boia, Casa, Ok, Ouvir, Parar, Pessoa, Seta, TrilhaIco, Volta } from './icones';

/* ---------- cores com significado ---------- */
export const CORES_HUMOR = ['#7B4B9E', '#EF5A8C', '#E2563C', '#F58A3C', '#F5A524'];   // 1 pesado … 5 leve
export const CORES_TEMA: Record<string, string> = {
  sono: '#7B4B9E', ansiedade: '#F5A524', trabalho: '#E2563C', autoestima: '#EF5A8C',
  relacoes: '#F58A3C', luto: '#513A66', proposito: '#D9A621',
};

/* ---------- moldura com transição de tela ---------- */
export function Moldura({ children, comAbas, comTopo }: { children: ReactNode; comAbas?: boolean; comTopo?: boolean }) {
  const loc = useLocation();
  const reduz = useReducedMotion();
  return (
    <div className="pagina">
      <div className="telefone">
        {comTopo && <Topo />}
        <main className={comTopo ? '' : 'solta'}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={loc.pathname} className="pagina-anim"
              initial={reduz ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reduz ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        {comAbas && <Abas />}
      </div>
    </div>
  );
}

export function Topo() {
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <div className="topo">
      <div className="marca"><i />Contigo</div>
      <motion.button whileTap={{ scale: 0.95 }} className="ajuda-pill" onClick={() => nav('/ajuda', { state: { de: loc.pathname } })} aria-label="Preciso de ajuda agora">
        <Boia />Ajuda agora
      </motion.button>
    </div>
  );
}

export function Abas() {
  const abas = [
    { para: '/', nome: 'Hoje', Ico: Casa },
    { para: '/trilhas', nome: 'Trilhas', Ico: TrilhaIco },
    { para: '/conversar', nome: 'Conversar', Ico: Balao },
    { para: '/eu', nome: 'Eu', Ico: Pessoa },
  ];
  return (
    <nav className="abas" aria-label="Navegação principal">
      {abas.map(({ para, nome, Ico }) => (
        <NavLink key={para} to={para} end={para === '/'} className={({ isActive }) => 'aba' + (isActive ? ' ativa' : '')}>
          {({ isActive }) => (
            <>
              {isActive && <motion.i className="pill" layoutId="aba-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <Ico /><span>{nome}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/* ---------- fluxo ---------- */
export function FluxoTopo({ voltar, rotulo = 'Voltar', total, atual, aoVoltar }: { voltar?: string; rotulo?: string; total?: number; atual?: number; aoVoltar?: () => void }) {
  return (
    <div className="fluxo-topo">
      {aoVoltar ? <button className="voltar" onClick={aoVoltar}><Volta />{rotulo}</button> : <Link className="voltar" to={voltar ?? '/'}><Volta />{rotulo}</Link>}
      {total !== undefined && atual !== undefined && (
        <div className="passos" aria-label={`Passo ${atual + 1} de ${total}`}>
          {Array.from({ length: total }, (_, i) => <i key={i} className={i < atual ? 'feito' : i === atual ? 'atual' : ''} />)}
        </div>
      )}
    </div>
  );
}

/* ---------- opção ---------- */
export function Opcao({ icone, cor, children, sub, marcada, onClick }: { icone?: ReactNode; cor?: string; children: ReactNode; sub?: string; marcada?: boolean; onClick: () => void }) {
  const [clicada, setClicada] = useState(false);
  return (
    <motion.button whileTap={{ scale: 0.98 }} className={'opcao' + (marcada || clicada ? ' marcada' : '')} onClick={() => { setClicada(true); setTimeout(onClick, 160); }}
      style={marcada || clicada ? { borderColor: cor ?? undefined } : undefined}>
      {icone && (cor ? <span className="chip-cor" style={{ background: cor }}>{icone}</span> : <span className="ico">{icone}</span>)}
      <span>{children}{sub && <span className="sub">{sub}</span>}</span>
    </motion.button>
  );
}

/* ---------- linha de ação ---------- */
export function LinhaAcao({ icone, tom, titulo, sub, para, onClick, href }: { icone: ReactNode; tom?: 'ambar' | 'ameixa' | 'rosa' | 'uva'; titulo: string; sub?: string; para?: string; onClick?: () => void; href?: string }) {
  const dentro = (<><div className={'ico' + (tom ? ' ' + tom : '')}>{icone}</div><div><b>{titulo}</b>{sub && <span>{sub}</span>}</div><div className="seta"><Seta /></div></>);
  const props = { whileTap: { scale: 0.985 }, className: 'linha-acao' };
  if (href) return <motion.a {...props} href={href}>{dentro}</motion.a>;
  if (para) return <motion.div {...props} style={{ padding: 0, border: 0, boxShadow: 'none' }}><Link className="linha-acao" to={para} style={{ boxShadow: 'var(--sombra)' }}>{dentro}</Link></motion.div>;
  return <motion.button {...props} onClick={onClick}>{dentro}</motion.button>;
}

/* ---------- selo de pronto + confete ---------- */
export function Selo({ confete = true }: { confete?: boolean }) {
  const reduz = useReducedMotion();
  const pecas = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    i, cor: ['#E2563C', '#F5A524', '#EF5A8C', '#7B4B9E', '#FFB08A', '#FFD166'][i % 6],
    x: (Math.random() - 0.5) * 260, y: -60 - Math.random() * 160, r: Math.random() * 540, d: 0.9 + Math.random() * 0.6,
  })), []);
  return (
    <>
      {confete && !reduz && (
        <div className="confete" aria-hidden>
          {pecas.map(p => (
            <motion.i key={p.i} style={{ background: p.cor }} initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
              animate={{ x: p.x, y: [0, p.y, p.y + 240], opacity: [1, 1, 0], rotate: p.r, scale: 1 }}
              transition={{ duration: p.d + 0.5, ease: 'easeOut', times: [0, 0.45, 1] }} />
          ))}
        </div>
      )}
      <motion.div className="selo" initial={reduz ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
        <Ok />
      </motion.div>
    </>
  );
}

/* ---------- folha ---------- */
export function Folha({ aberta, fechar, children }: { aberta: boolean; fechar: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {aberta && (
        <motion.div className="folha-fundo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => { if (e.target === e.currentTarget) fechar(); }}>
          <motion.div className="folha" role="dialog" aria-modal="true" initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: 'spring', stiffness: 420, damping: 36 }}>
            <div className="puxador" />{children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- ouvir ---------- */
export function BotaoOuvir({ texto }: { texto: string }) {
  const [tocando, setTocando] = useState(false);
  const [semVoz, setSemVoz] = useState(false);
  useEffect(() => () => { try { speechSynthesis.cancel(); } catch { /* sem voz */ } }, []);
  const alternar = () => {
    try {
      if (!('speechSynthesis' in window)) { setSemVoz(true); return; }
      if (tocando) { speechSynthesis.cancel(); setTocando(false); return; }
      const u = new SpeechSynthesisUtterance(texto); u.lang = 'pt-BR'; u.rate = 0.95;
      u.onend = () => setTocando(false); u.onerror = () => setTocando(false);
      speechSynthesis.cancel(); speechSynthesis.speak(u); setTocando(true);
    } catch { setSemVoz(true); }
  };
  if (semVoz) return <span className="pequeno fraco" style={{ display: 'block', margin: '2px 0 12px' }}>Este aparelho não tem voz em português.</span>;
  return <motion.button whileTap={{ scale: 0.95 }} className={'ouvir' + (tocando ? ' tocando' : '')} onClick={alternar}>{tocando ? <><Parar />Parar</> : <><Ouvir />Ouvir</>}</motion.button>;
}

/* ---------- respiração guiada ---------- */
export function Respiracao({ segundos, aoTerminar }: { segundos: number; aoTerminar: () => void }) {
  const [restante, setRestante] = useState(segundos);
  const [fase, setFase] = useState<'Inspire' | 'Segure' | 'Solte devagar' | 'Pronto'>('Inspire');
  const [escala, setEscala] = useState(1.3);
  const [dur, setDur] = useState(4);
  const fim = useRef(aoTerminar); fim.current = aoTerminar;
  useEffect(() => {
    const passos: [typeof fase, number, number][] = [['Inspire', 1.3, 4], ['Segure', 1.3, 2], ['Solte devagar', 0.85, 5]];
    let idx = 0, dentro = 0, r = segundos;
    const t = setInterval(() => {
      r--; dentro++; setRestante(r);
      if (dentro >= passos[idx][2]) { dentro = 0; idx = (idx + 1) % passos.length; setFase(passos[idx][0]); setEscala(passos[idx][1]); setDur(passos[idx][2]); }
      if (r <= 0) { clearInterval(t); setFase('Pronto'); setTimeout(() => fim.current(), 900); }
    }, 1000);
    return () => clearInterval(t);
  }, [segundos]);
  return (
    <div className="respira">
      <motion.div className="aura" animate={{ scale: escala * 1.1, opacity: fase === 'Segure' ? 0.9 : 0.6 }} transition={{ duration: dur, ease: 'easeInOut' }} />
      <motion.div className="bolha-r" animate={{ scale: escala }} transition={{ duration: dur, ease: 'easeInOut' }}><span>{fase}</span></motion.div>
      <div className="tempo">{Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')}</div>
    </div>
  );
}

/* ---------- semana colorida ---------- */
export function Semana({ dias }: { dias: { rotulo: string; humor: number | null; hoje: boolean }[] }) {
  return (
    <div className="semana">
      {dias.map((d, i) => (
        <div key={i} className={'dia' + (d.hoje ? ' hoje' : '')}>
          <motion.i className={d.humor ? 'cheio' : ''} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 22 }}
            style={d.humor ? { background: CORES_HUMOR[d.humor - 1] } : undefined} />
          <span>{d.rotulo}</span>
        </div>
      ))}
    </div>
  );
}

export function Carregando() { return <div className="carregando" aria-label="Carregando"><i /><i /><i /></div>; }
export function Erro({ msg }: { msg: string | null }) { return msg ? <p className="erro" role="alert">{msg}</p> : null; }

/** Anel de progresso (trilhas). */
export function Anel({ fracao, cor, tamanho = 42 }: { fracao: number; cor: string; tamanho?: number }) {
  const r = (tamanho - 5) / 2; const c = 2 * Math.PI * r;
  return (
    <svg className="arco" viewBox={`0 0 ${tamanho} ${tamanho}`} width={tamanho} height={tamanho}>
      <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--linha)" strokeWidth="3.5" />
      <motion.circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={cor} strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.min(1, fracao)) }} transition={{ duration: 0.8, ease: 'easeOut' }}
        transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`} />
    </svg>
  );
}
