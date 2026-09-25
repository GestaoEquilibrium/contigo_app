import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Carregando, Erro, FluxoTopo, Moldura, Selo } from '../componentes/base';
import { Cadeado, Celular, Compartilhar, Coracao, Envelope, Lixo, Mais, Ok, OlhoNao, Pontos } from '../componentes/icones';
import { dados } from '../lib/dados';
import { useSessao } from '../lib/sessao';
import { CHAVE_CONVITE, CHAVE_EMAIL, CHAVE_INSTALACAO_VISTA, ehIphone, estaInstalado, local } from '../lib/util';

/* =========================================================================
   Chegada: boas-vindas → e-mail → código (ou link). Guarda o token do convite
   para depois do login.
   ========================================================================= */
export function Chegada() {
  const { token } = useParams();
  const { demo } = useSessao();
  const [etapa, setEtapa] = useState<'boasvindas' | 'email' | 'codigo'>(token ? 'boasvindas' : 'email');
  const [email, setEmail] = useState(local.ler<string>(CHAVE_EMAIL, ''));
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => { if (token) local.gravar(CHAVE_CONVITE, token); }, [token]);

  const enviar = async (e?: FormEvent) => {
    e?.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { setErro('Esse e-mail não parece completo.'); return; }
    setOcupado(true); setErro(null);
    try {
      local.gravar(CHAVE_EMAIL, em);
      await dados.enviarCodigo(em, `${window.location.origin}/entrar`);
      setEtapa('codigo');
    } catch (err) { setErro((err as Error).message); } finally { setOcupado(false); }
  };

  const confirmar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!demo && codigo.replace(/\D/g, '').length < 6) { setErro('O código tem seis números.'); return; }
    setOcupado(true); setErro(null);
    try { await dados.confirmarCodigo(email.trim().toLowerCase(), codigo || '000000'); }
    catch (err) { setErro((err as Error).message); setOcupado(false); }
  };

  if (etapa === 'boasvindas') {
    return (
      <Moldura>
        <div className="entra">
          <div className="marca-grande"><Coracao /></div>
          <p className="wordmark">Contigo</p>
          <p className="assinatura">Conte comigo. Estou com você.</p>
          <h1 style={{ marginTop: 22 }}>Oi. Que bom que você veio.</h1>
          <p className="lead">A sua empresa colocou o Contigo à sua disposição. Ele é seu — e só seu.</p>
          <p className="lead">O que você escreve aqui, ninguém do seu trabalho vê. Nem seu chefe, nem o RH.</p>
          <div className="pe"><button className="btn btn-coral" onClick={() => setEtapa('email')}>Vamos começar</button></div>
          <p className="nota centro"><Link to="/ajuda" state={{ de: window.location.pathname }}>Precisa de ajuda agora?</Link></p>
        </div>
      </Moldura>
    );
  }

  if (etapa === 'email') {
    return (
      <Moldura>
        <form className="entra" onSubmit={enviar}>
          {!token && <><div className="marca-grande"><Coracao /></div><p className="wordmark">Contigo</p></>}
          {demo && <span className="selo-demo">Demonstração · dados só neste aparelho</span>}
          <h1>Qual é o seu e-mail?</h1>
          <p className="fraco">Use o mesmo que a sua empresa cadastrou. Vamos mandar um código para ele — sem senha para decorar.</p>
          <input className="campo" type="email" inputMode="email" autoComplete="email" placeholder="nome@empresa.com.br"
            value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          <Erro msg={erro} />
          <div className="pe"><button className="btn btn-coral" type="submit" disabled={ocupado}><Envelope />{ocupado ? 'Enviando…' : 'Mandar o código'}</button></div>
          <p className="nota centro"><Link to="/ajuda" state={{ de: window.location.pathname }}>Precisa de ajuda agora?</Link></p>
        </form>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <form className="entra" onSubmit={confirmar}>
        <FluxoTopo aoVoltar={() => { setEtapa('email'); setErro(null); }} rotulo="Trocar e-mail" />
        <h1>Olhe o seu e-mail</h1>
        <p className="fraco">Mandamos um código de seis números para <b>{email}</b>. Pode levar um minuto.</p>
        <input className="campo codigo" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6}
          value={codigo} onChange={e => setCodigo(e.target.value)} autoFocus />
        <Erro msg={erro} />
        <div className="pe">
          <button className="btn btn-coral" type="submit" disabled={ocupado}>{ocupado ? 'Conferindo…' : 'Entrar'}</button>
          <button className="btn btn-texto" type="button" onClick={() => enviar()} disabled={ocupado}>Não chegou? Mandar de novo</button>
        </div>
        {!demo && <p className="nota">Se em vez de código veio um <b>link</b>, é só tocar nele — ele te traz de volta para cá, já dentro.</p>}
      </form>
    </Moldura>
  );
}

