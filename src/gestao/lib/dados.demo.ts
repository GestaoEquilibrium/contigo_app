import type {
  Acesso, Auditoria, Contrato, DadosPortal, Empresa, Indicador, LinhaPainel, Membro, MeusAcessos, Papel,
  ResultadoAgregacao, Setor, StatusMembro, UsoLicencas,
} from './tipos';

/** Demonstração: dados inventados, só na memória do navegador. Sem servidor. */
const espera = (ms = 120) => new Promise(r => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);
const agora = () => new Date().toISOString();

const INDICADORES: Indicador[] = [
  { codigo: 'adesao', nome: 'Adesão', descricao: 'Percentual de pessoas do recorte que usaram o app no mês', origem: 'adesao', ordem: 1 },
  { codigo: 'humor', nome: 'Humor', descricao: 'Média do humor diário (1 = pesado … 5 = leve)', origem: 'checkin', ordem: 2 },
  { codigo: 'energia', nome: 'Energia', descricao: 'Média da energia diária (1 = no fim … 5 = inteira)', origem: 'checkin', ordem: 3 },
  { codigo: 'demandas', nome: 'Demandas do trabalho', descricao: 'Carga, ritmo e pressão de tempo', origem: 'escala', ordem: 10 },
];

export class DadosDemo implements DadosPortal {
  readonly demo = true;
  readonly enderecoApp = window.location.origin;
  private email: string | null = null;
  private ouvintes = new Set<() => void>();

  private empresasL: Empresa[] = [
    { id: 'e1', nome: 'Fábrica Boa Vista', cnpj: '11.111.111/0001-11', ativa: true },
    { id: 'e2', nome: 'Clínica Vizinha', cnpj: '22.222.222/0001-22', ativa: true },
  ];
  private setoresL: (Setor & { empresaId: string })[] = [
    { id: 's1', empresaId: 'e1', nome: 'Produção' }, { id: 's2', empresaId: 'e1', nome: 'Administrativo' }, { id: 's3', empresaId: 'e2', nome: 'Atendimento' },
  ];
  private membrosL: (Membro & { empresaId: string })[] = [];
  private acessosL: (Acesso & { empresaId: string })[] = [
    { empresaId: 'e1', usuarioId: 'u1', email: 'rh@boavista.com.br', papel: 'rh', ativo: true, criadoEm: '2026-09-01T12:00:00Z' },
    { empresaId: 'e1', usuarioId: 'u2', email: 'gestor@boavista.com.br', papel: 'gestor', ativo: true, criadoEm: '2026-09-02T12:00:00Z' },
    { empresaId: 'e1', usuarioId: 'eu', email: 'demo@contigo.com.br', papel: 'admin', ativo: true, criadoEm: '2026-08-20T12:00:00Z' },
  ];
  private contratosL: (Contrato & { empresaId: string })[] = [
    { id: 'c1', empresaId: 'e1', licencas: 40, vigenciaInicio: '2026-09-01', vigenciaFim: '2027-08-31', camada2: true, camada3: false, ativo: true },
    { id: 'c2', empresaId: 'e2', licencas: 10, vigenciaInicio: '2026-09-01', vigenciaFim: '2027-08-31', camada2: false, camada3: false, ativo: true },
  ];
  private auditoriaL: (Auditoria & { empresaId: string })[] = [];
  private painelL: (LinhaPainel & { empresaId: string })[] = [];

