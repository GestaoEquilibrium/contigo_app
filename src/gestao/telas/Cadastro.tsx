import { motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Anel, Avatar, Aviso, Cabeca, Carregando, Confirmar, Erro, Ico, Modal, NOME_PAPEL, Progresso, Vazio } from '../componentes/base';
import { dados } from '../lib/dados';
import { useCarregar } from '../lib/hooks';
import { useSessao } from '../lib/sessao';
import { PAPEIS, type Papel } from '../lib/tipos';
import { dataBr, emailValido } from '../lib/util';

const K = 12;

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
  const [renomear, setRenomear] = useState<{ id: string; nome: string } | null>(null);
  const [nomeNovo, setNomeNovo] = useState('');
  const [apagar, setApagar] = useState<{ id: string; nome: string; pessoas: number } | null>(null);

  const criar = async (e: FormEvent) => {
    e.preventDefault(); setErroAcao(null);
    if (novo.trim().length < 2) return;
    try { await dados.criarSetor(empresaId, novo.trim()); setNovo(''); recarregar(); } catch (err) { setErroAcao((err as Error).message); }
  };
  const salvarNome = async (e: FormEvent) => {
    e.preventDefault(); if (!renomear) return;
    const n = nomeNovo.trim(); if (n.length < 2 || n === renomear.nome) { setRenomear(null); return; }
    try { await dados.renomearSetor(renomear.id, n); setRenomear(null); recarregar(); } catch (err) { setErroAcao((err as Error).message); }
  };

  if (carregando && !dado) return <Carregando />;
  if (erro) return <Erro msg={erro} />;
  const conta = (id: string) => dado!.membros.filter(m => m.setorId === id && m.status !== 'inativo').length;
  const semSetor = dado!.membros.filter(m => !m.setorId && m.status !== 'inativo').length;
  const total = dado!.setores.length;
  const noPainel = dado!.setores.filter(s => conta(s.id) >= K).length;

  return (
    <>
      <Cabeca olho={atual!.empresa.nome} titulo="Setores" sub={<>É por setor que o painel agrega. {total > 0 && <><b>{noPainel} de {total}</b> {noPainel === 1 ? 'já aparece' : 'já aparecem'} no painel.</>}</>} />
      <Erro msg={erroAcao} />

      <div className="grade-2">
        <div>
          <form onSubmit={criar} className="gcartao" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, marginBottom: 16 }}>
            <input className="gcampo" placeholder="Nome do novo setor — ex.: Produção, Atendimento, Logística" value={novo} onChange={e => setNovo(e.target.value)} />
            <button className="gbtn gbtn-coral" type="submit" disabled={novo.trim().length < 2}><Ico.mais />Criar setor</button>
          </form>

          {total === 0 ? (
            <Vazio icone={<Ico.setores />} titulo="Nenhum setor ainda">Crie os setores antes de convidar as pessoas — assim cada uma já entra no lugar certo e o painel consegue agregar.</Vazio>
          ) : (
            <div className="grade">
              {dado!.setores.map((s, i) => {
                const n = conta(s.id); const falta = Math.max(0, K - n); const ok = n >= K;
                return (
                  <motion.div className="gcartao setor" key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="gtopo">
                      <Avatar nome={s.nome} tam={36} />
                      <b title={s.nome}>{s.nome}</b>
                      <div className="acoes-linha">
                        <button type="button" className="gbtn gbtn-ico" title="Renomear" onClick={() => { setRenomear({ id: s.id, nome: s.nome }); setNomeNovo(s.nome); }}><Ico.lapis /></button>
                        <button type="button" className="gbtn gbtn-ico" title="Apagar" onClick={() => setApagar({ id: s.id, nome: s.nome, pessoas: n })}><Ico.lixo /></button>
                      </div>
                    </div>
                    <div className="contagem">
                      <span className="valor">{n}</span><span className="de">de {K} para aparecer</span>
                      {ok ? <span className="gselo ativo">no painel</span> : <span className="gselo">faltam {falta}</span>}
                    </div>
                    <Progresso valor={n} max={K} cor={ok ? 'var(--ambar)' : 'linear-gradient(90deg,var(--coral),var(--laranja))'} />
                  </motion.div>
                );
              })}
            </div>
          )}

          {semSetor > 0 && (
            <p className="gok" style={{ marginTop: 14 }}><b>{semSetor} {semSetor === 1 ? 'pessoa está' : 'pessoas estão'} sem setor.</b> Sem setor, a pessoa só conta na "empresa inteira". <Link to="/gestao/funcionarios">Ajustar em Funcionários →</Link></p>
          )}
        </div>

        <aside>
          <div className="gcartao gdestaque">
            <h3><Ico.olhonao /> Por que {K}?</h3>
            <p style={{ margin: 0 }}>Com menos de {K} pessoas num recorte, daria para adivinhar quem respondeu o quê. Por isso o painel só mostra setores com {K} ou mais — e isso vale para todo mundo, inclusive o administrador.</p>
          </div>
          <div className="gcartao" style={{ marginTop: 12 }}>
            <h3><Ico.setores /> Setores pequenos</h3>
            <p className="gfraco" style={{ margin: 0, fontSize: 13.5 }}>Junte áreas afins num setor só — por exemplo, <b>Administrativo + Recepção</b> — para que apareçam no painel. O setor é um rótulo da empresa, não da pessoa: pode mudar quando quiser.</p>
          </div>
        </aside>
      </div>

      <Modal aberto={!!renomear} fechar={() => setRenomear(null)} titulo="Renomear setor" largura={440}>
        <form onSubmit={salvarNome}>
          <label className="rotulo">Novo nome</label>
          <input className="gcampo" value={nomeNovo} onChange={e => setNomeNovo(e.target.value)} autoFocus />
          <div className="gpe"><button type="button" className="gbtn gbtn-texto" onClick={() => setRenomear(null)}>Cancelar</button><button className="gbtn gbtn-coral" type="submit">Salvar</button></div>
        </form>
      </Modal>
      <Confirmar aberto={!!apagar} fechar={() => setApagar(null)} titulo={`Apagar "${apagar?.nome}"?`} rotulo="Apagar" perigo
        texto={apagar?.pessoas ? <>{apagar.pessoas} {apagar.pessoas === 1 ? 'pessoa fica' : 'pessoas ficam'} sem setor — e sem setor, só contam na "empresa inteira". Dá para reatribuir depois em Funcionários.</> : 'Este setor não tem ninguém. Pode apagar sem efeito no painel.'}
        aoConfirmar={async () => { if (!apagar) return; await dados.apagarSetor(apagar.id); recarregar(); }} />
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
  const [remover, setRemover] = useState<{ usuarioId: string; email: string } | null>(null);

  const conceder = async (e: FormEvent) => {
    e.preventDefault(); setErroAcao(null);
    if (!emailValido(email)) { setErroAcao('Esse e-mail não parece completo.'); return; }
    setOcupado(true);
    try { await dados.concederAcesso(empresaId, email.trim().toLowerCase(), papel); setModal(false); setEmail(''); setAviso(`Acesso liberado para ${email.trim().toLowerCase()}.`); recarregar(); }
    catch (err) { setErroAcao((err as Error).message); } finally { setOcupado(false); }
  };
  const mudarPapel = async (usuarioId: string, p: Papel) => { try { await dados.alterarAcesso(empresaId, usuarioId, { papel: p }); recarregar(); } catch (err) { setErroAcao((err as Error).message); } };
  const reativar = async (usuarioId: string) => { try { await dados.alterarAcesso(empresaId, usuarioId, { ativo: true }); recarregar(); } catch (err) { setErroAcao((err as Error).message); } };

  if (carregando && !dado) return <Carregando />;
  if (erro) return <Erro msg={erro} />;

  return (
    <>
      <Cabeca olho={atual!.empresa.nome} titulo="Acessos ao portal" sub="Quem entra aqui e o que cada papel enxerga. Nenhum papel chega a dado individual.">
        <button className="gbtn gbtn-coral" onClick={() => { setErroAcao(null); setModal(true); }}><Ico.mais />Liberar acesso</button>
      </Cabeca>
      <Erro msg={erroAcao} /><Aviso msg={aviso} />
      <div className="grade" style={{ marginBottom: 16 }}>
        {PAPEIS.map((p, i) => (
          <motion.div className="gcartao gsuave" key={p.valor} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <b>{p.nome}</b><p className="gpequeno gfraco" style={{ margin: '4px 0 0' }}>{p.descricao}</p>
          </motion.div>
        ))}
      </div>
      {dado!.length === 0 ? <Vazio icone={<Ico.chave />} titulo="Ninguém com acesso ainda">Libere o acesso para quem vai cuidar do cadastro ou acompanhar o painel.</Vazio> : (
        <table className="tabela">
          <thead><tr><th>Pessoa</th><th>Papel</th><th>Desde</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {dado!.map(a => { const souEu = a.email === meus?.email; return (
              <tr key={a.usuarioId}>
                <td><div className="pessoa"><Avatar nome={a.email} tam={32} /><div className="dados"><b>{a.email}</b>{souEu && <span>você</span>}</div></div></td>
                <td>
                  <select className="gcampo" style={{ width: 'auto' }} value={a.papel} onChange={e => mudarPapel(a.usuarioId, e.target.value as Papel)} disabled={souEu || !a.ativo}>
                    {PAPEIS.map(p => <option key={p.valor} value={p.valor}>{NOME_PAPEL[p.valor]}</option>)}
                  </select>
                </td>
                <td className="gpequeno">{dataBr(a.criadoEm)}</td>
                <td><span className={'gselo ' + (a.ativo ? 'ativo' : 'inativo')}>{a.ativo ? 'Ativo' : 'Removido'}</span></td>
                <td><div className="acoes-linha">{!souEu && (a.ativo
                  ? <button className="gbtn gbtn-texto" onClick={() => setRemover({ usuarioId: a.usuarioId, email: a.email })}>Remover</button>
                  : <button className="gbtn gbtn-texto" onClick={() => reativar(a.usuarioId)}>Reativar</button>)}</div></td>
              </tr>
            ); })}
          </tbody>
        </table>
      )}
      <Modal aberto={modal} fechar={() => setModal(false)} titulo="Liberar acesso ao portal">
        <form onSubmit={conceder}>
          <p className="gfraco gpequeno">A pessoa precisa <b>criar a conta primeiro</b> na tela de entrada do portal ("Criar conta"). Depois, você libera aqui.</p>
          <label className="rotulo">E-mail da conta</label><input className="gcampo" type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          <label className="rotulo">Papel</label>
          <select className="gcampo" value={papel} onChange={e => setPapel(e.target.value as Papel)}>{PAPEIS.map(p => <option key={p.valor} value={p.valor}>{p.nome} — {p.descricao}</option>)}</select>
          <div style={{ marginTop: 10 }}><Erro msg={erroAcao} /></div>
          <div className="gpe"><button type="button" className="gbtn gbtn-texto" onClick={() => setModal(false)}>Cancelar</button><button className="gbtn gbtn-coral" type="submit" disabled={ocupado}>Liberar</button></div>
        </form>
      </Modal>
      <Confirmar aberto={!!remover} fechar={() => setRemover(null)} titulo="Remover acesso ao portal?" rotulo="Remover" perigo
        texto={<>{remover?.email} deixa de entrar no portal. A conta continua existindo e o acesso pode ser reativado depois.</>}
        aoConfirmar={async () => { if (!remover) return; await dados.alterarAcesso(empresaId, remover.usuarioId, { ativo: false }); recarregar(); }} />
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
  const diasRestantes = u.vigenciaFim ? Math.max(0, Math.round((new Date(u.vigenciaFim + 'T12:00:00').getTime() - Date.now()) / 86400000)) : null;
  const Camada = ({ nome, sub, ativa, cor }: { nome: string; sub: string; ativa: boolean; cor: string }) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--linha)' }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 6, background: ativa ? cor : 'var(--linha-2)', flex: 'none' }} />
      <div style={{ flex: 1 }}><b style={{ color: ativa ? 'var(--tinta)' : 'var(--tinta-fraca)' }}>{nome}</b><div className="gpequeno gfraco">{sub}</div></div>
      <span className={'gselo ' + (ativa ? 'ativo' : 'sem')}>{ativa ? 'contratada' : 'não contratada'}</span>
    </div>
  );
  return (
    <>
      <Cabeca olho={atual!.empresa.nome} titulo="Contrato" sub="O que está contratado, quanto está em uso e até quando vale." />
      {u.licencas == null ? <Vazio icone={<Ico.contrato />} titulo="Nenhum contrato vigente">Sem contrato, a empresa não consegue convidar ninguém — fale com a equipe do Contigo.</Vazio> : (
        <div className="grade">
          <motion.div className="gcartao" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Anel valor={ocupadas} max={u.licencas} tam={96} cor="var(--coral)"><b>{ocupadas}</b><small>de {u.licencas}</small></Anel>
            <div><h3>Licenças em uso</h3><p className="gpequeno gfraco" style={{ margin: 0 }}>{u.ativos} {u.ativos === 1 ? 'pessoa já entrou' : 'pessoas já entraram'}<br />{u.convidados} {u.convidados === 1 ? 'convidada ainda não' : 'convidadas ainda não'}<br />{Math.max(0, u.licencas - ocupadas)} livres</p></div>
          </motion.div>
          <motion.div className="gcartao kpi" style={{ '--cor': 'var(--ambar)' } as React.CSSProperties} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <h3><span className="ico"><Ico.calendario /></span>Vigência</h3>
            <div className="numero" style={{ fontSize: 22 }}>{dataBr(u.vigenciaInicio)} → {dataBr(u.vigenciaFim)}</div>
            {diasRestantes !== null && <span className="tendencia">{diasRestantes} dias restantes</span>}
          </motion.div>
          <motion.div className="gcartao" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <h3>Camadas</h3>
            <Camada nome="Prevenção diária" sub="ritual, práticas, trilhas, painel NR-1" ativa cor="var(--coral)" />
            <Camada nome="Vamos conversar" sub={u.camada2 ? 'abre quando a equipe estiver dimensionada' : 'psicólogos CRP, conversa no ritmo da pessoa'} ativa={u.camada2} cor="var(--rosa)" />
            <Camada nome="Pronto atendimento" sub="em estruturação" ativa={u.camada3} cor="var(--ameixa)" />
          </motion.div>
        </div>
      )}
      <div className="gcartao gdestaque" style={{ marginTop: 16 }}>
        <h3><Ico.olhonao /> Vedação de uso individual</h3>
        <p style={{ margin: 0 }}>Este contrato veda o uso do Contigo para avaliação, seleção, promoção ou desligamento de qualquer pessoa. A plataforma não entrega dado individual à empresa por desenho — o banco de dados não permite — e o contrato reforça isso juridicamente.</p>
      </div>
      {dado!.contratos.length > 1 && (
        <>
          <h2>Histórico</h2>
          <table className="tabela"><thead><tr><th>Vigência</th><th style={{ textAlign: 'right' }}>Licenças</th><th>Situação</th></tr></thead>
            <tbody>{dado!.contratos.map(c => <tr key={c.id}><td>{dataBr(c.vigenciaInicio)} → {dataBr(c.vigenciaFim)}</td><td className="num">{c.licencas}</td><td><span className={'gselo ' + (c.ativo ? 'ativo' : 'inativo')}>{c.ativo ? 'Ativo' : 'Encerrado'}</span></td></tr>)}</tbody></table>
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
      <Cabeca olho={atual!.empresa.nome} titulo="Auditoria" sub="Tudo o que foi feito no cadastro desta empresa, por quem e quando. O token dos convites nunca é gravado." />
      {dado!.length === 0 ? <Vazio icone={<Ico.historico />} titulo="Nada registrado ainda">Cada criação, alteração e exclusão no cadastro vai aparecer aqui, em ordem.</Vazio> : (
        <div className="gcartao gtempo">
          {dado!.map(a => (
            <div className="evento" key={a.id}>
              <Avatar nome={a.email ?? 'sistema'} tam={34} />
              <div className="texto"><b>{a.email ?? 'sistema'}</b> {NOME_OP[a.operacao] ?? a.operacao} em <b>{NOME_TABELA[a.tabela] ?? a.tabela}</b><span>{resumo(a)}</span></div>
              <time>{dataBr(a.em, true)}</time>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
