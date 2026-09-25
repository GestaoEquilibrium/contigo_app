import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Erro, Folha, LinhaAcao, Moldura } from '../componentes/base';
import { Cadeado, Celular, Lapis, Lixo, OlhoNao, Pessoa } from '../componentes/icones';
import { dados } from '../lib/dados';
import { useSessao } from '../lib/sessao';
import { CHAVE_CONVITE, local, primeiroNome } from '../lib/util';

/** Eu: a tela onde o produto se defende sozinho. */
export function Eu() {
  const { conta, email, demo, recarregar } = useSessao();
  const nav = useNavigate();
  const [folha, setFolha] = useState<null | 'nome' | 'apagar'>(null);
  const [nome, setNome] = useState(conta?.nome ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const salvarNome = async () => {
    setOcupado(true); setErro(null);
    try { await dados.mudarNome(nome); await recarregar(); setFolha(null); }
    catch (e) { setErro((e as Error).message); } finally { setOcupado(false); }
  };
  const apagar = async () => {
    setOcupado(true); setErro(null);
    try {
      await dados.apagarMeusDados();
      local.apagar(CHAVE_CONVITE);
      await dados.sair();
      nav('/entrar', { replace: true });
    } catch (e) { setErro((e as Error).message); setOcupado(false); }
  };

  return (
    <Moldura comTopo comAbas>
      <div className="entra">
        <h1>Olá, {primeiroNome(conta?.nome)}.</h1>
        <p className="fraco pequeno" style={{ marginTop: -6 }}>{conta?.empresa}{conta?.setor ? ` · ${conta.setor}` : ''}{email ? ` · ${email}` : ''}</p>
        <button className="btn btn-texto" style={{ justifyContent: 'flex-start', paddingLeft: 0, marginTop: -8 }} onClick={() => { setNome(conta?.nome ?? ''); setFolha('nome'); }}><Lapis />Mudar meu nome</button>

        <div className="cartao destaque" style={{ marginTop: 4 }}>
          <h3 style={{ fontSize: 19 }}>Sua empresa nunca vê o que você escreve aqui.</h3>
          <p>Nem o RH, nem a sua chefia.</p>
        </div>

        <h2>Quem vê o que você registra</h2>
        <div className="cartao">
          <div className="quem"><div className="ico"><Pessoa /></div><div><b>Você</b><p>Tudo o que escreveu e respondeu.</p></div></div>
          <div className="quem"><div className="ico"><Cadeado /></div><div><b>O profissional que cuida de você</b><p>Sob sigilo, para acompanhar a sua história ao longo do tempo.</p></div></div>
          <div className="quem nunca"><div className="ico"><OlhoNao /></div><div><b>Sua empresa, seu RH e sua chefia — nunca</b><p>Recebem só números do grupo inteiro, sem nome, e apenas quando há pelo menos 12 pessoas no mesmo recorte.</p></div></div>
        </div>
        <details className="detalhes" style={{ marginTop: 10 }}>
          <summary>Entenda melhor</summary>
          <p className="pequeno">O aplicativo não devolve resultado nem diagnóstico: o que você responde vai direto para o profissional, que é quem lê e interpreta. A empresa recebe só um retrato do grupo — por exemplo, "o setor X está mais sobrecarregado este mês" — nunca de uma pessoa. E se um grupo tem menos de 12 pessoas, ele não aparece de jeito nenhum, para que ninguém possa ser reconhecido.</p>
        </details>

        <h2>Na sua tela</h2>
        <LinhaAcao icone={<Celular />} titulo="Colocar o Contigo na tela" sub="Ver o passo a passo de novo" para="/instalar" />

        <h2>Seus dados</h2>
        <LinhaAcao icone={<Lixo />} titulo="Apagar tudo o que registrei" sub="Não tem volta, e é seu direito." onClick={() => setFolha('apagar')} />
        <button className="btn btn-texto" style={{ marginTop: 10 }} onClick={async () => { await dados.sair(); nav('/entrar', { replace: true }); }}>Sair da conta</button>

        {demo
          ? <p className="nota">Este é o modo demonstração. O que você responde fica só neste aparelho — não vai para nenhum servidor nem tem valor clínico.</p>
          : <p className="nota">Grupo Equilibrium Med Center · Uberlândia/MG</p>}
      </div>

      <Folha aberta={folha === 'nome'} fechar={() => setFolha(null)}>
        <h2 style={{ marginTop: 0 }}>Como você quer que a gente te chame?</h2>
        <input className="campo" value={nome} maxLength={30} onChange={e => setNome(e.target.value)} autoFocus />
        <Erro msg={erro} />
        <div className="pe">
          <button className="btn btn-coral" onClick={salvarNome} disabled={ocupado}>Pronto</button>
          <button className="btn btn-texto" onClick={() => setFolha(null)}>Deixar como está</button>
        </div>
      </Folha>

      <Folha aberta={folha === 'apagar'} fechar={() => setFolha(null)}>
        <h2 style={{ marginTop: 0 }}>Apagar tudo o que você registrou?</h2>
        <p className="lead">Isso não tem volta. O seu acesso é encerrado e o Contigo volta ao começo. Se quiser voltar um dia, a sua empresa manda um novo convite.</p>
        <Erro msg={erro} />
        <div className="pe">
          <button className="btn btn-escuro" onClick={apagar} disabled={ocupado}><Lixo />{ocupado ? 'Apagando…' : 'Apagar tudo'}</button>
          <button className="btn btn-texto" onClick={() => setFolha(null)}>Cancelar</button>
        </div>
      </Folha>
    </Moldura>
  );
}
