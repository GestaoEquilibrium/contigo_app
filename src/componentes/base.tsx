import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Balao, Boia, Casa, Ok, Ouvir, Parar, Pessoa, Seta, TrilhaIco, Volta } from './icones';

/* ---------- moldura ---------- */
export function Moldura({ children, comAbas, comTopo }: { children: ReactNode; comAbas?: boolean; comTopo?: boolean }) {
  return (
    <div className="pagina">
      <div className="telefone">
        {comTopo && <Topo />}
        <main className={comTopo ? '' : 'solta'}>{children}</main>
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
      <button className="ajuda-pill" onClick={() => nav('/ajuda', { state: { de: loc.pathname } })} aria-label="Preciso de ajuda agora">
        <Boia />Ajuda agora
      </button>
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
          <Ico />{nome}
        </NavLink>
      ))}
    </nav>
  );
}

/* ---------- fluxo: voltar + bolinhas ---------- */
export function FluxoTopo({ voltar, rotulo = 'Voltar', total, atual, aoVoltar }: { voltar?: string; rotulo?: string; total?: number; atual?: number; aoVoltar?: () => void }) {
  return (
    <div className="fluxo-topo">
      {aoVoltar
        ? <button className="voltar" onClick={aoVoltar}><Volta />{rotulo}</button>
        : <Link className="voltar" to={voltar ?? '/'}><Volta />{rotulo}</Link>}
      {total !== undefined && atual !== undefined && (
        <div className="passos" aria-label={`Passo ${atual + 1} de ${total}`}>
          {Array.from({ length: total }, (_, i) => <i key={i} className={i < atual ? 'feito' : i === atual ? 'atual' : ''} />)}
        </div>
      )}
    </div>
  );
}

/* ---------- opção grande ---------- */
export function Opcao({ icone, children, sub, marcada, onClick }: { icone?: ReactNode; children: ReactNode; sub?: string; marcada?: boolean; onClick: () => void }) {
  const [clicada, setClicada] = useState(false);
  return (
    <button className={'opcao' + (marcada || clicada ? ' marcada' : '')} onClick={() => { setClicada(true); setTimeout(onClick, 180); }}>
      {icone && <span className="ico">{icone}</span>}
      <span>{children}{sub && <span className="sub">{sub}</span>}</span>
    </button>
  );
}

/* ---------- linha de ação ---------- */
export function LinhaAcao({ icone, titulo, sub, para, onClick, href, classe }: { icone: ReactNode; titulo: string; sub?: string; para?: string; onClick?: () => void; href?: string; classe?: string }) {
  const dentro = (
    <>
      <div className="ico">{icone}</div>
      <div><b>{titulo}</b>{sub && <span>{sub}</span>}</div>
      <div className="seta"><Seta /></div>
    </>
  );
  const cls = 'linha-acao' + (classe ? ' ' + classe : '');
  if (href) return <a className={cls} href={href}>{dentro}</a>;
  if (para) return <Link className={cls} to={para}>{dentro}</Link>;
  return <button className={cls} onClick={onClick}>{dentro}</button>;
}

/* ---------- selo de "pronto" ---------- */
export function Selo() { return <div className="selo pop"><Ok /></div>; }

/* ---------- folha de confirmação ---------- */
export function Folha({ aberta, fechar, children }: { aberta: boolean; fechar: () => void; children: ReactNode }) {
  if (!aberta) return null;
  return (
    <div className="folha-fundo" onClick={e => { if (e.target === e.currentTarget) fechar(); }}>
      <div className="folha" role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}

/* ---------- ouvir em voz alta (voz do próprio aparelho) ---------- */
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
  if (semVoz) return <span className="pequeno fraco" style={{ display: 'block', margin: '2px 0 14px' }}>Este aparelho não tem voz em português.</span>;
  return <button className={'ouvir' + (tocando ? ' tocando' : '')} onClick={alternar}>{tocando ? <><Parar />Parar</> : <><Ouvir />Ouvir</>}</button>;
}

/* ---------- respiração guiada ---------- */
export function Respiracao({ segundos, aoTerminar }: { segundos: number; aoTerminar: () => void }) {
  const [restante, setRestante] = useState(segundos);
  const [fase, setFase] = useState<'Inspire' | 'Segure' | 'Solte devagar' | 'Pronto'>('Inspire');
  const [classe, setClasse] = useState('inspira');
  const fim = useRef(aoTerminar);
  fim.current = aoTerminar;
  useEffect(() => {
    const passos: [typeof fase, string | null, number][] = [['Inspire', 'inspira', 4], ['Segure', null, 2], ['Solte devagar', 'solta', 5]];
    let idx = 0, dentro = 0, r = segundos;
    const t = setInterval(() => {
      r--; dentro++; setRestante(r);
      if (dentro >= passos[idx][2]) { dentro = 0; idx = (idx + 1) % passos.length; setFase(passos[idx][0]); if (passos[idx][1]) setClasse(passos[idx][1] as string); }
      if (r <= 0) { clearInterval(t); setFase('Pronto'); setTimeout(() => fim.current(), 900); }
    }, 1000);
    return () => clearInterval(t);
  }, [segundos]);
  return (
    <div className="respira">
      <div className={'bolha ' + classe}><span>{fase}</span></div>
      <div className="tempo">{Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')}</div>
    </div>
  );
}

export function Carregando({ texto = 'Um instante…' }: { texto?: string }) {
  return <div className="carregando">{texto}</div>;
}

export function Erro({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="erro" role="alert">{msg}</p>;
}
