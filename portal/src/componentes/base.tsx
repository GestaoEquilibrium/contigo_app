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
};

export const NOME_PAPEL: Record<Papel, string> = { admin: 'Administrador', rh: 'RH', gestor: 'Gestor', sesmt: 'SESMT' };

/* ---------- casca ---------- */
export function Casca({ children }: { children: ReactNode }) {
  const { acessos, atual, escolherEmpresa, demo } = useSessao();
  const papel = atual?.papel;
  const podeCadastro = papel === 'admin' || papel === 'rh' || !!acessos?.operacao;
  const podeAdmin = papel === 'admin' || !!acessos?.operacao;
  const item = (para: string, nome: string, I: () => ReactNode) => (
    <NavLink to={para} end={para === '/'} className={({ isActive }) => 'item' + (isActive ? ' ativa' : '')}><I />{nome}</NavLink>
  );
  return (
    <div className="casca">
      <aside className="lateral">
        <div className="marca"><i />Contigo<span>Gestão</span></div>
        {atual && (
          <div className="empresa">
            <b>{atual.empresa.nome}</b>
            <span className="fraco">{NOME_PAPEL[atual.papel]}{demo && ' · demonstração'}</span>
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
            {item('/', 'Painel NR-1', Ico.painel)}
            {podeCadastro && item('/funcionarios', 'Funcionários', Ico.pessoas)}
            {podeCadastro && item('/setores', 'Setores', Ico.setores)}
            {podeAdmin && item('/acessos', 'Acessos', Ico.chave)}
            {item('/contrato', 'Contrato', Ico.contrato)}
            {podeAdmin && item('/auditoria', 'Auditoria', Ico.historico)}
          </>
        )}
        {acessos?.operacao && (
          <>
            <div className="grupo">Contigo · operação</div>
            {item('/operacao', 'Empresas e contratos', Ico.predio)}
          </>
        )}
        <div className="pe">
          {acessos?.email}
          <button onClick={() => dados.sair()}>Sair</button>
        </div>
      </aside>
      <main className="conteudo">{children}</main>
    </div>
  );
}

export function Cabeca({ titulo, sub, children }: { titulo: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="cabeca">
      <div><h1>{titulo}</h1>{sub && <p className="fraco">{sub}</p>}</div>
      {children && <div className="acoes">{children}</div>}
    </div>
  );
}

export function Modal({ aberto, fechar, titulo, children }: { aberto: boolean; fechar: () => void; titulo: string; children: ReactNode }) {
  if (!aberto) return null;
  return (
    <div className="fundo" onClick={e => { if (e.target === e.currentTarget) fechar(); }}>
      <div className="modal" role="dialog" aria-modal="true"><h2>{titulo}</h2>{children}</div>
    </div>
  );
}

export function Erro({ msg }: { msg: string | null }) { return msg ? <p className="erro" role="alert">{msg}</p> : null; }
export function Aviso({ msg }: { msg: string | null }) { return msg ? <p className="ok">{msg}</p> : null; }
export function Carregando() { return <div className="carregando">Um instante…</div>; }
export function Vazio({ children }: { children: ReactNode }) { return <div className="vazio">{children}</div>; }

/** Botão que copia e confirma. */
export function BotaoCopiar({ texto, rotulo = 'Copiar' }: { texto: string; rotulo?: string }) {
  const [feito, setFeito] = useState(false);
  return (
    <button className="btn btn-leve" onClick={async () => { try { await navigator.clipboard.writeText(texto); setFeito(true); setTimeout(() => setFeito(false), 1800); } catch { /* sem clipboard */ } }}>
      {feito ? <><Ico.ok />Copiado</> : <><Ico.copiar />{rotulo}</>}
    </button>
  );
}
