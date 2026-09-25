import { useState, type FormEvent } from 'react';
import { Erro, Aviso } from '../componentes/base';
import { dados } from '../lib/dados';
import { useSessao } from '../lib/sessao';
import { emailValido } from '../lib/util';

type Modo = 'senha' | 'codigo' | 'criar';

/** Entrada do portal: senha (equipe/RH), código por e-mail, ou criar conta. */
export function Entrar() {
  const { demo } = useSessao();
  const [modo, setModo] = useState<Modo>('senha');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setErro(null); setAviso(null);
    const em = email.trim().toLowerCase();
    if (!emailValido(em)) { setErro('Esse e-mail não parece completo.'); return; }
    setOcupado(true);
    try {
      if (modo === 'senha') {
        if (!senha) throw new Error('Digite a senha.');
        await dados.entrarComSenha(em, senha);
      } else if (modo === 'criar') {
        if (senha.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
        const r = await dados.criarConta(em, senha);
        if (r === 'confirmar_email') setAviso('Conta criada. Confirme pelo link que mandamos para o seu e-mail e depois entre com a senha.');
      } else if (!codigoEnviado) {
        await dados.enviarCodigo(em, `${window.location.origin}/gestao`);
        setCodigoEnviado(true); setAviso('Mandamos um código para o seu e-mail.');
      } else {
        await dados.confirmarCodigo(em, codigo);
      }
    } catch (err) { setErro((err as Error).message); }
    finally { setOcupado(false); }
  };

  return (
    <div className="entrada">
      <form className="caixa" onSubmit={enviar}>
        <div className="marca"><i />Contigo <span className="gfraco" style={{ fontWeight: 400 }}>· Gestão</span></div>
        <p className="gfraco">Indicadores agregados da sua empresa. Nenhum dado individual chega aqui — nem por engano.</p>
        {demo && <span className="gselo demo">Demonstração · dados inventados</span>}
        <div className="gabas" role="tablist">
          <button type="button" className={modo === 'senha' ? 'ativa' : ''} onClick={() => { setModo('senha'); setErro(null); }}>Senha</button>
          <button type="button" className={modo === 'codigo' ? 'ativa' : ''} onClick={() => { setModo('codigo'); setErro(null); }}>Código por e-mail</button>
          <button type="button" className={modo === 'criar' ? 'ativa' : ''} onClick={() => { setModo('criar'); setErro(null); }}>Criar conta</button>
        </div>
        <label className="rotulo">E-mail</label>
        <input className="gcampo" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@empresa.com.br" autoFocus />
        {(modo === 'senha' || modo === 'criar') && (
          <>
            <label className="rotulo">{modo === 'criar' ? 'Escolha uma senha' : 'Senha'}</label>
            <input className="gcampo" type="password" autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} value={senha} onChange={e => setSenha(e.target.value)} />
          </>
        )}
        {modo === 'codigo' && codigoEnviado && (
          <>
            <label className="rotulo">Código de seis números</label>
            <input className="gcampo" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigo} onChange={e => setCodigo(e.target.value)} />
          </>
        )}
        <div style={{ marginTop: 12 }}><Erro msg={erro} /><Aviso msg={aviso} /></div>
        <button className="gbtn gbtn-coral" type="submit" disabled={ocupado}>
          {ocupado ? 'Um instante…' : modo === 'senha' ? 'Entrar' : modo === 'criar' ? 'Criar conta' : codigoEnviado ? 'Entrar' : 'Mandar o código'}
        </button>
        {modo === 'criar' && <p className="gpequeno gfraco" style={{ marginTop: 12 }}>Depois de criar a conta, o administrador da sua empresa (ou a equipe do Contigo) libera o seu acesso.</p>}
      </form>
    </div>
  );
}

/** Tem login, mas nenhuma empresa liberada. */
export function SemEmpresa() {
  const { acessos } = useSessao();
  return (
    <div className="entrada">
      <div className="caixa">
        <div className="marca"><i />Contigo <span className="gfraco" style={{ fontWeight: 400 }}>· Gestão</span></div>
        <h2 style={{ marginTop: 8 }}>Falta liberar o seu acesso</h2>
        <p>Você entrou como <b>{acessos?.email}</b>, mas nenhuma empresa liberou este e-mail ainda. Peça ao administrador da sua empresa — ou à equipe do Contigo — para conceder o acesso em <b>Acessos</b>.</p>
        <button className="gbtn gbtn-leve" onClick={() => dados.sair()}>Sair</button>
      </div>
    </div>
  );
}
