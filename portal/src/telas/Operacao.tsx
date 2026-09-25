import { useState, type FormEvent } from 'react';
import { Aviso, Cabeca, Carregando, Erro, Ico, Modal, Vazio } from '../componentes/base';
import { dados } from '../lib/dados';
import { useCarregar } from '../lib/hooks';
import { useSessao } from '../lib/sessao';
import { PAPEIS, type Contrato, type Empresa, type Papel } from '../lib/tipos';
import { dataBr, emailValido, mesAnterior, mesBr, primeiroDiaDoMes } from '../lib/util';

/** Operação do Contigo: criar empresa, contrato e primeiro acesso — sem SQL. */
export function Operacao() {
  const { escolherEmpresa, recarregar: recarregarSessao } = useSessao();
  const { dado, erro, carregando, recarregar } = useCarregar(() => dados.empresas());
  const [modal, setModal] = useState<null | 'empresa' | 'contrato' | 'acesso'>(null);
  const [alvo, setAlvo] = useState<Empresa | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState(mesAnterior());
  const [calculando, setCalculando] = useState(false);

  const calcular = async () => {
    setCalculando(true); setErroAcao(null);
    try { const r = await dados.calcularAgregados(periodo); setAviso(`${mesBr(r.periodo)}: ${r.linhas} indicador(es) publicados, ${r.recortesSuprimidos} recorte(s) suprimidos por k < ${r.k}.`); }
    catch (e) { setErroAcao((e as Error).message); } finally { setCalculando(false); }
  };

  if (carregando && !dado) return <Carregando />;
  if (erro) return <Erro msg={erro} />;

  return (
    <>
      <Cabeca titulo="Empresas e contratos" sub="A parte do Contigo: quem é cliente, quantas licenças, e quem administra o portal de cada empresa.">
        <button className="btn btn-coral" onClick={() => { setAlvo(null); setModal('empresa'); }}><Ico.mais />Nova empresa</button>
      </Cabeca>
      <Erro msg={erroAcao} /><Aviso msg={aviso} />

      <div className="cartao" style={{ marginBottom: 14 }}>
        <h3>Agregação NR-1</h3>
        <p className="fraco pequeno">Roda sozinha no dia 1 de cada mês. Aqui você pode recalcular um mês — útil para ver o painel logo depois de os primeiros check-ins entrarem.</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="campo" type="month" style={{ width: 'auto' }} value={periodo.slice(0, 7)} onChange={e => setPeriodo(e.target.value + '-01')} />
          <button className="btn btn-leve" onClick={() => setPeriodo(primeiroDiaDoMes())}>Este mês</button>
          <button className="btn btn-coral" onClick={calcular} disabled={calculando}><Ico.atualizar />{calculando ? 'Calculando…' : 'Calcular agora'}</button>
        </div>
      </div>

      {dado!.length === 0 ? <Vazio>Nenhuma empresa cadastrada.</Vazio> : dado!.map(e => <CartaoEmpresa key={e.id} empresa={e}
        abrirContrato={() => { setAlvo(e); setModal('contrato'); }}
        abrirAcesso={() => { setAlvo(e); setModal('acesso'); }}
        entrar={async () => { escolherEmpresa(e.id); await recarregarSessao(); }}
        aoMudar={recarregar} />)}

      <NovaEmpresa aberto={modal === 'empresa'} fechar={() => setModal(null)} aoCriar={async e => { setModal(null); setAviso(`${e.nome} criada. Agora crie o contrato e libere o primeiro acesso.`); recarregar(); }} />
      {alvo && <NovoContrato aberto={modal === 'contrato'} fechar={() => setModal(null)} empresa={alvo} aoCriar={() => { setModal(null); setAviso(`Contrato criado para ${alvo.nome}.`); recarregar(); }} />}
      {alvo && <NovoAcesso aberto={modal === 'acesso'} fechar={() => setModal(null)} empresa={alvo} aoCriar={em => { setModal(null); setAviso(`Acesso liberado para ${em} em ${alvo.nome}.`); recarregar(); }} />}
    </>
  );
}

