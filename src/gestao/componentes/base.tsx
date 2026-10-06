import { motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { dados } from '../lib/dados';
import { useSessao } from '../lib/sessao';
import type { Papel } from '../lib/tipos';

/* ---------- ícones de linha ---------- */
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' };
export const Ico = {
  painel: () => <svg {...base}><rect x="3" y="12" width="4" height="8" /><rect x="10" y="6" width="4" height="14" /><rect x="17" y="9" width="4" height="11" /></svg>,
  pessoas: () => <svg {...base}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 14.5a5 5 0 0 1 6 5" /></svg>,
  setores: () => <svg {...base}><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></svg>,
  chave: () => <svg {...base}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M16 5l3 3M13 8l3 3" /></svg>,
  contrato: () => <svg {...base}><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7M9 17h7" /></svg>,
  historico: () => <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  predio: () => <svg {...base}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" /></svg>,
  mais: () => <svg {...base} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>,
  copiar: () => <svg {...base}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>,
  baixar: () => <svg {...base}><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 19h16" /></svg>,
  atualizar: () => <svg {...base}><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></svg>,
  ok: () => <svg {...base} strokeWidth={2.6}><path d="M5 12l5 5L20 7" /></svg>,
  olhonao: () => <svg {...base}><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.1A10 10 0 0 1 12 5c5 0 9 4 10 7a13 13 0 0 1-3 4.2M6.6 6.6C4.3 8 2.7 10 2 12c1 3 5 7 10 7a9.7 9.7 0 0 0 4.4-1" /></svg>,
  cadeado: () => <svg {...base}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
  calendario: () => <svg {...base}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  lapis: () => <svg {...base}><path d="M4 20l4-1 10-10-3-3L5 16z" /><path d="M13 7l3 3" /></svg>,
  lixo: () => <svg {...base}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>,
  seta: () => <svg {...base}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  sair: () => <svg {...base}><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" /></svg>,
  escudo: () => <svg {...base}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>,
  grafico: () => <svg {...base}><path d="M4 18l5-6 4 3 7-8" /><path d="M15 7h5v5" /></svg>,
  coracao: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.6-9.3-8.6C.9 9 2.4 5 6.2 5c2 0 3.3 1 4 2.2C11 6 12.3 5 14.3 5c3.8 0 5.3 4 3.5 7.4C19 16.4 12 21 12 21z" /></svg>,
  link: () => <svg {...base}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
  fechar: () => <svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>,
};

export const NOME_PAPEL: Record<Papel, string> = { admin: 'Administrador', rh: 'RH', gestor: 'Gestor', sesmt: 'SESMT' };

/* ---------- avatar de iniciais ---------- */
const TONS = ['coral', 'laranja', 'rosa', 'ameixa', 'ambar'] as const;
export function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}
export function Avatar({ nome, tam = 34, tom }: { nome: string; tam?: number; tom?: typeof TONS[number] }) {
  const t = tom ?? TONS[[...nome].reduce((a, c) => a + c.charCodeAt(0), 0) % TONS.length];
  return <span className={'avatar ' + t} style={{ width: tam, height: tam, fontSize: Math.round(tam * 0.38) }}>{iniciais(nome)}</span>;
}

/* ---------- casca ---------- */
export function Casca({ children }: { children: ReactNode }) {
  const { acessos, atual, escolherEmpresa, demo } = useSessao();
  const papel = atual?.papel;
  const podeCadastro = papel === 'admin' || papel === 'rh' || !!acessos?.operacao;
  const podeAdmin = papel === 'admin' || !!acessos?.operacao;
  const item = (para: string, nome: string, I: () => ReactNode) => (
    <NavLink to={para} end={para === '/gestao'} className={({ isActive }) => 'item' + (isActive ? ' ativa' : '')}><I />{nome}</NavLink>
  );
  return (
    <div className="casca">
      <aside className="lateral">
        <div className="marca"><i />Contigo<span>Gestão</span></div>
        {atual && (
          <div className="empresa">
            <Avatar nome={atual.empresa.nome} tam={38} tom="coral" />
            <div className="dados">
              <b>{atual.empresa.nome}</b>
              <span className="papel">{NOME_PAPEL[atual.papel]}{demo && ' · demonstração'}</span>
            </div>
            {(acessos?.empresas.length ?? 0) > 1 && (
              <select value={atual.empresa.id} onChange={e => escolherEmpresa(e.target.value)} aria-label="Trocar de empresa">
                {acessos!.empresas.map(a => <option key={a.empresa.id} value={a.empresa.id}>{a.empresa.nome}</option>)}
              </select>
            )}
          </div>
        )}
        {atual && (
          <>
            <div className="grupo">Empresa</div>
            {item('/gestao', 'Painel NR-1', Ico.painel)}
            {podeCadastro && item('/gestao/funcionarios', 'Funcionários', Ico.pessoas)}
            {podeCadastro && item('/gestao/setores', 'Setores', Ico.setores)}
            {podeAdmin && item('/gestao/acessos', 'Acessos', Ico.chave)}
            {item('/gestao/contrato', 'Contrato', Ico.contrato)}
            {podeAdmin && item('/gestao/auditoria', 'Auditoria', Ico.historico)}
          </>
        )}
        {acessos?.operacao && (
          <>
            <div className="grupo">Contigo · operação</div>
            {item('/gestao/operacao', 'Empresas e contratos', Ico.predio)}
          </>
        )}
        <div className="usuario">
          <Avatar nome={acessos?.email ?? '?'} tam={32} />
          <div className="dados"><span title={acessos?.email}>{acessos?.email}</span></div>
          <button type="button" title="Sair" aria-label="Sair" onClick={() => dados.sair()}><Ico.sair /></button>
        </div>
      </aside>
      <main className="conteudo"><div className="gpagina">{children}</div></main>
    </div>
  );
}

