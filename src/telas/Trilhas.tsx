import { motion } from 'framer-motion';
import type { ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Anel, BotaoOuvir, CORES_TEMA, Carregando, Erro, FluxoTopo, Moldura, Opcao, Selo } from '../componentes/base';
import { Bussola, Coracao, Lua, Ok, Pessoa, Pessoas, Seta, Sol, Vento } from '../componentes/icones';
import { dados } from '../lib/dados';
import { useCarregar } from '../lib/hooks';
import type { Passo, Trilha } from '../lib/tipos';
import { TEMAS } from '../lib/util';

const ICONE_TEMA: Record<string, () => ReactElement> = {
  sono: () => <Lua />, ansiedade: () => <Vento />, trabalho: () => <Sol />, autoestima: () => <Pessoa />,
  relacoes: () => <Pessoas />, luto: () => <Coracao />, proposito: () => <Bussola />,
};

function useCatalogo() {
  return useCarregar(async () => {
    const [trilhas, passos, concluidos] = await Promise.all([dados.trilhas(), dados.passos(), dados.passosConcluidos()]);
    return { trilhas, passos, concluidos };
  });
}
function progresso(trilha: Trilha, passos: Passo[], concluidos: string[]) {
  const dela = passos.filter(p => p.trilhaId === trilha.id).sort((a, b) => a.ordem - b.ordem);
  const feitos = dela.filter(p => concluidos.includes(p.id)).length;
  return { dela, feitos, total: dela.length };
}
const cor = (codigo: string) => CORES_TEMA[codigo] ?? '#E2563C';

/* ========================= Trilhas ========================= */
export function Trilhas() {
  const nav = useNavigate();
  const { dado, erro, carregando } = useCatalogo();
  if (carregando && !dado) return <Moldura comTopo comAbas><Carregando /></Moldura>;
  const publicadas = dado?.trilhas ?? [];
  const porCodigo = (c: string) => publicadas.find(t => t.codigo === c);

  let andamento: { trilha: Trilha; feitos: number; total: number; proximo: Passo } | null = null;
  if (dado) for (const t of publicadas) {
    const { dela, feitos, total } = progresso(t, dado.passos, dado.concluidos);
    if (feitos > 0 && feitos < total) { andamento = { trilha: t, feitos, total, proximo: dela[feitos] }; break; }
  }

  return (
    <Moldura comTopo comAbas>
      <Erro msg={erro} />
      {andamento ? (
        <>
          <h1>Trilhas</h1>
          <motion.div className="tema-heroi" style={{ '--cor': cor(andamento.trilha.codigo) } as React.CSSProperties} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <span className="pequeno" style={{ opacity: 0.9 }}>Continuar</span>
            <h1>{andamento.trilha.nome}</h1>
            <p>Passo {andamento.feitos + 1} de {andamento.total} — {andamento.proximo.titulo}</p>
            <motion.button whileTap={{ scale: 0.97 }} className="btn btn-branco" style={{ marginTop: 12 }} onClick={() => nav(`/trilhas/${andamento!.trilha.id}/passo/${andamento!.feitos + 1}`)}>Continuar</motion.button>
          </motion.div>
          <h2>Outras trilhas</h2>
        </>
      ) : (
        <>
          <h1 className="grande">O que mais pesa agora?</h1>
          <p className="fraco">Toque em uma. A gente sugere por onde começar.</p>
          <div className="opcoes">
            {TEMAS.map((tema, i) => {
              const Ico = ICONE_TEMA[tema.codigo]; const t = porCodigo(tema.codigo);
              return (
                <motion.div key={tema.codigo} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Opcao icone={<Ico />} cor={cor(tema.codigo)} sub={t ? undefined : 'em breve'} onClick={() => nav(t ? `/trilhas/${t.id}` : `/trilhas/tema/${tema.codigo}`)}>{tema.pergunta}</Opcao>
                </motion.div>
              );
            })}
          </div>
          <h2>Todas as trilhas</h2>
        </>
      )}
      {TEMAS.map(tema => {
        const t = porCodigo(tema.codigo); const Ico = ICONE_TEMA[tema.codigo];
        const pr = t && dado ? progresso(t, dado.passos, dado.concluidos) : null;
        return (
          <Link key={tema.codigo} className={'trilha-card' + (t ? '' : ' breve')} style={{ '--cor': cor(tema.codigo) } as React.CSSProperties} to={t ? `/trilhas/${t.id}` : `/trilhas/tema/${tema.codigo}`}>
            <div className="anel"><Anel fracao={pr ? pr.feitos / pr.total : 0} cor={cor(tema.codigo)} /><span className="ico"><Ico /></span></div>
            <div><b>{tema.nome}</b><span>{t ? (pr && pr.feitos > 0 ? `${pr.feitos} de ${pr.total} passos` : tema.sub) : 'Em breve'}</span></div>
            <div className="seta"><Seta /></div>
          </Link>
        );
      })}
    </Moldura>
  );
}

