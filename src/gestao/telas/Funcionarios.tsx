import { useMemo, useState, type FormEvent } from 'react';
import { Aviso, BotaoCopiar, Cabeca, Carregando, Erro, Ico, Modal, Vazio } from '../componentes/base';
import { dados } from '../lib/dados';
import { useCarregar } from '../lib/hooks';
import { useSessao } from '../lib/sessao';
import type { Membro } from '../lib/tipos';
import { dataBr, emailValido } from '../lib/util';

const NOME_STATUS = { convidado: 'Convidado', ativo: 'Ativo', inativo: 'Inativo' } as const;

/** Cadastro, nunca prontuário: quem tem acesso ao app, em que setor, e se já entrou. */
export function Funcionarios() {
  const { atual } = useSessao();
  const empresaId = atual!.empresa.id;
  const { dado, erro, carregando, recarregar } = useCarregar(async () => {
    const [membros, setores, uso] = await Promise.all([dados.membros(empresaId), dados.setores(empresaId), dados.usoLicencas(empresaId)]);
    return { membros, setores, uso };
  }, [empresaId]);

  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState<null | 'um' | 'varios'>(null);
  const [link, setLink] = useState<{ nome: string; url: string } | null>(null);
  const [links, setLinks] = useState<{ nome: string; email: string; url: string; erro?: string }[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const lista = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return (dado?.membros ?? []).filter(m => !b || m.nome.toLowerCase().includes(b) || m.email.includes(b) || (m.setor ?? '').toLowerCase().includes(b));
  }, [dado, busca]);

  const urlAtivacao = (token: string) => `${dados.enderecoApp}/ativar/${token}`;

  const reconvidar = async (m: Membro) => {
    setErroAcao(null);
    try { const r = await dados.convidar(empresaId, m.nome, m.email, m.setorId); setLink({ nome: m.nome, url: urlAtivacao(r.token) }); recarregar(); }
    catch (e) { setErroAcao((e as Error).message); }
  };
  const desativar = async (m: Membro) => {
    if (!confirm(`Desativar o acesso de ${m.nome}? A pessoa deixa de entrar no app e a licença é liberada. O que ela registrou continua com ela e com o profissional — a empresa nunca vê.`)) return;
    setErroAcao(null);
    try { await dados.alterarMembro(m.id, { status: 'inativo' }); setAviso(`${m.nome} desativado(a).`); recarregar(); }
    catch (e) { setErroAcao((e as Error).message); }
  };
  const mudarSetor = async (m: Membro, setorId: string) => {
    setErroAcao(null);
    try { await dados.alterarMembro(m.id, { setorId: setorId || null }); recarregar(); }
    catch (e) { setErroAcao((e as Error).message); }
  };

  if (carregando && !dado) return <Carregando />;
  if (erro) return <Erro msg={erro} />;
  const uso = dado!.uso;
  const ocupadas = uso.convidados + uso.ativos;

  return (
    <>
      <Cabeca titulo="Funcionários" sub={<>Quem tem acesso ao app. {uso.licencas != null && <b>{ocupadas} de {uso.licencas} licenças</b>} — {uso.ativos} já entraram, {uso.convidados} ainda não.</>}>
        <button className="gbtn gbtn-leve" onClick={() => setModal('varios')}><Ico.pessoas />Convidar vários</button>
        <button className="gbtn gbtn-coral" onClick={() => setModal('um')}><Ico.mais />Convidar</button>
      </Cabeca>
      <Erro msg={erroAcao} /><Aviso msg={aviso} />

      <div className="gcartao gsuave" style={{ marginBottom: 14 }}>
        <b>O que a empresa vê aqui:</b> nome, e-mail, setor e se a pessoa já entrou. <b>O que nunca vê:</b> humor, respostas, práticas, conversas — nada do que a pessoa registra. Isso não é uma tela escondida: o banco não entrega.
      </div>

      <input className="gcampo" placeholder="Buscar por nome, e-mail ou setor" value={busca} onChange={e => setBusca(e.target.value)} style={{ marginBottom: 12 }} />

      {lista.length === 0 ? <Vazio>{dado!.membros.length === 0 ? 'Ninguém convidado ainda. Comece por "Convidar".' : 'Nada com esse texto.'}</Vazio> : (
        <div className="rolagem">
          <table className="tabela">
            <thead><tr><th>Nome</th><th>E-mail</th><th>Setor</th><th>Situação</th><th>Convidado</th><th>Entrou</th><th></th></tr></thead>
            <tbody>
              {lista.map(m => (
                <tr key={m.id}>
                  <td><b>{m.nome}</b></td>
                  <td>{m.email}</td>
                  <td>
                    <select className="gcampo" style={{ minHeight: 32, padding: '4px 8px' }} value={m.setorId ?? ''} onChange={e => mudarSetor(m, e.target.value)} disabled={m.status === 'inativo'}>
                      <option value="">— sem setor —</option>
                      {dado!.setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </td>
                  <td><span className={'gselo ' + m.status}>{NOME_STATUS[m.status]}</span></td>
                  <td className="gpequeno">{dataBr(m.convidadoEm)}</td>
                  <td className="gpequeno">{dataBr(m.ativadoEm)}</td>
                  <td>
                    <div className="acoes-linha">
                      {m.status !== 'ativo' && <button className="gbtn gbtn-texto" onClick={() => reconvidar(m)}>{m.status === 'inativo' ? 'Reativar' : 'Novo link'}</button>}
                      {m.status !== 'inativo' && <button className="gbtn gbtn-texto" onClick={() => desativar(m)}>Desativar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConvidarUm aberto={modal === 'um'} fechar={() => setModal(null)} empresaId={empresaId} setores={dado!.setores}
        aoConvidar={(nome, token) => { setModal(null); setLink({ nome, url: urlAtivacao(token) }); recarregar(); }} />
      <ConvidarVarios aberto={modal === 'varios'} fechar={() => setModal(null)} empresaId={empresaId} setores={dado!.setores}
        aoTerminar={rs => { setModal(null); setLinks(rs.map(r => ({ ...r, url: r.token ? urlAtivacao(r.token) : '' }))); recarregar(); }} />

      <Modal aberto={!!link} fechar={() => setLink(null)} titulo={`Link de ativação — ${link?.nome}`}>
        <p>Mande este link para a pessoa por onde for mais fácil (e-mail, WhatsApp). Ele só funciona com o e-mail cadastrado, uma vez, por 14 dias.</p>
        <div className="gcodigo">{link?.url}</div>
        <div className="gpe"><BotaoCopiar texto={link?.url ?? ''} rotulo="Copiar link" /><button className="gbtn gbtn-coral" onClick={() => setLink(null)}>Fechar</button></div>
      </Modal>

      <Modal aberto={!!links} fechar={() => setLinks(null)} titulo="Convites gerados">
        <p>Um link por pessoa. Copie tudo e distribua; cada link só funciona com o e-mail da própria pessoa.</p>
        <div className="rolagem" style={{ maxHeight: 300, overflow: 'auto' }}>
          <table className="tabela"><tbody>
            {links?.map((r, i) => <tr key={i}><td><b>{r.nome}</b><br /><span className="gpequeno gfraco">{r.email}</span></td><td className={r.erro ? 'suprimido' : ''}>{r.erro ?? <span className="gcodigo">{r.url}</span>}</td></tr>)}
          </tbody></table>
        </div>
        <div className="gpe">
          <BotaoCopiar texto={(links ?? []).filter(r => !r.erro).map(r => `${r.nome} <${r.email}>: ${r.url}`).join('\n')} rotulo="Copiar todos" />
          <button className="gbtn gbtn-coral" onClick={() => setLinks(null)}>Fechar</button>
        </div>
      </Modal>
    </>
  );
}

function ConvidarUm({ aberto, fechar, empresaId, setores, aoConvidar }: { aberto: boolean; fechar: () => void; empresaId: string; setores: { id: string; nome: string }[]; aoConvidar: (nome: string, token: string) => void }) {
  const [nome, setNome] = useState(''); const [email, setEmail] = useState(''); const [setor, setSetor] = useState('');
  const [erro, setErro] = useState<string | null>(null); const [ocupado, setOcupado] = useState(false);
  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setErro(null);
    if (nome.trim().length < 2) { setErro('Digite o nome.'); return; }
    if (!emailValido(email)) { setErro('Esse e-mail não parece completo.'); return; }
    setOcupado(true);
    try { const r = await dados.convidar(empresaId, nome.trim(), email.trim().toLowerCase(), setor || null); setNome(''); setEmail(''); aoConvidar(nome.trim(), r.token); }
    catch (err) { setErro((err as Error).message); } finally { setOcupado(false); }
  };
  return (
    <Modal aberto={aberto} fechar={fechar} titulo="Convidar uma pessoa">
      <form onSubmit={enviar}>
        <label className="rotulo">Nome</label><input className="gcampo" value={nome} onChange={e => setNome(e.target.value)} autoFocus />
        <label className="rotulo">E-mail (o que a pessoa vai usar para entrar)</label><input className="gcampo" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="rotulo">Setor</label>
        <select className="gcampo" value={setor} onChange={e => setSetor(e.target.value)}><option value="">— escolher depois —</option>{setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
        <div style={{ marginTop: 10 }}><Erro msg={erro} /></div>
        <div className="gpe"><button type="button" className="gbtn gbtn-texto" onClick={fechar}>Cancelar</button><button className="gbtn gbtn-coral" type="submit" disabled={ocupado}>{ocupado ? 'Gerando…' : 'Gerar link de ativação'}</button></div>
      </form>
    </Modal>
  );
}

function ConvidarVarios({ aberto, fechar, empresaId, setores, aoTerminar }: { aberto: boolean; fechar: () => void; empresaId: string; setores: { id: string; nome: string }[]; aoTerminar: (r: { nome: string; email: string; token?: string; erro?: string }[]) => void }) {
  const [texto, setTexto] = useState(''); const [setor, setSetor] = useState('');
  const [erro, setErro] = useState<string | null>(null); const [ocupado, setOcupado] = useState(false);
  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setErro(null);
    const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean);
    const pares = linhas.map(l => { const [nome, email] = l.split(/[;,\t]/).map(s => (s ?? '').trim()); return { nome, email: (email ?? '').toLowerCase() }; });
    const ruins = pares.filter(p => !p.nome || !emailValido(p.email));
    if (pares.length === 0) { setErro('Cole ao menos uma linha: Nome; e-mail'); return; }
    if (ruins.length) { setErro(`Confira estas linhas: ${ruins.map(r => r.nome || r.email || '(vazia)').join(', ')}`); return; }
    setOcupado(true);
    const rs: { nome: string; email: string; token?: string; erro?: string }[] = [];
    for (const p of pares) {
      try { const r = await dados.convidar(empresaId, p.nome, p.email, setor || null); rs.push({ ...p, token: r.token }); }
      catch (err) { rs.push({ ...p, erro: (err as Error).message }); }
    }
    setOcupado(false); setTexto(''); aoTerminar(rs);
  };
  return (
    <Modal aberto={aberto} fechar={fechar} titulo="Convidar várias pessoas">
      <form onSubmit={enviar}>
        <p className="gfraco gpequeno">Uma pessoa por linha, no formato <b>Nome; e-mail</b>. Dá para colar direto de uma planilha (duas colunas).</p>
        <textarea className="gcampo" value={texto} onChange={e => setTexto(e.target.value)} placeholder={'Maria Souza; maria@empresa.com.br\nJoão Lima; joao@empresa.com.br'} autoFocus />
        <label className="rotulo">Setor de todos (opcional)</label>
        <select className="gcampo" value={setor} onChange={e => setSetor(e.target.value)}><option value="">— escolher depois —</option>{setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
        <div style={{ marginTop: 10 }}><Erro msg={erro} /></div>
        <div className="gpe"><button type="button" className="gbtn gbtn-texto" onClick={fechar}>Cancelar</button><button className="gbtn gbtn-coral" type="submit" disabled={ocupado}>{ocupado ? 'Gerando…' : 'Gerar os links'}</button></div>
      </form>
    </Modal>
  );
}