export function Cabeca({ olho, titulo, sub, children }: { olho?: string; titulo: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <motion.div className="cabeca" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div>{olho && <span className="olho">{olho}</span>}<h1>{titulo}</h1>{sub && <p className="gfraco">{sub}</p>}</div>
      {children && <div className="acoes">{children}</div>}
    </motion.div>
  );
}

export function Modal({ aberto, fechar, titulo, children, largura }: { aberto: boolean; fechar: () => void; titulo: string; children: ReactNode; largura?: number }) {
  if (!aberto) return null;
  return (
    <div className="fundo" onClick={e => { if (e.target === e.currentTarget) fechar(); }}>
      <motion.div className="modal" role="dialog" aria-modal="true" style={largura ? { maxWidth: largura } : undefined} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }}>
        <div className="modal-topo"><h2>{titulo}</h2><button type="button" className="gbtn gbtn-texto" aria-label="Fechar" onClick={fechar}><Ico.fechar /></button></div>
        {children}
      </motion.div>
    </div>
  );
}

/** Confirmação com cara de produto — no lugar do confirm() do navegador. */
export function Confirmar({ aberto, fechar, titulo, texto, rotulo = 'Confirmar', perigo = false, aoConfirmar }:
  { aberto: boolean; fechar: () => void; titulo: string; texto: ReactNode; rotulo?: string; perigo?: boolean; aoConfirmar: () => Promise<void> | void }) {
  const [ocupado, setOcupado] = useState(false);
  return (
    <Modal aberto={aberto} fechar={fechar} titulo={titulo} largura={460}>
      <p className="gfraco">{texto}</p>
      <div className="gpe">
        <button type="button" className="gbtn gbtn-texto" onClick={fechar}>Cancelar</button>
        <button type="button" className={'gbtn ' + (perigo ? 'gbtn-perigo' : 'gbtn-coral')} disabled={ocupado}
          onClick={async () => { setOcupado(true); try { await aoConfirmar(); fechar(); } finally { setOcupado(false); } }}>{ocupado ? 'Um instante…' : rotulo}</button>
      </div>
    </Modal>
  );
}

export function Erro({ msg }: { msg: string | null }) { return msg ? <p className="gerro" role="alert">{msg}</p> : null; }
export function Aviso({ msg }: { msg: string | null }) { return msg ? <p className="gok">{msg}</p> : null; }
export function Carregando() { return <div className="gcarregando"><span className="pulso" />Um instante…</div>; }

/** Estado vazio com propósito: diz o que vai aparecer aqui e o que fazer agora. */
export function Vazio({ icone, titulo, children, acao }: { icone?: ReactNode; titulo?: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="vazio">
      {icone && <div className="vazio-ico">{icone}</div>}
      {titulo && <h3>{titulo}</h3>}
      <p>{children}</p>
      {acao && <div className="vazio-acao">{acao}</div>}
    </div>
  );
}

/** Barra de progresso fina. */
export function Progresso({ valor, max, cor = 'var(--coral)' }: { valor: number; max: number; cor?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valor / max) * 100)) : 0;
  return <div className="progresso"><motion.i initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ duration: 0.6, ease: 'easeOut' }} style={{ background: cor }} /></div>;
}

/** Anel de progresso (SVG). */
export function Anel({ valor, max, tam = 96, cor = 'var(--coral)', children }: { valor: number; max: number; tam?: number; cor?: string; children?: ReactNode }) {
  const r = (tam - 10) / 2; const c = 2 * Math.PI * r; const pct = max > 0 ? Math.min(1, valor / max) : 0;
  return (
    <div className="anel" style={{ width: tam, height: tam }}>
      <svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`}>
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="var(--linha)" strokeWidth="8" />
        <motion.circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke={cor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 0.8, ease: 'easeOut' }}
          transform={`rotate(-90 ${tam / 2} ${tam / 2})`} />
      </svg>
      <div className="anel-meio">{children}</div>
    </div>
  );
}

/** Botão que copia e confirma. */
export function BotaoCopiar({ texto, rotulo = 'Copiar' }: { texto: string; rotulo?: string }) {
  const [feito, setFeito] = useState(false);
  return (
    <button type="button" className="gbtn gbtn-leve" onClick={async () => { try { await navigator.clipboard.writeText(texto); setFeito(true); setTimeout(() => setFeito(false), 1800); } catch { /* sem clipboard */ } }}>
      {feito ? <><Ico.ok />Copiado</> : <><Ico.copiar />{rotulo}</>}
    </button>
  );
}
