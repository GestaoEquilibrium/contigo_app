import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Cabeca, Carregando, Erro, Ico, Vazio } from '../componentes/base';
import { dados } from '../lib/dados';
import { useCarregar } from '../lib/hooks';
import { useSessao } from '../lib/sessao';
import { baixar, csv, formatarValor, mesBr } from '../lib/util';

/** Painel NR-1: só agregados, só recortes com 12 ou mais pessoas. A supressão aparece — é argumento, não defeito. */
export function Painel() {
  const { atual } = useSessao();
  const empresaId = atual!.empresa.id;
  const { dado, erro, carregando } = useCarregar(async () => {
    const [linhas, setores, indicadores] = await Promise.all([dados.painel(empresaId), dados.setores(empresaId), dados.indicadores()]);
    return { linhas, setores, indicadores };
  }, [empresaId]);
  const periodos = useMemo(() => Array.from(new Set((dado?.linhas ?? []).map(l => l.periodo))).sort().reverse(), [dado]);
  const [periodo, setPeriodo] = useState<string | null>(null);
  const per = periodo ?? periodos[0] ?? null;

  if (carregando && !dado) return <Carregando />;
  if (erro) return <Erro msg={erro} />;
  if (!dado || periodos.length === 0 || !per) {
    return (
      <>
        <Cabeca titulo="Painel NR-1" sub="Indicadores agregados por setor, mês a mês." />
        <Vazio>Ainda não há indicador calculado para esta empresa. Eles aparecem quando um recorte tem <b>12 ou mais pessoas</b> respondendo no mês — e o cálculo roda no dia 1.</Vazio>
      </>
    );
  }

  const doPeriodo = dado.linhas.filter(l => l.periodo === per);
  const anterior = periodos[periodos.indexOf(per) + 1];
  const doAnterior = anterior ? dado.linhas.filter(l => l.periodo === anterior) : [];
  const indicadores = dado.indicadores.filter(i => doPeriodo.some(l => l.indicador === i.codigo));
  const empresaInteira = doPeriodo.filter(l => l.setorId === null);
  const nEmpresa = Math.max(0, ...empresaInteira.map(l => l.n));

  const celula = (setorId: string | null, codigo: string) => doPeriodo.find(l => l.setorId === setorId && l.indicador === codigo);
  const opacidade = (codigo: string, v: number) => (codigo === 'adesao' ? v / 100 : codigo === 'humor' || codigo === 'energia' ? (v - 1) / 4 : v / 100) * 0.28;
  const Cel = ({ l, codigo, origem }: { l?: { valor: number }; codigo: string; origem: string }) =>
    l ? <td className="num tinta" style={{ '--o': opacidade(codigo, l.valor) } as React.CSSProperties}><i /><span>{formatarValor(codigo, origem, l.valor)}</span></td> : <td className="num suprimido">n &lt; 12</td>;

  const exportar = () => {
    const linhas: (string | number | null)[][] = [['Empresa', 'Período', 'Setor', 'Indicador', 'Pessoas no recorte (n)', 'Valor']];
    for (const l of dado.linhas) linhas.push([atual!.empresa.nome, l.periodo.slice(0, 7), l.setor ?? 'Empresa inteira', l.indicadorNome, l.n, formatarValor(l.indicador, l.origem, l.valor)]);
    baixar(`contigo-nr1-${atual!.empresa.nome.replace(/\s+/g, '-').toLowerCase()}.csv`, csv(linhas));
  };

  return (
    <>
      <Cabeca titulo="Painel NR-1" sub={<>Só o grupo, nunca a pessoa. Recorte com menos de 12 respondentes não aparece — em lugar nenhum.</>}>
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
          const cor = i.codigo === 'adesao' ? 'var(--ambar)' : i.codigo === 'humor' ? 'var(--coral)' : i.codigo === 'energia' ? 'var(--rosa)' : 'var(--ameixa)';
          return (
            <motion.div className="gcartao kpi" style={{ '--cor': cor } as React.CSSProperties} key={i.codigo} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.06 }}>
              <h3>{i.nome}</h3>
              {l ? (
                <>
                  <div className="numero">{formatarValor(i.codigo, i.origem, l.valor)}<small>{l.n} pessoas</small></div>
                  {delta !== null && Math.abs(delta) >= 0.05 && (
                    <span className={'tendencia ' + (delta > 0 ? 'sobe' : 'desce')}>{delta > 0 ? '↑' : '↓'} {formatarValor(i.codigo, i.origem, Math.abs(delta))} vs. mês anterior</span>
                  )}
                  {delta !== null && Math.abs(delta) < 0.05 && <span className="tendencia">= mês anterior</span>}
                </>
              ) : <p className="gfraco">Recorte pequeno demais.</p>}
              <p className="gpequeno gfraco" style={{ margin: '8px 0 0' }}>{i.descricao}</p>
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
