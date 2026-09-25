import { useState, type ReactElement } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Carregando, Erro, FluxoTopo, LinhaAcao, Moldura, Opcao, Respiracao, Selo } from '../componentes/base';
import { Barras, Carinha, Lapis, Lua, Sol, TrilhaIco, Vento } from '../componentes/icones';
import { dados } from '../lib/dados';
import { useCarregar } from '../lib/hooks';
import { useSessao } from '../lib/sessao';
import type { Momento, Pratica } from '../lib/tipos';
import { ENERGIA, HUMOR, INTENCOES, PERGUNTA_HUMOR, dataExtenso, dataLocal, momentoAtual, primeiroNome, saudacao } from '../lib/util';

const ICONE_MOMENTO: Record<Momento, () => ReactElement> = { manha: () => <Sol />, meiodia: () => <Vento />, noite: () => <Lua /> };

function praticaDoMomento(praticas: Pratica[], m: Momento): Pratica | undefined {
  return praticas.find(p => p.momento === m) ?? praticas[0];
}

/* ========================= Hoje ========================= */
export function Hoje() {
  const { conta, demo } = useSessao();
  const nav = useNavigate();
  const hoje = dataLocal();
  const momento = momentoAtual();

  const { dado, erro, carregando } = useCarregar(async () => {
    const [checkins, praticas, feitas, trilhas, passos, concluidos] = await Promise.all([
      dados.checkinsDeHoje(hoje), dados.praticas(), dados.praticasFeitasHoje(hoje), dados.trilhas(), dados.passos(), dados.passosConcluidos(),
    ]);
    return { checkins, praticas, feitas, trilhas, passos, concluidos };
  }, [hoje]);

  if (carregando && !dado) return <Moldura comTopo comAbas><Carregando /></Moldura>;

  const checkin = dado?.checkins.find(c => c.momento === momento) ?? dado?.checkins.slice(-1)[0];
  const respondeuAgora = !!dado?.checkins.find(c => c.momento === momento);
  const pratica = dado ? praticaDoMomento(dado.praticas, momento) : undefined;
  const praticaFeita = !!(pratica && dado?.feitas.includes(pratica.id));
  const Ico = ICONE_MOMENTO[momento];

  // trilha em andamento: a do último passo concluído
  let continuar: { trilhaId: string; nome: string; feitos: number; total: number } | null = null;
  if (dado && dado.concluidos.length) {
    const ultimoPasso = dado.passos.find(p => p.id === dado.concluidos[dado.concluidos.length - 1]);
    const trilha = ultimoPasso && dado.trilhas.find(t => t.id === ultimoPasso.trilhaId);
    if (trilha) {
      const passosDela = dado.passos.filter(p => p.trilhaId === trilha.id);
      const feitos = passosDela.filter(p => dado.concluidos.includes(p.id)).length;
      if (feitos < passosDela.length) continuar = { trilhaId: trilha.id, nome: trilha.nome, feitos, total: passosDela.length };
    }
  }

  return (
    <Moldura comTopo comAbas>
      <div className="entra">
        {demo && <span className="selo-demo">Demonstração · dados só neste aparelho</span>}
        <h1>{saudacao()}, {primeiroNome(conta?.nome)}.</h1>
        <p className="fraco" style={{ marginTop: -4 }}>{dataExtenso()}</p>
        <Erro msg={erro} />

        {!respondeuAgora ? (
          <div className="cartao destaque">
            <h3 style={{ fontSize: 19 }}>{PERGUNTA_HUMOR[momento]}</h3>
            <p>Três toques. Sem certo nem errado — só o que é seu agora.</p>
            <button className="btn btn-coral" style={{ marginTop: 6 }} onClick={() => nav('/hoje/1')}>Responder</button>
          </div>
        ) : checkin && (
          <div className="cartao">
            <h3>Você já se olhou hoje</h3>
            <div className="resumo" style={{ marginTop: 10 }}><div className="ico"><Carinha n={checkin.humor} /></div><div><b>{HUMOR.find(h => h.v === checkin.humor)?.t}</b><span className="fraco pequeno" style={{ display: 'block' }}>como você está</span></div></div>
            <div className="resumo"><div className="ico"><Barras n={checkin.energia} /></div><div><b>{ENERGIA.find(h => h.v === checkin.energia)?.t}</b><span className="fraco pequeno" style={{ display: 'block' }}>energia</span></div></div>
            {checkin.intencao && <p className="assinatura" style={{ margin: '10px 0 0' }}>"{checkin.intencao}"</p>}
            <button className="btn btn-texto" style={{ marginTop: 4 }} onClick={() => nav('/hoje/1')}>Mudou? Responder de novo</button>
          </div>
        )}

        {pratica && (
          <LinhaAcao icone={<Ico />} titulo={pratica.nome + (praticaFeita ? ' — feita' : '')} sub={pratica.descricao ?? undefined}
            onClick={() => nav('/pratica', { state: { pratica, de: '/' } })} />
        )}
        {continuar
          ? <LinhaAcao icone={<TrilhaIco />} titulo={`Continuar: ${continuar.nome}`} sub={`Passo ${continuar.feitos + 1} de ${continuar.total}`} para={`/trilhas/${continuar.trilhaId}/passo/${continuar.feitos + 1}`} />
          : <LinhaAcao icone={<TrilhaIco />} titulo="Começar uma trilha" sub="Caminhos curtos, no seu ritmo" para="/trilhas" />}
      </div>
    </Moldura>
  );
}

