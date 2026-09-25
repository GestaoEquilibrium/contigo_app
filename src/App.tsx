import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Carregando, Moldura } from './componentes/base';
import { ProvedorSessao, useSessao } from './lib/sessao';
import { CHAVE_CONVITE, CHAVE_INSTALACAO_VISTA, estaInstalado, local } from './lib/util';
import { Ajuda } from './telas/Ajuda';
import { Ativar, Chegada, Consentir, Instalar, SemAcesso } from './telas/Chegada';
import { AfinidadePronto, AfinidadeTela, Conversar } from './telas/Conversar';
import { Eu } from './telas/Eu';
import { Checkin, Hoje, PraticaGuiada, Pronto } from './telas/Hoje';
import { PassoFeito, PassoTela, TemaEmBreve, TrilhaTela, Trilhas } from './telas/Trilhas';

/**
 * O portão decide onde a pessoa pode estar:
 *   sem login            → chegada (e-mail + código)
 *   login + convite      → ativar (liga ao vínculo)
 *   login sem vínculo    → sem acesso
 *   vínculo sem termo    → consentir
 *   tudo certo           → o app
 * "Ajuda agora" é alcançável de qualquer estado.
 */
function Portao() {
  const s = useSessao();
  const loc = useLocation();
  const caminho = loc.pathname;
  const tokenPendente = local.ler<string | null>(CHAVE_CONVITE, null);

  // Se já está ativo e sobrou um token antigo guardado, esquece o token.
  useEffect(() => {
    if (s.logado && tokenPendente && s.conta?.vinculo === 'ativo' && !caminho.startsWith('/ativar')) local.apagar(CHAVE_CONVITE);
  }, [s.logado, s.conta?.vinculo, tokenPendente, caminho]);

  if (caminho === '/ajuda' || caminho === '/pratica') {
    return (
      <Routes>
        <Route path="/ajuda" element={<Ajuda />} />
        <Route path="/pratica" element={<PraticaGuiada />} />
      </Routes>
    );
  }

  if (s.carregando) return <Moldura><Carregando /></Moldura>;

  if (!s.logado) {
    return (
      <Routes>
        <Route path="/ativar/:token" element={<Chegada />} />
        <Route path="/entrar" element={<Chegada />} />
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    );
  }

  const ativo = s.conta?.vinculo === 'ativo' && !!s.conta?.membroId;
  const temToken = !!tokenPendente || caminho.startsWith('/ativar/');

  if (!ativo && temToken) {
    return (
      <Routes>
        <Route path="/ativar/:token" element={<Ativar />} />
        <Route path="/ativar" element={<Ativar />} />
        <Route path="*" element={<Navigate to="/ativar" replace />} />
      </Routes>
    );
  }
  if (!ativo) {
    return <Routes><Route path="*" element={<SemAcesso />} /></Routes>;
  }
  if (!s.conta?.consentiu) {
    return (
      <Routes>
        <Route path="/consentir" element={<Consentir />} />
        <Route path="*" element={<Navigate to="/consentir" replace />} />
      </Routes>
    );
  }

  const precisaInstalar = !estaInstalado() && !local.ler<boolean>(CHAVE_INSTALACAO_VISTA, false);
  return (
    <Routes>
      <Route path="/" element={<Hoje />} />
      <Route path="/hoje/pronto" element={<Pronto />} />
      <Route path="/hoje/:n" element={<Checkin />} />
      <Route path="/trilhas" element={<Trilhas />} />
      <Route path="/trilhas/tema/:codigo" element={<TemaEmBreve />} />
      <Route path="/trilhas/:id" element={<TrilhaTela />} />
      <Route path="/trilhas/:id/passo/:n" element={<PassoTela />} />
      <Route path="/trilhas/:id/passo/:n/feito" element={<PassoFeito />} />
      <Route path="/conversar" element={<Conversar />} />
      <Route path="/conversar/afinidade/pronto" element={<AfinidadePronto />} />
      <Route path="/conversar/afinidade/:n" element={<AfinidadeTela />} />
      <Route path="/eu" element={<Eu />} />
      <Route path="/instalar" element={<Instalar />} />
      <Route path="/consentir" element={<Navigate to={precisaInstalar ? '/instalar' : '/'} replace />} />
      <Route path="/entrar" element={<Navigate to="/" replace />} />
      <Route path="/ativar/:token" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ProvedorSessao>
        <Portao />
      </ProvedorSessao>
    </BrowserRouter>
  );
}
