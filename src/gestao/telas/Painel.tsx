import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cabeca, Carregando, Erro, Ico } from '../componentes/base';
import { dados } from '../lib/dados';
import { useCarregar } from '../lib/hooks';
import { useSessao } from '../lib/sessao';
import type { UsoLicencas } from '../lib/tipos';
import { baixar, csv, formatarValor, mesBr } from '../lib/util';

const K = 12;
const COR: Record<string, string> = { adesao: 'var(--ambar)', humor: 'var(--coral)', energia: 'var(--rosa)' };
const ICONE: Record<string, () => React.ReactElement> = { adesao: Ico.pessoas, humor: Ico.coracao, energia: Ico.grafico };

function proximoCalculo(): string {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

/** Painel NR-1: só agregados, só recortes com 12 ou mais pessoas. A supressão aparece — é argumento, não defeito. */
export function Painel() {
  const { atual } = useSessao();
  const empresaId = atual!.empresa.id;
  const podeCadastro = atual!.papel === 'admin' || atual!.papel === 'rh';
  const { dado, erro, carregando } = useCarregar(async () => {
    const [linhas, setores, indicadores, uso, membros] = await Promise.all([
      dados.painel(empresaId), dados.setores(empresaId), dados.indicadores(),
      dados.usoLicencas(empresaId).catch(() => null as UsoLicencas | null),
      dados.membros(empresaId).catch(() => null),
    ]);
    return { linhas, setores, indicadores, uso, membros };
  }, [empresaId]);
  const periodos = useMemo(() => Array.from(new Set((dado?.linhas ?? []).map(l => l.periodo))).sort().reverse(), [dado]);
  const [periodo, setPeriodo] = useState<string | null>(null);
  const per = periodo ?? periodos[0] ?? null;

  if (carregando && !dado) return <Carregando />;
  if (erro) return <Erro msg={erro} />;

  /* ---------- ainda sem indicador: a jornada até o primeiro painel ---------- */
  if (!dado || periodos.length === 0 || !per) {
    const uso = dado?.uso ?? null;
    const setores = dado?.setores ?? [];
    const membros = dado?.membros ?? null;
    const ativos = uso?.ativos ?? membros?.filter(m => m.status === 'ativo').length ?? 0;
    const convidados = uso?.convidados ?? membros?.filter(m => m.status === 'convidado').length ?? 0;
    const licencas = uso?.licencas ?? null;
    const maiorSetor = membros ? Math.max(0, ...setores.map(s => membros.filter(m => m.setorId === s.id && m.status !== 'inativo').length)) : 0;
    const temSetor = setores.length > 0;
    const temConvite = ativos + convidados > 0;
    const temGente = ativos >= K || maiorSetor >= K;
    const atualIdx = !temSetor ? 1 : !temConvite ? 2 : !temGente ? 3 : 4;
    const Passo = ({ n, titulo, valor, sufixo, texto, para, rotulo }: { n: number; titulo: string; valor?: string | number; sufixo?: string; texto: string; para?: string; rotulo?: string }) => (
      <motion.div className={'passo ' + (n < atualIdx ? 'feito' : n === atualIdx ? 'atual' : '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.06 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="n">{n < atualIdx ? <Ico.ok /> : n}</span><b>{titulo}</b></div>
        {valor !== undefined && <div className="valor">{valor}{sufixo && <small>{sufixo}</small>}</div>}
        <p>{texto}</p>
        {para && podeCadastro && n >= atualIdx && <div className="acao"><Link to={para}>{rotulo} <Ico.seta /></Link></div>}
      </motion.div>
    );
    return (
      <>
        <Cabeca olho={atual!.empresa.nome} titulo="Painel NR-1" sub="Indicadores do grupo, por setor e por mês. Nunca da pessoa." />

        <div className="jornada">
          <div className="gtopo">
            <div>
              <h3>Seu painel está sendo construído.</h3>
              <p className="gfraco" style={{ margin: 0, maxWidth: '62ch' }}>Ele aparece sozinho quando um recorte — a empresa inteira ou um setor — tiver <b>{K} ou mais pessoas</b> respondendo no mês. Até lá, o caminho é este.</p>
            </div>
            <span className="gselo"><Ico.calendario />Próximo cálculo: {proximoCalculo()}</span>
          </div>
          <div className="passos">
            <Passo n={1} titulo="Setores" valor={setores.length} sufixo={setores.length === 1 ? 'criado' : 'criados'} texto="É por setor que o painel agrega. Setores pequenos podem ser juntados." para="/gestao/setores" rotulo="Organizar setores" />
            <Passo n={2} titulo="Convites" valor={licencas != null ? `${ativos + convidados}` : `${ativos + convidados}`} sufixo={licencas != null ? `de ${licencas} licenças` : 'pessoas'} texto="Cada pessoa recebe um link e coloca o Contigo na tela do celular." para="/gestao/funcionarios" rotulo="Convidar pessoas" />
            <Passo n={3} titulo="Entraram" valor={ativos} sufixo={ativos === 1 ? 'pessoa' : 'pessoas'} texto={`Faltam ${Math.max(0, K - ativos)} para o primeiro recorte da empresa inteira.`} para="/gestao/funcionarios" rotulo="Ver quem falta" />
            <Passo n={4} titulo="Primeiro painel" texto="No dia 1 o cálculo roda. Adesão, humor e energia do grupo — e, com o rastreio, as dimensões de risco psicossocial." />
          </div>
        </div>

        <h2>O que vai aparecer aqui</h2>
        <div className="grade">
          {[['adesao', 'Adesão', 'Pessoas com vínculo que usaram o app no mês'], ['humor', 'Humor', 'Média do humor diário do grupo (1 a 5)'], ['energia', 'Energia', 'Média da energia diária do grupo (1 a 5)']].map(([c, nome, desc], k) => {
            const I = ICONE[c];
            return (
              <motion.div className="gcartao kpi fantasma" style={{ '--cor': COR[c] } as React.CSSProperties} key={c} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + k * 0.06 }}>
                <h3><span className="ico"><I /></span>{nome}</h3>
                <div className="numero">—</div>
                <span className="quando"><Ico.cadeado />com {K}+ pessoas</span>
                <p className="gpequeno gfraco" style={{ margin: '10px 0 0' }}>{desc}</p>
              </motion.div>
            );
          })}
        </div>

        <h2>Como o painel funciona</h2>
        <div className="trio">
          <div className="gcartao"><div className="ico" style={{ background: 'var(--ameixa)' }}><Ico.olhonao /></div><h3>Só o grupo. Nunca a pessoa.</h3><p>Recorte com menos de {K} pessoas não aparece — nem para o administrador. O banco de dados não entrega.</p></div>
          <div className="gcartao"><div className="ico" style={{ background: 'var(--ambar)' }}><Ico.calendario /></div><h3>Mês a mês, no dia 1.</h3><p>O cálculo roda sozinho no primeiro dia de cada mês, sobre o mês anterior. Sem botão, sem planilha.</p></div>
          <div className="gcartao"><div className="ico" style={{ background: 'var(--coral)' }}><Ico.contrato /></div><h3>Pronto para o PGR.</h3><p>Exportação em CSV, com o número de pessoas de cada recorte, para anexar ao Programa de Gerenciamento de Riscos.</p></div>
        </div>
      </>
    );
  }

  /* ---------- com indicador ---------- */
  const doPeriodo = dado.linhas.filter(l => l.periodo === per);
  const anterior = periodos[periodos.indexOf(per) + 1];
  const doAnterior = anterior ? dado.linhas.filter(l => l.periodo === anterior) : [];
  const indicadores = dado.indicadores.filter(i => doPeriodo.some(l => l.indicador === i.codigo));
  const empresaInteira = doPeriodo.filter(l => l.setorId === null);
  const nEmpresa = Math.max(0, ...empresaInteira.map(l => l.n));

  const celula = (setorId: string | null, codigo: string) => doPeriodo.find(l => l.setorId === setorId && l.indicador === codigo);
  const opacidade = (codigo: string, v: number) => (codigo === 'adesao' ? v / 100 : codigo === 'humor' || codigo === 'energia' ? (v - 1) / 4 : v / 100) * 0.28;
  const Cel = ({ l, codigo, origem }: { l?: { valor: number }; codigo: string; origem: string }) =>
    l ? <td className="num tinta" style={{ '--o': opacidade(codigo, l.valor) } as React.CSSProperties}><i /><span>{formatarValor(codigo, origem, l.valor)}</span></td> : <td className="num suprimido">n &lt; {K}</td>;

  const exportar = () => {
    const linhas: (string | number | null)[][] = [['Empresa', 'Período', 'Setor', 'Indicador', 'Pessoas no recorte (n)', 'Valor']];
    for (const l of dado.linhas) linhas.push([atual!.empresa.nome, l.periodo.slice(0, 7), l.setor ?? 'Empresa inteira', l.indicadorNome, l.n, formatarValor(l.indicador, l.origem, l.valor)]);
    baixar(`contigo-nr1-${atual!.empresa.nome.replace(/\s+/g, '-').toLowerCase()}.csv`, csv(linhas));
  };

  return (
    <>
      <Cabeca olho={atual!.empresa.nome} titulo="Painel NR-1" sub={<>Só o grupo, nunca a pessoa. Recorte com menos de {K} respondentes não aparece — em lugar nenhum.</>}>
        <select className="gcampo" style={{ width: 'auto' }} value={per} onChange={e => setPeriodo(e.target.value)} aria-label="Período">
          {periodos.map(p => <option key={p} value={p}>{mesBr(p)}</option>)}
        </select>
        <button className="gbtn gbtn-leve" onClick={exportar}><Ico.baixar />Exportar para o PGR (CSV)</button>
      </Cabeca>

      <div className="grade">
        {indicadores.map((i, k) => {
          const l = empresaInteira.find(x => x.indicador === i.codigo);
          const ant = doAnterior.find(x => x.setorId === null && x.indicador === i.codigo);
          const delta = l && ant ? l.valor - ant.valor : null;
          const I = ICONE[i.codigo] ?? Ico.grafico;
          return (
            <motion.div className="gcartao kpi" style={{ '--cor': COR[i.codigo] ?? 'var(--ameixa)' } as React.CSSProperties} key={i.codigo} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.06 }}>
              <h3><span className="ico"><I /></span>{i.nome}</h3>
              {l ? (
                <>
                  <div className="numero">{formatarValor(i.codigo, i.origem, l.valor)}<small>{l.n} pessoas</small></div>
                  {delta !== null && Math.abs(delta) >= 0.05 && (
                    <span className={'tendencia ' + (delta > 0 ? 'sobe' : 'desce')}>{delta > 0 ? '↑' : '↓'} {formatarValor(i.codigo, i.origem, Math.abs(delta))} vs. mês anterior</span>
                  )}
                  {delta !== null && Math.abs(delta) < 0.05 && <span className="tendencia">= mês anterior</span>}
                </>
              ) : <><div className="numero" style={{ color: 'var(--linha-2)' }}>—</div><span className="quando"><Ico.cadeado />recorte pequeno demais</span></>}
              <p className="gpequeno gfraco" style={{ margin: '10px 0 0' }}>{i.descricao}</p>
            </motion.div>
          );
        })}
      </div>

      <h2>Por setor — {mesBr(per)}</h2>
      <div className="rolagem">
        <table className="tabela">
          <thead><tr><th>Setor</th>{indicadores.map(i => <th key={i.codigo} style={{ textAlign: 'right' }}>{i.nome}</th>)}<th style={{ textAlign: 'right' }}>Pessoas</th></tr></thead>
          <tbody>
            <tr>
              <td><b>Empresa inteira</b></td>
              {indicadores.map(i => <Cel key={i.codigo} l={celula(null, i.codigo)} codigo={i.codigo} origem={i.origem} />)}
              <td className="num">{nEmpresa || '—'}</td>
            </tr>
            {dado.setores.map(s => {
              const temAlgo = indicadores.some(i => celula(s.id, i.codigo));
              const n = Math.max(0, ...indicadores.map(i => celula(s.id, i.codigo)?.n ?? 0));
              return (
                <tr key={s.id}>
                  <td>{s.nome}</td>
                  {indicadores.map(i => <Cel key={i.codigo} l={celula(s.id, i.codigo)} codigo={i.codigo} origem={i.origem} />)}
                  <td className={temAlgo ? 'num' : 'num suprimido'}>{temAlgo ? n : 'suprimido'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="gpequeno gfraco" style={{ marginTop: 10 }}>
        A cor de fundo acompanha o valor (mais escuro = mais alto). <b>n</b> é o número de pessoas diferentes que responderam no mês naquele recorte. Adesão = pessoas com vínculo que usaram o app ao menos uma vez.
        Humor e energia vão de 1 a 5. As dimensões de risco psicossocial (demandas, controle, apoio…) entram quando o rastreio com escalas estiver ativo.
      </p>
    </>
  );
}