/* =========================================================================
   Ativar: já logado, com convite guardado. Liga a conta ao vínculo.
   ========================================================================= */
export function Ativar() {
  const { token: daUrl } = useParams();
  const { recarregar, email } = useSessao();
  const nav = useNavigate();
  const [estado, setEstado] = useState<'ativando' | 'pronto' | 'erro'>('ativando');
  const [msg, setMsg] = useState('');
  const [resultado, setResultado] = useState<{ empresa: string; nome: string } | null>(null);

  useEffect(() => {
    const token = daUrl || local.ler<string | null>(CHAVE_CONVITE, null);
    if (!token) { nav('/', { replace: true }); return; }
    let vivo = true;
    (async () => {
      try {
        // Só recarrega a sessão quando a pessoa tocar em "Continuar": assim o
        // portão não troca de tela antes de ela ler a confirmação.
        const r = await dados.aceitarConvite(token);
        if (vivo) { setResultado(r); setEstado('pronto'); }
      } catch (e) {
        if (vivo) { setMsg((e as Error).message); setEstado('erro'); }
      }
    })();
    return () => { vivo = false; };
  }, [daUrl, nav]);

  const continuar = async () => {
    await recarregar();
    local.apagar(CHAVE_CONVITE);
    nav('/consentir', { replace: true });
  };

  if (estado === 'ativando') return <Moldura><Carregando texto="Ligando você à sua empresa…" /></Moldura>;

  if (estado === 'erro') {
    return (
      <Moldura>
        <div className="entra">
          <h1>Não deu para usar este convite</h1>
          <p className="erro">{msg}</p>
          <p className="fraco">Você entrou como <b>{email}</b>. O convite só vale para o e-mail que a empresa cadastrou.</p>
          <div className="pe">
            <button className="btn btn-coral" onClick={async () => { await dados.sair(); nav('/entrar', { replace: true }); }}>Entrar com outro e-mail</button>
            <button className="btn btn-texto" onClick={() => { local.apagar(CHAVE_CONVITE); nav('/', { replace: true }); }}>Deixar para depois</button>
          </div>
          <p className="nota">Se o convite venceu, peça um novo para o RH da sua empresa.</p>
        </div>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <div className="entra">
        <Selo />
        <h1 className="centro">Pronto, {resultado?.nome}.</h1>
        <p className="lead centro">Você está ligado(a) à <b>{resultado?.empresa}</b>. Falta só você concordar com o que o Contigo faz com o que você registra.</p>
        <div className="pe"><button className="btn btn-coral" onClick={continuar}>Continuar</button></div>
      </div>
    </Moldura>
  );
}

/* =========================================================================
   Consentir: três linhas + texto completo escondido.
   ========================================================================= */
export function Consentir() {
  const { recarregar } = useSessao();
  const [texto, setTexto] = useState<{ versao: number; texto: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => { dados.textoConsentimento().then(setTexto).catch(e => setErro((e as Error).message)); }, []);

  const concordar = async () => {
    if (!texto) return;
    setOcupado(true); setErro(null);
    try {
      await dados.registrarConsentimento(texto.versao);
      await recarregar();   // o portão leva para a instalação guiada (ou para o app)
    } catch (e) { setErro((e as Error).message); setOcupado(false); }
  };

  return (
    <Moldura>
      <div className="entra">
        <h1>Antes de começar, três coisas</h1>
        <div className="cartao">
          <div className="quem"><div className="ico"><Cadeado /></div><div><b>O que você responde fica com você</b><p>E com o profissional de psicologia que cuida de você, sob sigilo.</p></div></div>
          <div className="quem nunca"><div className="ico"><OlhoNao /></div><div><b>Sua empresa nunca vê o seu nome</b><p>Ela só recebe números do grupo inteiro, sem nome, e só quando há pelo menos 12 pessoas.</p></div></div>
          <div className="quem"><div className="ico"><Lixo /></div><div><b>Você pode apagar tudo quando quiser</b><p>Na aba "Eu", com um toque.</p></div></div>
        </div>
        <details className="detalhes" style={{ marginTop: 12 }}>
          <summary>Ler o texto completo</summary>
          <p className="pequeno">{texto?.texto ?? 'Carregando…'}</p>
        </details>
        <Erro msg={erro} />
        <div className="pe"><button className="btn btn-coral" onClick={concordar} disabled={!texto || ocupado}><Ok />{ocupado ? 'Guardando…' : 'Concordo e quero começar'}</button></div>
      </div>
    </Moldura>
  );
}

/* =========================================================================
   Instalar: o gesto é diferente no iPhone e no Android, então mostramos os dois.
   ========================================================================= */
export function Instalar() {
  const nav = useNavigate();
  const [plat, setPlat] = useState<'ios' | 'android'>(ehIphone() ? 'ios' : 'android');
  const instalado = estaInstalado();
  const sair = () => { local.gravar(CHAVE_INSTALACAO_VISTA, true); nav('/', { replace: true }); };

  if (instalado) {
    return (
      <Moldura>
        <div className="entra">
          <Selo />
          <h1 className="centro">O Contigo já está na sua tela.</h1>
          <p className="lead centro">Ele fica a um toque, como qualquer app.</p>
          <div className="pe"><button className="btn btn-coral" onClick={sair}>Continuar</button></div>
        </div>
      </Moldura>
    );
  }

  const ios = [
    [<Compartilhar />, 'Toque no botão Compartilhar', 'É o quadrado com a seta para cima, embaixo da tela'],
    [<Mais />, 'Toque em "Adicionar à Tela de Início"', 'Pode ser preciso rolar a lista para achar'],
    [<Celular />, 'Toque em "Adicionar"', 'O Contigo aparece na tela como um app'],
  ] as const;
  const android = [
    [<Pontos />, 'Toque nos três pontinhos', 'Ficam no canto de cima do navegador'],
    [<Mais />, 'Toque em "Instalar app"', 'Ou em "Adicionar à tela inicial"'],
    [<Celular />, 'Confirme', 'O Contigo aparece na tela como um app'],
  ] as const;
  const passos = plat === 'ios' ? ios : android;

  return (
    <Moldura>
      <div className="entra">
        <h1>Coloque o Contigo na sua tela</h1>
        <p className="fraco">Assim ele fica a um toque, como qualquer app.</p>
        <div className="plataforma" role="tablist">
          <button className={plat === 'ios' ? 'ativa' : ''} onClick={() => setPlat('ios')}>iPhone</button>
          <button className={plat === 'android' ? 'ativa' : ''} onClick={() => setPlat('android')}>Android</button>
        </div>
        <div className="cartao">
          {passos.map(([ico, t, s], i) => (
            <div className="passo-inst" key={i}><div className="num">{i + 1}</div><div className="ico">{ico}</div><p>{t}<span>{s}</span></p></div>
          ))}
        </div>
        <div className="pe">
          <button className="btn btn-coral" onClick={sair}>Já coloquei na tela</button>
          <button className="btn btn-texto" onClick={sair}>Fazer isso depois</button>
        </div>
      </div>
    </Moldura>
  );
}

/* =========================================================================
   Sem acesso: tem login, mas nenhum vínculo ativo.
   ========================================================================= */
export function SemAcesso() {
  const { email, conta } = useSessao();
  const nav = useNavigate();
  const inativo = conta?.vinculo === 'inativo';
  return (
    <Moldura>
      <div className="entra">
        <div className="marca-grande"><Coracao /></div>
        <h1>{inativo ? 'O seu acesso foi encerrado' : 'Falta o convite da sua empresa'}</h1>
        <p className="lead">
          {inativo
            ? 'Se você pediu para apagar seus dados, é isso. Se quiser voltar, peça um novo convite para o RH.'
            : 'Você entrou, mas ainda não há um convite para este e-mail. O Contigo chega por um link que a sua empresa manda.'}
        </p>
        <p className="fraco">Você está como <b>{email}</b>. Se a empresa cadastrou outro e-mail seu, entre com ele.</p>
        <div className="pe">
          <button className="btn btn-leve" onClick={async () => { await dados.sair(); nav('/entrar', { replace: true }); }}>Entrar com outro e-mail</button>
        </div>
      </div>
    </Moldura>
  );
}
