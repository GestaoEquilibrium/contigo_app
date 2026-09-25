import { useState, type FormEvent } from 'react';
import { Aviso, Cabeca, Carregando, Erro, Ico, Modal, NOME_PAPEL, Vazio } from '../componentes/base';
import { dados } from '../lib/dados';
import { useCarregar } from '../lib/hooks';
import { useSessao } from '../lib/sessao';
import { PAPEIS, type Papel } from '../lib/tipos';
import { dataBr, emailValido } from '../lib/util';

/* ========================= Setores ========================= */
export function Setores() {
  const { atual } = useSessao();
  const empresaId = atual!.empresa.id;
  const { dado, erro, carregando, recarregar } = useCarregar(async () => {
    const [setores, membros] = await Promise.all([dados.setores(empresaId), dados.membros(empresaId).catch(() => [])]);
    return { setores, membros };
  }, [empresaId]);
  const [novo, setNovo] = useState('');
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const criar = async (e: FormEvent) => {
    e.preventDefault(); setErroAcao(null);
    if (novo.trim().length < 2) return;
    try { await dados.criarSetor(empresaId, novo); setNovo(''); recarregar(); } catch (err) { setErroAcao((err as Error).message); }
  };
  const renomear = async (id: string, atualNome: string) => {
    const n = prompt('Novo nome do setor:', atualNome); if (!n || n.trim() === atualNome) return;
    try { await dados.renomearSetor(id, n); recarregar(); } catch (err) { setErroAcao((err as Error).message); }
  };
  const apagar = async (id: string, nome: string, pessoas: number) => {
    if (!confirm(pessoas ? `Apagar "${nome}"? ${pessoas} pessoa(s) ficam sem setor — e sem setor, não entram em recorte nenhum do painel.` : `Apagar "${nome}"?`)) return;
    try { await dados.apagarSetor(id); recarregar(); } catch (err) { setErroAcao((err as Error).message); }
  };

  if (carregando && !dado) return <Carregando />;
  if (erro) return <Erro msg={erro} />;
  const conta = (id: string) => dado!.membros.filter(m => m.setorId === id && m.status !== 'inativo').length;

  return (
    <>
      <Cabeca titulo="Setores" sub="É por setor que o painel agrega. Setor com menos de 12 pessoas não aparece — junte setores pequenos se quiser vê-los." />
      <Erro msg={erroAcao} />
      <form onSubmit={criar} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input className="campo" placeholder="Nome do novo setor" value={novo} onChange={e => setNovo(e.target.value)} />
        <button className="btn btn-coral" type="submit"><Ico.mais />Criar</button>
      </form>
      {dado!.setores.length === 0 ? <Vazio>Nenhum setor ainda. Crie os setores antes de convidar as pessoas.</Vazio> : (
        <table className="tabela">
          <thead><tr><th>Setor</th><th style={{ textAlign: 'right' }}>Pessoas</th><th style={{ textAlign: 'right' }}>No painel</th><th></th></tr></thead>
          <tbody>
            {dado!.setores.map(s => { const n = conta(s.id); return (
              <tr key={s.id}>
                <td><b>{s.nome}</b></td>
                <td className="num">{n}</td>
                <td className="num">{n >= 12 ? <span className="selo ativo">aparece</span> : <span className="selo">precisa de {12 - n} a mais</span>}</td>
                <td><div className="acoes-linha"><button className="btn btn-texto" onClick={() => renomear(s.id, s.nome)}>Renomear</button><button className="btn btn-texto" onClick={() => apagar(s.id, s.nome, n)}>Apagar</button></div></td>
              </tr>
            ); })}
          </tbody>
        </table>
      )}
    </>
  );
}

