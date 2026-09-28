import { motion } from 'framer-motion';
import { useState, type ReactElement } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CORES_HUMOR, Carregando, Erro, FluxoTopo, LinhaAcao, Moldura, Respiracao, Selo, Semana } from '../componentes/base';
import { Carinha, Lapis, Lua, Sol, TrilhaIco, Vento } from '../componentes/icones';
import { dados } from '../lib/dados';
import { useCarregar } from '../lib/hooks';
import { useSessao } from '../lib/sessao';
import type { Checkin as TCheckin, Momento, Pratica } from '../lib/tipos';
import { ENERGIA, HUMOR, INTENCOES, PERGUNTA_HUMOR, dataExtenso, dataLocal, momentoAtual, primeiroNome, saudacao } from '../lib/util';

const ICONE_MOMENTO: Record<Momento, () => ReactElement> = { manha: () => <Sol />, meiodia: () => <Vento />, noite: () => <Lua /> };
const TOM_MOMENTO: Record<Momento, 'ambar' | 'rosa' | 'ameixa'> = { manha: 'ambar', meiodia: 'rosa', noite: 'ameixa' };

function praticaDoMomento(praticas: Pratica[], m: Momento): Pratica | undefined { return praticas.find(p => p.momento === m) ?? praticas[0]; }

/** Os últimos 7 dias, terminando hoje, coloridos pelo humor (o último do dia). */
function semana(historico: TCheckin[]) {
  const nomes = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const dias: { rotulo: string; humor: number | null; hoje: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const iso = dataLocal(d);
    const doDia = historico.filter(c => c.data === iso);
    dias.push({ rotulo: nomes[d.getDay()], humor: doDia.length ? doDia[doDia.length - 1].humor : null, hoje: i === 0 });
  }
  return dias;
}

/* ========================= Hoje ========================= */
export function Hoje() {
  const { conta, demo } = useSessao();
  const nav = useNavigate();
  const hoje = dataLocal();
  const momento = momentoAtual();

  const { dado, erro, carregando } = useCarregar(async () => {
    const [historico, praticas, feitas, trilhas, passos, concluidos] = await Promise.all([
      dados.historico(7), dados.praticas(), dados.praticasFeitasHoje(hoje), dados.trilhas(), dados.passos(), dados.passosConcluidos(),
    ]);
    return { historico, praticas, feitas, trilhas, passos, concluidos };
  }, [hoje]);

  if (carregando && !dado) return <Moldura comTopo comAbas><Carregando /></Moldura>;

  const deHoje = (dado?.historico ?? []).filter(c => c.data === hoje);
  const checkin = deHoje.find(c => c.momento === momento) ?? deHoje.slice(-1)[0];
  const respondeuAgora = !!deHoje.find(c => c.momento === momento);
  const pratica = dado ? praticaDoMomento(dado.praticas, momento) : undefined;
  const praticaFeita = !!(pratica && dado?.feitas.includes(pratica.id));
  const Ico = ICONE_MOMENTO[momento];
  const diasSeguidos = (() => { let n = 0; for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); if ((dado?.historico ?? []).some(c => c.data === dataLocal(d))) n++; else break; } return n; })();

  let continuar: { trilhaId: string; nome: string; feitos: number; total: number } | null = null;
  if (dado && dado.concluidos.length) {
    const ultimo = dado.passos.find(p => p.id === dado.concluidos[dado.concluidos.length - 1]);
    const trilha = ultimo && dado.trilhas.find(t => t.id === ultimo.trilhaId);
    if (trilha) {
      const dela = dado.passos.filter(p => p.trilhaId === trilha.id);
      const feitos = dela.filter(p => dado.concluidos.includes(p.id)).length;
      if (feitos < dela.length) continuar = { trilhaId: trilha.id, nome: trilha.nome, feitos, total: dela.length };
    }
  }

  return (
    <Moldura comTopo comAbas>
      {demo && <span className="selo-demo">Demonstração · dados só neste aparelho</span>}
      <motion.section className={'heroi ' + momento} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <i className="bolha b1" /><i className="bolha b2" />
        <h1>{saudacao()}, {primeiroNome(conta?.nome)}.</h1>
        <p className="data">{dataExtenso()}{diasSeguidos > 1 && ` · ${diasSeguidos} dias seguidos`}</p>
        {!respondeuAgora ? (
          <>
            <p className="pergunta">{PERGUNTA_HUMOR[momento]}</p>
            <motion.button whileTap={{ scale: 0.97 }} className="btn btn-branco" onClick={() => nav('/hoje/1')}>Responder — leva 20 segundos</motion.button>
          </>
        ) : checkin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, flex: 'none' }}><Carinha n={checkin.humor} viva /></div>
            <div style={{ flex: 1 }}>
              <b style={{ display: 'block' }}>{HUMOR.find(h => h.v === checkin.humor)?.t} · energia {ENERGIA.find(h => h.v === checkin.energia)?.t.toLowerCase()}</b>
              {checkin.intencao ? <span className="pequeno" style={{ opacity: 0.9 }}>"{checkin.intencao}"</span> : <span className="pequeno" style={{ opacity: 0.85 }}>Você já se olhou hoje.</span>}
            </div>
            <button className="btn btn-texto" style={{ width: 'auto', color: 'inherit', opacity: 0.85, padding: '4px 6px', minHeight: 0 }} onClick={() => nav('/hoje/1')}>Mudou?</button>
          </div>
        )}
      </motion.section>

      <Semana dias={semana(dado?.historico ?? [])} />
      <p className="pequeno fraco centro" style={{ margin: '2px 0 12px' }}>Sua semana, na cor de como você estava.</p>
      <Erro msg={erro} />

      {pratica && (
        <LinhaAcao icone={<Ico />} tom={TOM_MOMENTO[momento]} titulo={pratica.nome + (praticaFeita ? ' — feita' : '')} sub={pratica.descricao ?? undefined}
          onClick={() => nav('/pratica', { state: { pratica, de: '/' } })} />
      )}
      {continuar
        ? <LinhaAcao icone={<TrilhaIco />} titulo={`Continuar: ${continuar.nome}`} sub={`Passo ${continuar.feitos + 1} de ${continuar.total}`} para={`/trilhas/${continuar.trilhaId}/passo/${continuar.feitos + 1}`} />
        : <LinhaAcao icone={<TrilhaIco />} titulo="Começar uma trilha" sub="Caminhos curtos, no seu ritmo" para="/trilhas" />}
    </Moldura>
  );
}