  constructor() {
    const nomes = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Heitor', 'Iara', 'João', 'Karen', 'Lucas', 'Marta', 'Nilo', 'Olívia', 'Paulo', 'Quésia', 'Rafael'];
    nomes.forEach((n, i) => this.membrosL.push({
      id: 'm' + i, empresaId: 'e1', nome: n + ' Silva', email: n.toLowerCase() + '@boavista.com.br',
      setorId: i < 14 ? 's1' : 's2', setor: i < 14 ? 'Produção' : 'Administrativo',
      status: i % 6 === 5 ? 'convidado' : 'ativo', convidadoEm: '2026-09-03T12:00:00Z', ativadoEm: i % 6 === 5 ? null : '2026-09-04T12:00:00Z', desativadoEm: null,
    }));
    for (const periodo of ['2026-08-01', '2026-09-01']) {
      const f = periodo === '2026-09-01' ? 0.2 : 0;
      this.painelL.push(
        { empresaId: 'e1', setorId: null, setor: null, periodo, indicador: 'adesao', indicadorNome: 'Adesão', origem: 'adesao', n: 18, valor: 72 + f * 40 },
        { empresaId: 'e1', setorId: null, setor: null, periodo, indicador: 'humor', indicadorNome: 'Humor', origem: 'checkin', n: 16, valor: 3.4 + f },
        { empresaId: 'e1', setorId: null, setor: null, periodo, indicador: 'energia', indicadorNome: 'Energia', origem: 'checkin', n: 16, valor: 3.1 + f },
        { empresaId: 'e1', setorId: 's1', setor: 'Produção', periodo, indicador: 'adesao', indicadorNome: 'Adesão', origem: 'adesao', n: 14, valor: 78 + f * 30 },
        { empresaId: 'e1', setorId: 's1', setor: 'Produção', periodo, indicador: 'humor', indicadorNome: 'Humor', origem: 'checkin', n: 13, valor: 3.2 + f },
        { empresaId: 'e1', setorId: 's1', setor: 'Produção', periodo, indicador: 'energia', indicadorNome: 'Energia', origem: 'checkin', n: 13, valor: 2.9 + f },
      );
    }
    this.auditoriaL.push({ id: 1, empresaId: 'e1', em: '2026-09-03T12:00:00Z', email: 'rh@boavista.com.br', tabela: 'membros_empresa', operacao: 'INSERT', registroId: 'm0', antes: null, depois: { nome: 'Ana Silva', status: 'convidado' } });
  }

  private aud(empresaId: string, tabela: string, operacao: string, registroId: string, depois: Record<string, unknown>) {
    this.auditoriaL.unshift({ id: this.auditoriaL.length + 1, empresaId, em: agora(), email: this.email, tabela, operacao, registroId, antes: null, depois });
  }

  async sessaoAtual() { return this.email ? { email: this.email } : null; }
  aoMudarSessao(cb: () => void) { this.ouvintes.add(cb); return () => { this.ouvintes.delete(cb); }; }
  async entrarComSenha(email: string) { await espera(); this.email = email; this.ouvintes.forEach(f => f()); }
  async criarConta(email: string) { await espera(); this.email = email; this.ouvintes.forEach(f => f()); return 'entrou' as const; }
  async enviarCodigo() { await espera(); }
  async confirmarCodigo(email: string) { await espera(); this.email = email; this.ouvintes.forEach(f => f()); }
  async sair() { this.email = null; this.ouvintes.forEach(f => f()); }
  async meusAcessos(): Promise<MeusAcessos> {
    await espera(60);
    return { empresas: [{ empresa: this.empresasL[0], papel: 'admin' }], operacao: true, email: this.email ?? '' };
  }

  async indicadores() { return INDICADORES; }
  async painel(empresaId: string) { await espera(); return this.painelL.filter(l => l.empresaId === empresaId); }