/* ========================= Acessos ========================= */
export function Acessos() {
  const { atual, acessos: meus } = useSessao();
  const empresaId = atual!.empresa.id;
  const { dado, erro, carregando, recarregar } = useCarregar(() => dados.acessos(empresaId), [empresaId]);
  const [modal, setModal] = useState(false);
  const [email, setEmail] = useState(''); const [papel, setPapel] = useState<Papel>('rh');
  const [erroAcao, setErroAcao] = useState<string | null>(null); const [aviso, setAviso] = useState<string | null>(null); const [ocupado, setOcupado] = useState(false);

  const conceder = async (e: FormEvent) => {
    e.preventDefault(); setErroAcao(null);
    if (!emailValido(email)) { setErroAcao('Esse e-mail não parece completo.'); return; }
    setOcupado(true);
    try { await dados.concederAcesso(empresaId, email.trim().toLowerCase(), papel); setModal(false); setEmail(''); setAviso(`Acesso liberado para ${email.trim().toLowerCase()}.`); recarregar(); }
    catch (err) { setErroAcao((err as Error).message); } finally { setOcupado(false); }
  };
  const mudarPapel = async (usuarioId: string, p: Papel) => { try { await dados.alterarAcesso(empresaId, usuarioId, { papel: p }); recarregar(); } catch (err) { setErroAcao((err as Error).message); } };
  const alternar = async (usuarioId: string, ativo: boolean, em: string) => {
    if (ativo && !confirm(`Remover o acesso de ${em} ao portal?`)) return;
    try { await dados.alterarAcesso(empresaId, usuarioId, { ativo: !ativo }); recarregar(); } catch (err) { setErroAcao((err as Error).message); }
  };

  if (carregando && !dado) return <Carregando />;
  if (erro) return <Erro msg={erro} />;

  return (
    <>
      <Cabeca titulo="Acessos ao portal" sub="Quem entra aqui e o que cada papel enxerga. Nenhum papel chega a dado individual.">
        <button className="btn btn-coral" onClick={() => { setErroAcao(null); setModal(true); }}><Ico.mais />Liberar acesso</button>
      </Cabeca>
      <Erro msg={erroAcao} /><Aviso msg={aviso} />
      <div className="grade" style={{ marginBottom: 14 }}>
        {PAPEIS.map(p => <div className="cartao suave" key={p.valor}><b>{p.nome}</b><p className="pequeno fraco" style={{ margin: '4px 0 0' }}>{p.descricao}</p></div>)}
      </div>
      {dado!.length === 0 ? <Vazio>Ninguém com acesso ainda.</Vazio> : (
        <table className="tabela">
          <thead><tr><th>E-mail</th><th>Papel</th><th>Desde</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {dado!.map(a => { const souEu = a.email === meus?.email; return (
              <tr key={a.usuarioId}>
                <td><b>{a.email}</b>{souEu && <span className="pequeno fraco"> (você)</span>}</td>
                <td>
                  <select className="campo" style={{ minHeight: 32, padding: '4px 8px', width: 'auto' }} value={a.papel} onChange={e => mudarPapel(a.usuarioId, e.target.value as Papel)} disabled={souEu || !a.ativo}>
                    {PAPEIS.map(p => <option key={p.valor} value={p.valor}>{NOME_PAPEL[p.valor]}</option>)}
                  </select>
                </td>
                <td className="pequeno">{dataBr(a.criadoEm)}</td>
                <td><span className={'selo ' + (a.ativo ? 'ativo' : 'inativo')}>{a.ativo ? 'Ativo' : 'Removido'}</span></td>
                <td><div className="acoes-linha">{!souEu && <button className="btn btn-texto" onClick={() => alternar(a.usuarioId, a.ativo, a.email)}>{a.ativo ? 'Remover' : 'Reativar'}</button>}</div></td>
              </tr>
            ); })}
          </tbody>
        </table>
      )}
      <Modal aberto={modal} fechar={() => setModal(false)} titulo="Liberar acesso ao portal">
        <form onSubmit={conceder}>
          <p className="fraco pequeno">A pessoa precisa <b>criar a conta primeiro</b> na tela de entrada do portal ("Criar conta"). Depois, você libera aqui.</p>
          <label className="rotulo">E-mail da conta</label><input className="campo" type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          <label className="rotulo">Papel</label>
          <select className="campo" value={papel} onChange={e => setPapel(e.target.value as Papel)}>{PAPEIS.map(p => <option key={p.valor} value={p.valor}>{p.nome} — {p.descricao}</option>)}</select>
          <div style={{ marginTop: 10 }}><Erro msg={erroAcao} /></div>
          <div className="pe"><button type="button" className="btn btn-texto" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-coral" type="submit" disabled={ocupado}>Liberar</button></div>
        </form>
      </Modal>
    </>
  );
}