/* ========================= Tema ainda sem trilha ========================= */
export function TemaEmBreve() {
  const { codigo } = useParams();
  const tema = TEMAS.find(t => t.codigo === codigo);
  return (
    <Moldura comTopo comAbas>
      <FluxoTopo voltar="/trilhas" rotulo="Trilhas" />
      <div className="tema-heroi" style={{ '--cor': cor(codigo ?? '') } as React.CSSProperties}><h1>{tema?.nome ?? 'Trilha'}</h1><p>{tema?.sub}</p></div>
      <div className="cartao suave"><h3>Ainda estamos escrevendo esta trilha</h3><p>Ela passa por revisão clínica antes de chegar aqui. Quando estiver pronta, aparece na lista.</p></div>
    </Moldura>
  );
}

/* ========================= Trilha ========================= */
export function TrilhaTela() {
  const { id } = useParams();
  const nav = useNavigate();
  const { dado, carregando } = useCatalogo();
  if (carregando && !dado) return <Moldura comTopo comAbas><Carregando /></Moldura>;
  const t = dado?.trilhas.find(x => x.id === id);
  if (!t || !dado) return <TemaEmBreve />;
  const { dela, feitos, total } = progresso(t, dado.passos, dado.concluidos);
  return (
    <Moldura comTopo comAbas>
      <FluxoTopo voltar="/trilhas" rotulo="Trilhas" />
      <div className="tema-heroi" style={{ '--cor': cor(t.codigo) } as React.CSSProperties}>
        <h1>{t.nome}</h1><p>{t.frase}</p>
      </div>
      <p className="fraco">{total} passos curtos, de 2 a 4 minutos. Um por dia é um bom ritmo — mas o ritmo é seu.</p>
      <div className="cartao">
        {dela.map((p, i) => {
          const feito = dado.concluidos.includes(p.id); const proximo = i === feitos;
          return (
            <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: i < dela.length - 1 ? '1px solid var(--linha)' : 0, opacity: feito || proximo ? 1 : 0.55 }}>
              <span style={{ width: 24, height: 24, borderRadius: 8, background: feito ? cor(t.codigo) : proximo ? 'var(--areia)' : 'transparent', border: feito ? 0 : '1.5px solid var(--linha)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flex: 'none' }}>
                {feito ? <Ok /> : i + 1}
              </span>
              <span style={{ flex: 1, fontSize: 14 }}>{p.titulo}<span className="pequeno fraco" style={{ display: 'block' }}>{p.minutos} min</span></span>
            </div>
          );
        })}
      </div>
      <div className="pe"><button className="btn btn-coral" onClick={() => nav(`/trilhas/${t.id}/passo/${feitos >= total ? 1 : feitos + 1}`)}>{feitos === 0 ? 'Começar' : feitos >= total ? 'Rever do início' : 'Continuar'}</button></div>
    </Moldura>
  );
}