/* ========================= Check-in: uma pergunta por tela ========================= */
export function Checkin() {
  const { n } = useParams();
  const passo = Math.min(3, Math.max(1, Number(n) || 1));
  const nav = useNavigate();
  const loc = useLocation();
  const momento = momentoAtual();
  const estado = (loc.state ?? {}) as { humor?: number; energia?: number };
  const [escrevendo, setEscrevendo] = useState(false);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cab = (titulo: string) => (
    <>
      <FluxoTopo aoVoltar={() => (passo === 1 ? nav('/') : nav(`/hoje/${passo - 1}`, { state: estado }))} total={3} atual={passo - 1} />
      <h1>{titulo}</h1>
    </>
  );

  const terminar = async (intencao: string | null) => {
    if (!estado.humor || !estado.energia) { nav('/hoje/1'); return; }
    setOcupado(true); setErro(null);
    try {
      await dados.gravarCheckin({ data: dataLocal(), momento, humor: estado.humor, energia: estado.energia, intencao });
      nav('/hoje/pronto', { replace: true });
    } catch (e) { setErro((e as Error).message); setOcupado(false); }
  };

  if (passo === 1) return (
    <Moldura>
      <div className="entra">{cab(PERGUNTA_HUMOR[momento])}
        <div className="opcoes">
          {HUMOR.map(o => <Opcao key={o.v} icone={<Carinha n={o.v} />} marcada={estado.humor === o.v} onClick={() => nav('/hoje/2', { state: { ...estado, humor: o.v } })}>{o.t}</Opcao>)}
        </div>
      </div>
    </Moldura>
  );

  if (passo === 2) return (
    <Moldura>
      <div className="entra">{cab('E a sua energia?')}
        <div className="opcoes">
          {ENERGIA.map(o => <Opcao key={o.v} icone={<Barras n={o.v} />} marcada={estado.energia === o.v} onClick={() => nav('/hoje/3', { state: { ...estado, energia: o.v } })}>{o.t}</Opcao>)}
        </div>
      </div>
    </Moldura>
  );

  return (
    <Moldura>
      <div className="entra">{cab('Quer guardar uma intenção para hoje?')}
        <p className="fraco">Não precisa. Mas ajuda a lembrar do que importa.</p>
        <div className="chips">
          {INTENCOES.map(t => <button key={t} className="chip" disabled={ocupado} onClick={() => terminar(t)}>{t}</button>)}
        </div>
        {!escrevendo
          ? <button className="btn btn-leve" style={{ marginTop: 14 }} onClick={() => setEscrevendo(true)}><Lapis />Escrever a minha</button>
          : <>
              <input className="campo" placeholder="Ex.: ir com mais calma na reunião" maxLength={120} value={texto} onChange={e => setTexto(e.target.value)} autoFocus />
              <button className="btn btn-coral" style={{ marginTop: 10 }} disabled={ocupado} onClick={() => terminar(texto.trim() || null)}>Guardar</button>
            </>}
        <Erro msg={erro} />
        <button className="btn btn-texto" disabled={ocupado} onClick={() => terminar(null)}>Pular por hoje</button>
      </div>
    </Moldura>
  );
}

/* ========================= Pronto por hoje ========================= */
export function Pronto() {
  const nav = useNavigate();
  const momento = momentoAtual();
  const { dado } = useCarregar(() => dados.praticas());
  const pratica = dado ? praticaDoMomento(dado, momento) : undefined;
  return (
    <Moldura>
      <div className="entra">
        <Selo />
        <h1 className="centro">Pronto por hoje.</h1>
        <p className="lead centro">Você parou um instante para se olhar. Isso já é cuidar.</p>
        {pratica && (
          <div className="cartao suave" style={{ marginTop: 18 }}>
            <h3>{pratica.nome}</h3><p>{pratica.descricao}</p>
            <button className="btn btn-coral" style={{ marginTop: 6 }} onClick={() => nav('/pratica', { state: { pratica, de: '/' }, replace: true })}>Fazer agora</button>
          </div>
        )}
        <button className="btn btn-texto" style={{ marginTop: 6 }} onClick={() => nav('/', { replace: true })}>Agora não</button>
      </div>
    </Moldura>
  );
}

/* ========================= Prática guiada ========================= */
export function PraticaGuiada() {
  const nav = useNavigate();
  const loc = useLocation();
  const { pratica, de, segundos, titulo } = (loc.state ?? {}) as { pratica?: Pratica; de?: string; segundos?: number; titulo?: string };
  const seg = pratica?.duracaoSeg ?? segundos ?? 60;
  const nome = pratica?.nome ?? titulo ?? 'Respirar';
  const [inicio] = useState(Date.now());

  const terminar = async () => {
    if (pratica) { try { await dados.registrarPratica(pratica.id, Math.round((Date.now() - inicio) / 1000)); } catch { /* não bloqueia a saída */ } }
    nav(de ?? '/', { replace: true });
  };

  return (
    <Moldura>
      <div className="entra">
        <FluxoTopo aoVoltar={terminar} rotulo="Sair" />
        <h1>{nome}</h1>
        <p className="fraco">Siga a bolinha. Ela cresce quando você inspira e encolhe quando solta.</p>
        <Respiracao segundos={seg} aoTerminar={terminar} />
        <button className="btn btn-leve" onClick={terminar}>Terminar</button>
      </div>
    </Moldura>
  );
}
