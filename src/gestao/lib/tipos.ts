export type Papel = 'admin' | 'rh' | 'gestor' | 'sesmt';
export type StatusMembro = 'convidado' | 'ativo' | 'inativo';

export interface Empresa { id: string; nome: string; cnpj: string | null; ativa: boolean; }
export interface AcessoMeu { empresa: Empresa; papel: Papel; }
export interface MeusAcessos { empresas: AcessoMeu[]; operacao: boolean; email: string; }

export interface Setor { id: string; nome: string; }
export interface Membro {
  id: string; nome: string; email: string; setorId: string | null; setor: string | null;
  status: StatusMembro; convidadoEm: string; ativadoEm: string | null; desativadoEm: string | null;
}
export interface Acesso { usuarioId: string; email: string; papel: Papel; ativo: boolean; criadoEm: string; }
export interface Contrato {
  id: string; licencas: number; vigenciaInicio: string; vigenciaFim: string; camada2: boolean; camada3: boolean; ativo: boolean;
}
export interface UsoLicencas {
  licencas: number | null; convidados: number; ativos: number;
  vigenciaInicio: string | null; vigenciaFim: string | null; camada2: boolean; camada3: boolean;
}
export interface LinhaPainel {
  setorId: string | null; setor: string | null; periodo: string; indicador: string; indicadorNome: string;
  origem: 'checkin' | 'escala' | 'adesao'; n: number; valor: number;
}
export interface Indicador { codigo: string; nome: string; descricao: string | null; origem: string; ordem: number; }
export interface Auditoria {
  id: number; em: string; email: string | null; tabela: string; operacao: string; registroId: string | null;
  antes: Record<string, unknown> | null; depois: Record<string, unknown> | null;
}
export interface ResultadoAgregacao { periodo: string; k: number; linhas: number; recortesSuprimidos: number; }

/** O que o portal pede ao banco. Duas implementações: Supabase e demonstração. */
export interface DadosPortal {
  readonly demo: boolean;
  readonly enderecoApp: string;   // onde o link de ativação aponta

  // sessão
  sessaoAtual(): Promise<{ email: string } | null>;
  aoMudarSessao(cb: () => void): () => void;
  entrarComSenha(email: string, senha: string): Promise<void>;
  criarConta(email: string, senha: string): Promise<'entrou' | 'confirmar_email'>;
  enviarCodigo(email: string, voltarPara: string): Promise<void>;
  confirmarCodigo(email: string, codigo: string): Promise<void>;
  sair(): Promise<void>;
  meusAcessos(): Promise<MeusAcessos>;

  // painel
  indicadores(): Promise<Indicador[]>;
  painel(empresaId: string): Promise<LinhaPainel[]>;

  // cadastro
  setores(empresaId: string): Promise<Setor[]>;
  criarSetor(empresaId: string, nome: string): Promise<void>;
  renomearSetor(id: string, nome: string): Promise<void>;
  apagarSetor(id: string): Promise<void>;
  membros(empresaId: string): Promise<Membro[]>;
  convidar(empresaId: string, nome: string, email: string, setorId: string | null): Promise<{ membroId: string; token: string }>;
  alterarMembro(id: string, mudancas: { setorId?: string | null; status?: StatusMembro }): Promise<void>;

  // acessos, contrato, auditoria
  acessos(empresaId: string): Promise<Acesso[]>;
  concederAcesso(empresaId: string, email: string, papel: Papel): Promise<void>;
  alterarAcesso(empresaId: string, usuarioId: string, mudancas: { papel?: Papel; ativo?: boolean }): Promise<void>;
  usoLicencas(empresaId: string): Promise<UsoLicencas>;
  contratos(empresaId: string): Promise<Contrato[]>;
  auditoria(empresaId: string, limite?: number): Promise<Auditoria[]>;

  // operação (equipe do Contigo)
  empresas(): Promise<Empresa[]>;
  criarEmpresa(nome: string, cnpj: string | null): Promise<Empresa>;
  alterarEmpresa(id: string, mudancas: { nome?: string; ativa?: boolean }): Promise<void>;
  criarContrato(empresaId: string, c: Omit<Contrato, 'id' | 'ativo'>): Promise<void>;
  encerrarContrato(id: string): Promise<void>;
  calcularAgregados(periodo: string): Promise<ResultadoAgregacao>;
}

export const PAPEIS: { valor: Papel; nome: string; descricao: string }[] = [
  { valor: 'admin',  nome: 'Administrador', descricao: 'Tudo: cadastro, acessos, contrato, painel e auditoria' },
  { valor: 'rh',     nome: 'RH',            descricao: 'Cadastro de funcionários, setores e convites; vê o painel' },
  { valor: 'gestor', nome: 'Gestor',        descricao: 'Só o painel agregado. Não vê a lista nominal' },
  { valor: 'sesmt',  nome: 'SESMT',         descricao: 'Painel agregado e exportação para o PGR' },
];
