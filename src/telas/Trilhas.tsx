import type { ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BotaoOuvir, Carregando, Erro, FluxoTopo, Moldura, Opcao, Selo } from '../componentes/base';
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

/* ========================= Trilhas ========================= */
export function Trilhas() {
  const nav = useNavigate();
  const { dado, erro, carregando } = useCatalogo();
  if (carregando && !dado) return <Moldura comTopo comAbas><Carregando /></Moldura>;

  const publicadas = dado?.trilhas ?? [];
  const porCodigo = (c: string) => publicadas.find(t => t.codigo === c);

  // trilha em andamento
  let andamento: { trilha: Trilha; feitos: number; total: number; proximo: Passo } | null = null;
  if (dado) {
    for (const t of publicadas) {
      const { dela, feitos, total } = progresso(t, dado.passos, dado.concluidos);
      if (feitos > 0 && feitos < total) { andamento = { trilha: t, feitos, total, proximo: dela[feitos] }; break; }
    }
  }

  return (
    <Moldura comTopo comAbas>
      <div className="entra">
        <Erro msg={erro} />
        {andamento ? (
          <>
            <h1>Trilhas</h1>
            <div className="cartao destaque">
              <h3>Continuar: {andamento.trilha.nome}</h3>
              <p>Passo {andamento.feitos + 1} de {andamento.total} — {andamento.proximo.titulo}</p>
              <div className="barra"><b style={{ width: `${(andamento.feitos / andamento.total) * 100}%` }} /></div>
              <button className="btn btn-coral" style={{ marginTop: 10 }} onClick={() => nav(`/trilhas/${andamento!.trilha.id}/passo/${andamento!.feitos + 1}`)}>Continuar</button>
            </div>
            <h2>Outras trilhas</h2>
          </>
        ) : (
          <>
            <h1>O que mais pesa agora?</h1>
            <p className="fraco">Toque em uma. A gente sugere por onde começar.</p>
            <div className="opcoes">
              {TEMAS.map(tema => {
                const Ico = ICONE_TEMA[tema.codigo];
                const t = porCodigo(tema.codigo);
                return <Opcao key={tema.codigo} icone={<Ico />} sub={t ? undefined : 'em breve'} onClick={() => nav(t ? `/trilhas/${t.id}` : `/trilhas/tema/${tema.codigo}`)}>{tema.pergunta}</Opcao>;
              })}
            </div>
            <h2>Todas as trilhas</h2>
          </>
        )}
        {TEMAS.map(tema => {
          const t = porCodigo(tema.codigo);
          const pr = t && dado ? progresso(t, dado.passos, dado.concluidos) : null;
          return (
            <Link key={tema.codigo} className="trilha-item" to={t ? `/trilhas/${t.id}` : `/trilhas/tema/${tema.codigo}`}>
              <div className={'prog' + (pr && pr.feitos > 0 ? ' ativo' : '')}>{pr ? (pr.feitos > 0 ? `${pr.feitos}/${pr.total}` : pr.total) : '…'}</div>
              <div><b>{tema.nome}</b><span>{t ? tema.sub : 'Em breve'}</span></div>
              <div className="seta" style={{ marginLeft: 'auto', color: 'var(--tinta-fraca)', display: 'flex' }}><Seta /></div>
            </Link>
          );
        })}
      </div>
    </Moldura>
  );
}

/* ========================= Tema ainda sem trilha ========================= */
export function TemaEmBreve() {
  const { codigo } = useParams();
  const tema = TEMAS.find(t => t.codigo === codigo);
  return (
    <Moldura comTopo comAbas>
      <div className="entra">
        <FluxoTopo voltar="/trilhas" rotulo="Trilhas" />
        <h1>{tema?.nome ?? 'Trilha'}</h1>
        <p className="lead">{tema?.sub}</p>
        <div className="cartao suave">
          <h3>Ainda estamos escrevendo esta trilha</h3>
          <p>Ela passa por revisão clínica antes de chegar aqui. Quando estiver pronta, aparece nesta lista.</p>
        </div>
      </div>
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
  const { feitos, total } = progresso(t, dado.passos, dado.concluidos);
  return (
    <Moldura comTopo comAbas>
      <div className="entra">
        <FluxoTopo voltar="/trilhas" rotulo="Trilhas" />
        <h1>{t.nome}</h1>
        <p className="lead">{t.frase}</p>
        <p className="fraco">{total} passos curtos, de 2 a 4 minutos cada. Um por dia é um bom ritmo — mas o ritmo é seu.</p>
        {feitos > 0 && <><div className="barra"><b style={{ width: `${(feitos / total) * 100}%` }} /></div><p className="pequeno fraco">{feitos} de {total} passos feitos</p></>}
        <div className="pe"><button className="btn btn-coral" onClick={() => nav(`/trilhas/${t.id}/passo/${feitos >= total ? 1 : feitos + 1}`)}>{feitos === 0 ? 'Começar' : feitos >= total ? 'Rever do início' : 'Continuar'}</button></div>
      </div>
    </Moldura>
  );
}

/* ========================= Passo (um por tela) ========================= */
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

  const concluir = async () => {
    try { await dados.concluirPasso(p.id); } catch { /* segue mesmo assim */ }
    nav(`/trilhas/${t.id}/passo/${idx + 1}/feito`, { replace: true });
  };

  return (
    <Moldura>
      <div className="entra">
        <FluxoTopo voltar={`/trilhas/${t.id}`} rotulo={t.nome} total={dela.length} atual={idx} />
        <p className="fraco pequeno" style={{ marginBottom: 2 }}>Passo {idx + 1} de {dela.length} · {tipo} de {p.minutos} minutos</p>
        <h1>{p.titulo}</h1>
        <BotaoOuvir texto={p.trechos.join(' ')} />
        {p.trechos.map((tr, i) => <p className="trecho" key={i}>{tr}</p>)}
        {p.tipo === 'pratica' && (
          <button className="btn btn-leve" onClick={() => nav('/pratica', { state: { segundos: 120, titulo: p.titulo, de: `/trilhas/${t.id}/passo/${idx + 1}` } })}><Vento />Respirar 2 minutos antes de seguir</button>
        )}
        <div className="pe"><button className="btn btn-coral" onClick={concluir}><Ok />Feito, entendi</button></div>
      </div>
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
  const idx = (Number(n) || 1) - 1;
  const prox = dela[idx + 1];
  return (
    <Moldura>
      <div className="entra">
        <Selo />
        <h1 className="centro">Passo {idx + 1} feito.</h1>
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
      </div>
    </Moldura>
  );
}
