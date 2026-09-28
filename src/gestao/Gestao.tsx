import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Carregando, Casca } from './componentes/base';
import { ProvedorSessao, useSessao } from './lib/sessao';
import { Acessos, Auditoria, Contrato, Setores } from './telas/Cadastro';
import { Entrar, SemEmpresa } from './telas/Entrar';
import { Funcionarios } from './telas/Funcionarios';
import { Operacao } from './telas/Operacao';
import { Painel } from './telas/Painel';
import './estilo.css';

/**
 * O portal da empresa vive em /gestao, dentro do mesmo site do app.
 * sem login → entrar · login sem empresa (e sem ser operação) → sem empresa ·
 * senão → casca com as telas que o papel permite. As rotas aqui são relativas a /gestao.
 */
function Portao() {
  const s = useSessao();
  const loc = useLocation();
  if (s.carregando) return <Carregando />;
  if (!s.logado) return <Routes><Route path="*" element={<Entrar />} /></Routes>;
  const operacao = !!s.acessos?.operacao;
  if (!s.atual && !operacao) return <Routes><Route path="*" element={<SemEmpresa />} /></Routes>;
  const papel = s.atual?.papel;
  const cadastro = papel === 'admin' || papel === 'rh' || operacao;
  const admin = papel === 'admin' || operacao;
  return (
    <Casca>
      <AnimatePresence mode="wait" initial={false}>
      <motion.div key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
      <Routes location={loc}>
        {s.atual && <Route index element={<Painel />} />}
        {s.atual && cadastro && <Route path="funcionarios" element={<Funcionarios />} />}
        {s.atual && cadastro && <Route path="setores" element={<Setores />} />}
        {s.atual && admin && <Route path="acessos" element={<Acessos />} />}
        {s.atual && <Route path="contrato" element={<Contrato />} />}
        {s.atual && admin && <Route path="auditoria" element={<Auditoria />} />}
        {operacao && <Route path="operacao" element={<Operacao />} />}
        <Route path="*" element={<Navigate to={s.atual ? '/gestao' : '/gestao/operacao'} replace />} />
      </Routes>
      </motion.div>
      </AnimatePresence>
    </Casca>
  );
}

export function Gestao() {
  return (
    <div className="gestao">
      <ProvedorSessao><Portao /></ProvedorSessao>
    </div>
  );
}