/* ========================= Passo ========================= */
export function PassoTela() {
  const { id, n } = useParams();
  const nav = useNavigate();
  const { dado, carregando } = useCatalogo();
  if (carregando && !dado) return <Moldura><Carregando /></Moldura>;
  const t = dado?.trilhas.find(x => x.id === id);
  if (!t || !dado) return <TemaEmBreve />;
  const dela = dado.passos.filter(p => p.trilhaId === t.id).sort((a, b) => a.ordem - b.ordem);
  const idx = Math.min(dela.length - 1, Math.max(0, (Number(n) || 1) - 1));
  const p = dela[idx];
  const tipo = { leitura: 'Leitura', reflexao: 'Reflexão', pratica: 'Prática' }[p.tipo];
  const concluir = async () => { try { await dados.concluirPasso(p.id); } catch { /* segue */ } nav(`/trilhas/${t.id}/passo/${idx + 1}/feito`, { replace: true }); };
  return (
    <Moldura>
      <FluxoTopo voltar={`/trilhas/${t.id}`} rotulo={t.nome} total={dela.length} atual={idx} />
      <div className="progresso-topo" style={{ '--cor': cor(t.codigo) } as React.CSSProperties}><motion.b initial={{ width: 0 }} animate={{ width: `${((idx + 1) / dela.length) * 100}%` }} transition={{ duration: 0.6 }} /></div>
      <p className="fraco pequeno" style={{ marginBottom: 2 }}>Passo {idx + 1} de {dela.length} · {tipo} de {p.minutos} minutos</p>
      <h1 style={{ color: cor(t.codigo) }}>{p.titulo}</h1>
      <BotaoOuvir texto={p.trechos.join(' ')} />
      {p.trechos.map((tr, i) => <motion.p className="trecho" key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.12 }}>{tr}</motion.p>)}
      {p.tipo === 'pratica' && <button className="btn btn-leve" onClick={() => nav('/pratica', { state: { segundos: 120, titulo: p.titulo, de: `/trilhas/${t.id}/passo/${idx + 1}` } })}><Vento />Respirar 2 minutos antes de seguir</button>}
      <div className="pe"><motion.button whileTap={{ scale: 0.97 }} className="btn btn-coral" onClick={concluir}><Ok />Feito, entendi</motion.button></div>
    </Moldura>
  );
}

/* ========================= Passo feito ========================= */
export function PassoFeito() {
  const { id, n } = useParams();
  const nav = useNavigate();
  const { dado, carregando } = useCatalogo();
  if (carregando && !dado) return <Moldura><Carregando /></Moldura>;
  const t = dado?.trilhas.find(x => x.id === id);
  if (!t || !dado) return <TemaEmBreve />;
  const dela = dado.passos.filter(p => p.trilhaId === t.id).sort((a, b) => a.ordem - b.ordem);
  const idx = (Number(n) || 1) - 1; const prox = dela[idx + 1];
  return (
    <Moldura>
      <Selo />
      <h1 className="centro grande">Passo {idx + 1} feito.</h1>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 12px' }}><Anel fracao={(idx + 1) / dela.length} cor={cor(t.codigo)} tamanho={64} /></div>
      {prox ? (
        <>
          <p className="lead centro">O próximo é "{prox.titulo}". Pode ser amanhã — ou agora, se quiser.</p>
          <div className="pe">
            <button className="btn btn-coral" onClick={() => nav(`/trilhas/${t.id}/passo/${idx + 2}`, { replace: true })}>Ir para o próximo</button>
            <button className="btn btn-texto" onClick={() => nav('/', { replace: true })}>Parar por hoje</button>
          </div>
        </>
      ) : (
        <>
          <p className="lead centro">Você terminou a trilha {t.nome}. {dela.length} passos, no seu ritmo.</p>
          <div className="pe"><button className="btn btn-coral" onClick={() => nav('/trilhas', { replace: true })}>Ver outras trilhas</button></div>
        </>
      )}
    </Moldura>
  );
}
