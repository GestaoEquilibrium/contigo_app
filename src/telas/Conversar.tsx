import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Carregando, Erro, FluxoTopo, LinhaAcao, Moldura, Opcao, Selo } from '../componentes/base';
import { Boia, Ok, Pessoa, Pessoas } from '../componentes/icones';
import { dados } from '../lib/dados';
import { useCarregar } from '../lib/hooks';
import { useSessao } from '../lib/sessao';
import type { Afinidade as Respostas } from '../lib/tipos';
import { AFINIDADE } from '../lib/util';

/* ========================= Vamos conversar ========================= */
export function Conversar() {
  const { conta } = useSessao();
  const nav = useNavigate();
  const { dado, erro, recarregar } = useCarregar(async () => {
    const [prefs, afinidade] = await Promise.all([dados.preferencias(), dados.afinidade()]);
    return { prefs, afinidade };
  });
  const [ocupado, setOcupado] = useState(false);

  const alternarAviso = async () => {
    if (!dado) return;
    setOcupado(true);
    try { await dados.gravarPreferencias({ ...dado.prefs, avisarConversa: !dado.prefs.avisarConversa }); recarregar(); }
    finally { setOcupado(false); }
  };

  return (
    <Moldura comTopo comAbas>
      <div className="entra">
        <h1>Vamos conversar</h1>
        <p className="lead">Uma conversa com um psicólogo, no seu ritmo: você escreve quando dá, e uma pessoa de verdade responde.</p>
        <details className="detalhes">
          <summary>Entenda melhor</summary>
          <p>Não é consulta marcada de cinquenta minutos. É uma conversa que fica aberta: você escreve no intervalo, grava um áudio no ônibus, volta à noite.</p>
          <p>Do outro lado tem um profissional inscrito no Conselho Regional de Psicologia — não um robô, não um voluntário.</p>
        </details>
        <Erro msg={erro} />
        <div className="cartao suave" style={{ marginTop: 12 }}>
          <h3>{conta?.camada2 ? 'Ainda não abriu' : 'Sua empresa ainda não contratou esta parte'}</h3>
          <p>Só abrimos quando tiver alguém para responder no tempo combinado. Escrever para alguém e não ter resposta machuca mais do que não ter para quem escrever.</p>
          {dado && (
            <button className={'btn ' + (dado.prefs.avisarConversa ? 'btn-leve' : 'btn-coral')} style={{ marginTop: 6 }} disabled={ocupado} onClick={alternarAviso}>
              {dado.prefs.avisarConversa ? <><Ok />Vamos te avisar quando abrir</> : 'Me avisar quando abrir'}
            </button>
          )}
        </div>
        <h2>Enquanto isso</h2>
        <LinhaAcao icone={<Pessoas />}
          titulo={dado?.afinidade ? 'Quem combina com você' : 'Encontrar quem combina com você'}
          sub={dado?.afinidade ? 'Você já respondeu. Toque para ver ou refazer.' : 'Sete perguntas rápidas sobre como você quer ser cuidado(a)'}
          onClick={() => nav(dado?.afinidade ? '/conversar/afinidade/pronto' : '/conversar/afinidade/1')} />
        <LinhaAcao icone={<Boia />} classe="urgente" titulo="Preciso de ajuda agora" sub="Se estiver apertado de verdade, existe caminho — sem esperar por nada." para="/ajuda" />
      </div>
    </Moldura>
  );
}

/* ========================= Afinidade: uma pergunta por tela ========================= */
export function AfinidadeTela() {
  const { n } = useParams();
  const nav = useNavigate();
  const i = Math.min(AFINIDADE.length - 1, Math.max(0, (Number(n) || 1) - 1));
  const q = AFINIDADE[i];
  const { dado: salvas } = useCarregar(() => dados.afinidade());
  const [respostas, setRespostas] = useState<Respostas>({});
  const [erro, setErro] = useState<string | null>(null);
  const atual = { ...(salvas ?? {}), ...respostas };

  const responder = async (o: string) => {
    const novas = { ...atual, [q.chave]: o };
    setRespostas(novas);
    if (i < AFINIDADE.length - 1) { nav(`/conversar/afinidade/${i + 2}`); return; }
    try { await dados.gravarAfinidade(novas); nav('/conversar/afinidade/pronto', { replace: true }); }
    catch (e) { setErro((e as Error).message); }
  };

  return (
    <Moldura>
      <div className="entra" key={i}>
        <FluxoTopo aoVoltar={() => (i === 0 ? nav('/conversar') : nav(`/conversar/afinidade/${i}`))} total={AFINIDADE.length} atual={i} />
        <p className="fraco pequeno" style={{ marginBottom: 2 }}>Pergunta {i + 1} de {AFINIDADE.length}</p>
        <h1>{q.q}</h1>
        {q.nota && <p className="fraco">{q.nota}</p>}
        <Erro msg={erro} />
        <div className="opcoes">
          {q.o.map(o => <Opcao key={o} marcada={atual[q.chave] === o} onClick={() => responder(o)}>{o}</Opcao>)}
        </div>
      </div>
    </Moldura>
  );
}

export function AfinidadePronto() {
  const nav = useNavigate();
  const { dado, carregando } = useCarregar(() => dados.afinidade());
  if (carregando) return <Moldura><Carregando /></Moldura>;
  return (
    <Moldura>
      <div className="entra">
        <FluxoTopo voltar="/conversar" />
        <Selo />
        <h1 className="centro">Obrigado por contar.</h1>
        <p className="lead centro">Quando a conversa abrir, a gente já sabe quem sugerir para você.</p>
        {dado && <p className="fraco centro pequeno">Você disse: {dado.jeito?.toLowerCase()} · {dado.canal?.toLowerCase()}.</p>}
        <p className="fraco centro pequeno" style={{ marginTop: 16 }}>Assim o profissional vai se apresentar — sem currículo, sem lista de diplomas:</p>
        <div className="cuido">
          <div className="foto"><Pessoa /></div>
          <b style={{ fontSize: 17 }}>Nome do profissional</b><br /><span className="fraco pequeno">Psicóloga · CRP</span>
          <blockquote>"Meu jeito é criar um espaço seguro onde você não precisa ter as palavras certas para começar. A gente vai no seu ritmo."</blockquote>
          <p className="pequeno" style={{ marginBottom: 2 }}><b>Caminho bem com quem traz</b></p>
          <div className="tags"><span>ansiedade</span><span>autoestima</span><span>relacionamentos</span><span>luto</span></div>
          <p className="pequeno" style={{ margin: '12px 0 2px' }}><b>Como podemos conversar</b></p>
          <div className="tags"><span>mensagem</span><span>áudio</span><span>vídeo</span><span>pessoalmente</span></div>
        </div>
        <button className="btn btn-texto" style={{ marginTop: 10 }} onClick={() => nav('/conversar/afinidade/1')}>Responder de novo</button>
      </div>
    </Moldura>
  );
}