  async setores(empresaId: string) { return this.setoresL.filter(s => s.empresaId === empresaId).map(({ id, nome }) => ({ id, nome })); }
  async criarSetor(empresaId: string, nome: string) { this.setoresL.push({ id: uid(), empresaId, nome }); }
  async renomearSetor(id: string, nome: string) { const s = this.setoresL.find(x => x.id === id); if (s) s.nome = nome; this.membrosL.forEach(m => { if (m.setorId === id) m.setor = nome; }); }
  async apagarSetor(id: string) { this.setoresL = this.setoresL.filter(s => s.id !== id); this.membrosL.forEach(m => { if (m.setorId === id) { m.setorId = null; m.setor = null; } }); }
  async membros(empresaId: string) { await espera(); return this.membrosL.filter(m => m.empresaId === empresaId); }
  async convidar(empresaId: string, nome: string, email: string, setorId: string | null) {
    await espera();
    const contrato = this.contratosL.find(c => c.empresaId === empresaId && c.ativo);
    const ocupadas = this.membrosL.filter(m => m.empresaId === empresaId && m.status !== 'inativo').length;
    let m = this.membrosL.find(x => x.empresaId === empresaId && x.email === email.toLowerCase());
    if (!m && contrato && ocupadas >= contrato.licencas) throw new Error(`Limite de licenças do contrato atingido (${ocupadas} de ${contrato.licencas}).`);
    const setor = this.setoresL.find(s => s.id === setorId)?.nome ?? null;
    if (m) { m.nome = nome; m.setorId = setorId; m.setor = setor; if (m.status === 'inativo') m.status = 'convidado'; }
    else { m = { id: uid(), empresaId, nome, email: email.toLowerCase(), setorId, setor, status: 'convidado', convidadoEm: agora(), ativadoEm: null, desativadoEm: null }; this.membrosL.push(m); }
    this.aud(empresaId, 'membros_empresa', 'INSERT', m.id, { nome, email, status: m.status });
    return { membroId: m.id, token: uid() + uid() + uid() };
  }
  async alterarMembro(id: string, mud: { setorId?: string | null; status?: StatusMembro }) {
    const m = this.membrosL.find(x => x.id === id); if (!m) return;
    if (mud.setorId !== undefined) { m.setorId = mud.setorId; m.setor = this.setoresL.find(s => s.id === mud.setorId)?.nome ?? null; }
    if (mud.status) { m.status = mud.status; if (mud.status === 'inativo') m.desativadoEm = agora(); }
    this.aud(m.empresaId, 'membros_empresa', 'UPDATE', id, { ...mud });
  }

  async acessos(empresaId: string) { return this.acessosL.filter(a => a.empresaId === empresaId); }
  async concederAcesso(empresaId: string, email: string, papel: Papel) {
    const a = this.acessosL.find(x => x.empresaId === empresaId && x.email === email);
    if (a) { a.papel = papel; a.ativo = true; } else this.acessosL.push({ empresaId, usuarioId: uid(), email, papel, ativo: true, criadoEm: agora() });
  }
  async alterarAcesso(empresaId: string, usuarioId: string, mud: { papel?: Papel; ativo?: boolean }) {
    const a = this.acessosL.find(x => x.empresaId === empresaId && x.usuarioId === usuarioId); if (a) Object.assign(a, mud);
  }
  async usoLicencas(empresaId: string): Promise<UsoLicencas> {
    const c = this.contratosL.find(x => x.empresaId === empresaId && x.ativo);
    const ms = this.membrosL.filter(m => m.empresaId === empresaId);
    return { licencas: c?.licencas ?? null, convidados: ms.filter(m => m.status === 'convidado').length, ativos: ms.filter(m => m.status === 'ativo').length,
      vigenciaInicio: c?.vigenciaInicio ?? null, vigenciaFim: c?.vigenciaFim ?? null, camada2: !!c?.camada2, camada3: !!c?.camada3 };
  }
  async contratos(empresaId: string) { return this.contratosL.filter(c => c.empresaId === empresaId); }
  async auditoria(empresaId: string) { return this.auditoriaL.filter(a => a.empresaId === empresaId); }

  async empresas() { return this.empresasL; }
  async criarEmpresa(nome: string, cnpj: string | null) { const e = { id: uid(), nome, cnpj, ativa: true }; this.empresasL.push(e); return e; }
  async alterarEmpresa(id: string, mud: { nome?: string; ativa?: boolean }) { const e = this.empresasL.find(x => x.id === id); if (e) Object.assign(e, mud); }
  async criarContrato(empresaId: string, c: Omit<Contrato, 'id' | 'ativo'>) { this.contratosL.push({ id: uid(), empresaId, ativo: true, ...c }); }
  async encerrarContrato(id: string) { const c = this.contratosL.find(x => x.id === id); if (c) c.ativo = false; }
  async calcularAgregados(periodo: string): Promise<ResultadoAgregacao> { await espera(400); return { periodo, k: 12, linhas: 6, recortesSuprimidos: 3 }; }
}