/* ========================= Contrato ========================= */
export function Contrato() {
  const { atual } = useSessao();
  const empresaId = atual!.empresa.id;
  const { dado, erro, carregando } = useCarregar(async () => {
    const [uso, contratos] = await Promise.all([dados.usoLicencas(empresaId), dados.contratos(empresaId).catch(() => [])]);
    return { uso, contratos };
  }, [empresaId]);
  if (carregando && !dado) return <Carregando />;
  if (erro) return <Erro msg={erro} />;
  const u = dado!.uso; const ocupadas = u.convidados + u.ativos;
  return (
    <>
      <Cabeca titulo="Contrato" sub="O que está contratado, quanto está em uso e até quando vale." />
      {u.licencas == null ? <Vazio>Nenhum contrato vigente. Sem contrato, a empresa não consegue convidar ninguém — fale com a equipe do Contigo.</Vazio> : (
        <div className="grade">
          <div className="cartao"><h3>Licenças</h3><div className="numero">{ocupadas}<small>de {u.licencas} em uso</small></div><p className="pequeno fraco">{u.ativos} pessoas já entraram · {u.convidados} convidadas ainda não</p></div>
          <div className="cartao"><h3>Vigência</h3><div className="numero" style={{ fontSize: 20 }}>{dataBr(u.vigenciaInicio)} → {dataBr(u.vigenciaFim)}</div></div>
          <div className="cartao"><h3>Camadas</h3>
            <p><span className="selo ativo">Prevenção diária</span> <span className="pequeno fraco">ritual, trilhas, rastreio</span></p>
            <p><span className={'selo ' + (u.camada2 ? 'ativo' : '')}>Vamos conversar</span> <span className="pequeno fraco">{u.camada2 ? 'contratada — abre quando a equipe estiver dimensionada' : 'não contratada'}</span></p>
            <p style={{ margin: 0 }}><span className={'selo ' + (u.camada3 ? 'ativo' : '')}>Pronto atendimento</span> <span className="pequeno fraco">{u.camada3 ? 'contratada' : 'não contratada'}</span></p>
          </div>
        </div>
      )}
      <div className="cartao destaque" style={{ marginTop: 14 }}>
        <h3><Ico.olhonao /> Vedação de uso individual</h3>
        <p style={{ margin: 0 }}>Este contrato veda o uso do Contigo para avaliação, seleção, promoção ou desligamento de qualquer pessoa. A plataforma não entrega dado individual à empresa por desenho — o banco de dados não permite — e o contrato reforça isso juridicamente.</p>
      </div>
      {dado!.contratos.length > 1 && (
        <>
          <h2>Histórico</h2>
          <table className="tabela"><thead><tr><th>Vigência</th><th style={{ textAlign: 'right' }}>Licenças</th><th>Situação</th></tr></thead>
            <tbody>{dado!.contratos.map(c => <tr key={c.id}><td>{dataBr(c.vigenciaInicio)} → {dataBr(c.vigenciaFim)}</td><td className="num">{c.licencas}</td><td><span className={'selo ' + (c.ativo ? 'ativo' : 'inativo')}>{c.ativo ? 'Ativo' : 'Encerrado'}</span></td></tr>)}</tbody></table>
        </>
      )}
    </>
  );
}

/* ========================= Auditoria ========================= */
const NOME_TABELA: Record<string, string> = { membros_empresa: 'Funcionários', convites: 'Convites', setores: 'Setores', usuarios_portal: 'Acessos', contratos: 'Contrato' };
const NOME_OP: Record<string, string> = { INSERT: 'criou', UPDATE: 'alterou', DELETE: 'apagou' };

export function Auditoria() {
  const { atual } = useSessao();
  const empresaId = atual!.empresa.id;
  const { dado, erro, carregando } = useCarregar(() => dados.auditoria(empresaId, 300), [empresaId]);
  if (carregando && !dado) return <Carregando />;
  if (erro) return <Erro msg={erro} />;
  const resumo = (a: { tabela: string; depois: Record<string, unknown> | null; antes: Record<string, unknown> | null }) => {
    const d = a.depois ?? a.antes ?? {};
    if (a.tabela === 'membros_empresa') return `${d.nome ?? ''} · ${d.status ?? ''}`;
    if (a.tabela === 'setores') return String(d.nome ?? '');
    if (a.tabela === 'usuarios_portal') return `papel ${d.papel ?? ''}${d.ativo === false ? ' · removido' : ''}`;
    if (a.tabela === 'contratos') return `${d.licencas ?? ''} licenças`;
    return '';
  };
  return (
    <>
      <Cabeca titulo="Auditoria" sub="Tudo o que foi feito no cadastro desta empresa, por quem e quando. O token dos convites nunca é gravado." />
      {dado!.length === 0 ? <Vazio>Nada registrado ainda.</Vazio> : (
        <table className="tabela">
          <thead><tr><th>Quando</th><th>Quem</th><th>O quê</th><th>Detalhe</th></tr></thead>
          <tbody>{dado!.map(a => <tr key={a.id}><td className="pequeno">{dataBr(a.em, true)}</td><td>{a.email ?? <span className="fraco">sistema</span>}</td><td>{NOME_OP[a.operacao] ?? a.operacao} em <b>{NOME_TABELA[a.tabela] ?? a.tabela}</b></td><td className="pequeno fraco">{resumo(a)}</td></tr>)}</tbody>
        </table>
      )}
    </>
  );
}