function CartaoEmpresa({ empresa, abrirContrato, abrirAcesso, entrar, aoMudar }: { empresa: Empresa; abrirContrato: () => void; abrirAcesso: () => void; entrar: () => void; aoMudar: () => void }) {
  const { dado } = useCarregar(async () => {
    const [contratos, uso, acessos] = await Promise.all([dados.contratos(empresa.id), dados.usoLicencas(empresa.id).catch(() => null), dados.acessos(empresa.id).catch(() => [])]);
    return { contratos, uso, acessos };
  }, [empresa.id]);
  const vigente = dado?.contratos.find(c => c.ativo);
  const encerrar = async (c: Contrato) => { if (!confirm(`Encerrar o contrato de ${empresa.nome}? A empresa deixa de conseguir convidar.`)) return; await dados.encerrarContrato(c.id); aoMudar(); };
  const alternar = async () => { await dados.alterarEmpresa(empresa.id, { ativa: !empresa.ativa }); aoMudar(); };
  return (
    <div className="cartao">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 18 }}>{empresa.nome} {!empresa.ativa && <span className="selo inativo">inativa</span>}</h3>
          <p className="pequeno fraco" style={{ margin: 0 }}>{empresa.cnpj ?? 'sem CNPJ'}</p>
        </div>
        <div className="acoes">
          <button className="btn btn-leve" onClick={entrar}>Abrir como esta empresa</button>
          <button className="btn btn-leve" onClick={abrirAcesso}><Ico.chave />Liberar acesso</button>
          <button className="btn btn-leve" onClick={abrirContrato}><Ico.contrato />Novo contrato</button>
          <button className="btn btn-texto" onClick={alternar}>{empresa.ativa ? 'Inativar' : 'Reativar'}</button>
        </div>
      </div>
      <div className="grade" style={{ marginTop: 12 }}>
        <div className="cartao suave">
          <b>Contrato</b>
          {vigente ? <p className="pequeno" style={{ margin: '4px 0 0' }}>{vigente.licencas} licenças · {dataBr(vigente.vigenciaInicio)} → {dataBr(vigente.vigenciaFim)} · {vigente.camada2 ? 'com' : 'sem'} Vamos conversar
            <br /><button className="btn btn-texto" style={{ padding: 0 }} onClick={() => encerrar(vigente)}>Encerrar</button></p>
            : <p className="pequeno fraco" style={{ margin: '4px 0 0' }}>Sem contrato vigente — a empresa não consegue convidar.</p>}
        </div>
        <div className="cartao suave"><b>Uso</b><p className="pequeno" style={{ margin: '4px 0 0' }}>{dado?.uso ? `${dado.uso.ativos} ativos · ${dado.uso.convidados} convidados` : '—'}</p></div>
        <div className="cartao suave"><b>Acessos ao portal</b><p className="pequeno" style={{ margin: '4px 0 0' }}>{dado?.acessos.length ? dado.acessos.filter(a => a.ativo).map(a => `${a.email} (${a.papel})`).join(', ') : 'ninguém ainda'}</p></div>
      </div>
    </div>
  );
}

function NovaEmpresa({ aberto, fechar, aoCriar }: { aberto: boolean; fechar: () => void; aoCriar: (e: Empresa) => void }) {
  const [nome, setNome] = useState(''); const [cnpj, setCnpj] = useState(''); const [erro, setErro] = useState<string | null>(null);
  const enviar = async (e: FormEvent) => { e.preventDefault(); setErro(null); if (nome.trim().length < 2) { setErro('Digite o nome.'); return; }
    try { const emp = await dados.criarEmpresa(nome, cnpj || null); setNome(''); setCnpj(''); aoCriar(emp); } catch (err) { setErro((err as Error).message); } };
  return (
    <Modal aberto={aberto} fechar={fechar} titulo="Nova empresa cliente">
      <form onSubmit={enviar}>
        <label className="rotulo">Razão social ou nome</label><input className="campo" value={nome} onChange={e => setNome(e.target.value)} autoFocus />
        <label className="rotulo">CNPJ (opcional)</label><input className="campo" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
        <div style={{ marginTop: 10 }}><Erro msg={erro} /></div>
        <div className="pe"><button type="button" className="btn btn-texto" onClick={fechar}>Cancelar</button><button className="btn btn-coral" type="submit">Criar</button></div>
      </form>
    </Modal>
  );
}