/* ========================= Check-in ========================= */
export function Checkin() {
  const { n } = useParams();
  const passo = Math.min(3, Math.max(1, Number(n) || 1));
  const nav = useNavigate();
  const loc = useLocation();
  const momento = momentoAtual();
  const estado = (loc.state ?? {}) as { humor?: number; energia?: number };
  const [humor, setHumor] = useState<number | null>(estado.humor ?? null);
  const [energia, setEnergia] = useState<number | null>(estado.energia ?? null);
  const [escrevendo, setEscrevendo] = useState(false);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cab = (titulo: string, sub?: string) => (
    <>
      <FluxoTopo aoVoltar={() => (passo === 1 ? nav('/') : nav(`/hoje/${passo - 1}`, { state: estado }))} total={3} atual={passo - 1} />
      <h1 className="grande">{titulo}</h1>
      {sub && <p className="fraco">{sub}</p>}
    </>
  );

  const escolherHumor = (v: number) => { setHumor(v); setTimeout(() => nav('/hoje/2', { state: { ...estado, humor: v } }), 380); };
  const escolherEnergia = (v: number) => { setEnergia(v); setTimeout(() => nav('/hoje/3', { state: { ...estado, energia: v } }), 380); };

  const terminar = async (intencao: string | null) => {
    if (!estado.humor || !estado.energia) { nav('/hoje/1'); return; }
    setOcupado(true); setErro(null);
    try {
      await dados.gravarCheckin({ data: dataLocal(), momento, humor: estado.humor, energia: estado.energia, intencao });
      nav('/hoje/pronto', { replace: true, state: { humor: estado.humor } });
    } catch (e) { setErro((e as Error).message); setOcupado(false); }
  };

  if (passo === 1) return (
    <Moldura>
      <motion.div className="fundo-humor" animate={{ background: humor ? `radial-gradient(circle at 50% 30%, ${CORES_HUMOR[humor - 1]}55, transparent 60%)` : 'radial-gradient(circle at 50% 30%, transparent, transparent)' }} transition={{ duration: 0.5 }} />
      {cab(PERGUNTA_HUMOR[momento], 'Sem certo nem errado. Só o que é seu agora.')}
      <div className="faces">
        {HUMOR.map(o => {
          const sel = humor === o.v;
          return (
            <motion.button key={o.v} className={'face' + (sel ? ' marcada' : '')} onClick={() => escolherHumor(o.v)}
              animate={{ scale: sel ? 1.22 : humor ? 0.88 : 1, opacity: humor && !sel ? 0.55 : 1 }} whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}>
              <Carinha n={o.v} viva={sel} /><b>{o.t}</b>
            </motion.button>
          );
        })}
      </div>
    </Moldura>
  );

  if (passo === 2) return (
    <Moldura>
      {cab('E a sua energia?', 'Toque na barra que parece com você.')}
      <div className="barras">
        {ENERGIA.map(o => {
          const sel = energia === o.v; const ativa = energia != null && o.v <= energia;
          const cores = ['#FFD166', '#F5A524', '#F58A3C', '#E2563C', '#C4432D'];
          return (
            <motion.button key={o.v} className="barra-e" onClick={() => escolherEnergia(o.v)} whileTap={{ scale: 0.95 }}>
              <motion.i animate={{ height: `${20 + o.v * 15}%`, background: ativa ? cores[(energia ?? 1) - 1] : 'var(--areia)', borderColor: ativa ? 'transparent' : 'var(--linha)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }} />
              <b style={sel ? { color: 'var(--tinta)' } : undefined}>{o.t}</b>
            </motion.button>
          );
        })}
      </div>
    </Moldura>
  );

  return (
    <Moldura>
      {cab('Quer guardar uma intenção para hoje?', 'Não precisa. Mas ajuda a lembrar do que importa.')}
      <div className="chips">
        {INTENCOES.map((t, i) => <motion.button key={t} className="chip" disabled={ocupado} onClick={() => terminar(t)} whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>{t}</motion.button>)}
      </div>
      {!escrevendo
        ? <button className="btn btn-leve" style={{ marginTop: 14 }} onClick={() => setEscrevendo(true)}><Lapis />Escrever a minha</button>
        : <>
            <input className="campo" placeholder="Ex.: ir com mais calma na reunião" maxLength={120} value={texto} onChange={e => setTexto(e.target.value)} autoFocus />
            <button className="btn btn-coral" style={{ marginTop: 10 }} disabled={ocupado} onClick={() => terminar(texto.trim() || null)}>Guardar</button>
          </>}
      <Erro msg={erro} />
      <button className="btn btn-texto" disabled={ocupado} onClick={() => terminar(null)}>Pular por hoje</button>
    </Moldura>
  );
}

/* ========================= Pronto ========================= */
export function Pronto() {
  const nav = useNavigate();
  const loc = useLocation();
  const humor = ((loc.state ?? {}) as { humor?: number }).humor;
  const momento = momentoAtual();
  const { dado } = useCarregar(() => dados.praticas());
  const pratica = dado ? praticaDoMomento(dado, momento) : undefined;
  const frase = humor && humor <= 2 ? 'Dia pesado também conta. Você apareceu — isso já é cuidar.' : 'Você parou um instante para se olhar. Isso já é cuidar.';
  return (
    <Moldura>
      <Selo />
      <h1 className="centro grande">Pronto por hoje.</h1>
      <p className="lead centro">{frase}</p>
      {pratica && (
        <motion.div className="cartao ambar" style={{ marginTop: 18 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3>{pratica.nome}</h3><p>{pratica.descricao}</p>
          <button className="btn btn-coral" style={{ marginTop: 6 }} onClick={() => nav('/pratica', { state: { pratica, de: '/' }, replace: true })}>Fazer agora</button>
        </motion.div>
      )}
      <button className="btn btn-texto" style={{ marginTop: 6 }} onClick={() => nav('/', { replace: true })}>Agora não</button>
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
    if (pratica) { try { await dados.registrarPratica(pratica.id, Math.round((Date.now() - inicio) / 1000)); } catch { /* não bloqueia */ } }
    nav(de ?? '/', { replace: true });
  };
  return (
    <Moldura>
      <FluxoTopo aoVoltar={terminar} rotulo="Sair" />
      <h1>{nome}</h1>
      <p className="fraco">Siga a bolinha. Ela cresce quando você inspira e encolhe quando solta.</p>
      <Respiracao segundos={seg} aoTerminar={terminar} />
      <button className="btn btn-leve" onClick={terminar}>Terminar</button>
    </Moldura>
  );
}