function NovoContrato({ aberto, fechar, empresa, aoCriar }: { aberto: boolean; fechar: () => void; empresa: Empresa; aoCriar: () => void }) {
  const hoje = new Date(); const fim = new Date(hoje); fim.setFullYear(fim.getFullYear() + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [licencas, setLicencas] = useState(30); const [ini, setIni] = useState(iso(hoje)); const [fimS, setFim] = useState(iso(fim));
  const [c2, setC2] = useState(true); const [c3, setC3] = useState(false); const [erro, setErro] = useState<string | null>(null);
  const enviar = async (e: FormEvent) => { e.preventDefault(); setErro(null);
    try { await dados.criarContrato(empresa.id, { licencas, vigenciaInicio: ini, vigenciaFim: fimS, camada2: c2, camada3: c3 }); aoCriar(); } catch (err) { setErro((err as Error).message); } };
  return (
    <Modal aberto={aberto} fechar={fechar} titulo={`Novo contrato — ${empresa.nome}`}>
      <form onSubmit={enviar}>
        <div className="linha-form">
          <div><label className="rotulo">Licenças</label><input className="campo" type="number" min={1} value={licencas} onChange={e => setLicencas(Number(e.target.value))} /></div>
          <div><label className="rotulo">Início</label><input className="campo" type="date" value={ini} onChange={e => setIni(e.target.value)} /></div>
          <div><label className="rotulo">Fim</label><input className="campo" type="date" value={fimS} onChange={e => setFim(e.target.value)} /></div>
        </div>
        <label className="rotulo" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={c2} onChange={e => setC2(e.target.checked)} /> Camada 2 — Vamos conversar</label>
        <label className="rotulo" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={c3} onChange={e => setC3(e.target.checked)} /> Camada 3 — Pronto atendimento (por uso; exige protocolo fechado)</label>
        <div style={{ marginTop: 10 }}><Erro msg={erro} /></div>
        <div className="pe"><button type="button" className="btn btn-texto" onClick={fechar}>Cancelar</button><button className="btn btn-coral" type="submit">Criar contrato</button></div>
      </form>
    </Modal>
  );
}

function NovoAcesso({ aberto, fechar, empresa, aoCriar }: { aberto: boolean; fechar: () => void; empresa: Empresa; aoCriar: (email: string) => void }) {
  const [email, setEmail] = useState(''); const [papel, setPapel] = useState<Papel>('admin'); const [erro, setErro] = useState<string | null>(null);
  const enviar = async (e: FormEvent) => { e.preventDefault(); setErro(null); if (!emailValido(email)) { setErro('Esse e-mail não parece completo.'); return; }
    try { await dados.concederAcesso(empresa.id, email.trim().toLowerCase(), papel); aoCriar(email.trim().toLowerCase()); setEmail(''); } catch (err) { setErro((err as Error).message); } };
  return (
    <Modal aberto={aberto} fechar={fechar} titulo={`Liberar acesso — ${empresa.nome}`}>
      <form onSubmit={enviar}>
        <p className="fraco pequeno">A pessoa precisa ter criado a conta no portal ("Criar conta" na entrada). Se ainda não criou, o banco avisa.</p>
        <label className="rotulo">E-mail</label><input className="campo" type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
        <label className="rotulo">Papel</label>
        <select className="campo" value={papel} onChange={e => setPapel(e.target.value as Papel)}>{PAPEIS.map(p => <option key={p.valor} value={p.valor}>{p.nome} — {p.descricao}</option>)}</select>
        <div style={{ marginTop: 10 }}><Erro msg={erro} /></div>
        <div className="pe"><button type="button" className="btn btn-texto" onClick={fechar}>Cancelar</button><button className="btn btn-coral" type="submit">Liberar</button></div>
      </form>
    </Modal>
  );
}
