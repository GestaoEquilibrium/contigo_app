export type Momento = 'manha' | 'meiodia' | 'noite';
export type Vinculo = 'convidado' | 'ativo' | 'inativo';

export interface Conta {
  pessoaId: string;
  nome: string | null;
  empresa: string | null;
  setor: string | null;
  membroId: string | null;
  vinculo: Vinculo | null;
  consentiu: boolean;
  versaoConsentimento: number;
  camada2: boolean;
}

export interface Checkin {
  data: string;            // yyyy-mm-dd
  momento: Momento;
  humor: number;           // 1..5
  energia: number;         // 1..5
  intencao: string | null;
}

export interface Pratica {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  momento: Momento | null;
  duracaoSeg: number;
}

export interface Trilha {
  id: string;
  codigo: string;
  nome: string;
  subtitulo: string | null;
  frase: string | null;
  ordem: number;
}

export interface Passo {
  id: string;
  trilhaId: string;
  ordem: number;
  titulo: string;
  tipo: 'leitura' | 'reflexao' | 'pratica';
  minutos: number;
  trechos: string[];
}

export type Afinidade = Record<string, string>;

export interface Preferencias {
  avisarConversa: boolean;
}

export interface TextoConsentimento {
  versao: number;
  texto: string;
}

export interface ResultadoApagar {
  apagados: number;
  retidosParaDecisaoRt: number;
}

/** Contrato entre as telas e o banco. Duas implementações: Supabase e demonstração. */
export interface Dados {
  readonly demo: boolean;

  // sessão
  sessaoAtual(): Promise<{ email: string } | null>;
  aoMudarSessao(cb: () => void): () => void;
  enviarCodigo(email: string, voltarPara: string): Promise<void>;
  confirmarCodigo(email: string, codigo: string): Promise<void>;
  sair(): Promise<void>;

  // conta
  minhaConta(): Promise<Conta>;
  aceitarConvite(token: string): Promise<{ empresa: string; nome: string }>;
  textoConsentimento(): Promise<TextoConsentimento>;
  registrarConsentimento(versao: number): Promise<void>;
  mudarNome(nome: string): Promise<void>;
  apagarMeusDados(): Promise<ResultadoApagar>;

  // ritual
  checkinsDeHoje(data: string): Promise<Checkin[]>;
  gravarCheckin(c: Checkin): Promise<void>;
  praticas(): Promise<Pratica[]>;
  praticasFeitasHoje(data: string): Promise<string[]>;   // ids de prática
  registrarPratica(praticaId: string, duracaoSeg: number): Promise<void>;

  // trilhas
  trilhas(): Promise<Trilha[]>;
  passos(): Promise<Passo[]>;                            // de todas as trilhas publicadas
  passosConcluidos(): Promise<string[]>;                 // ids de passo
  concluirPasso(passoId: string): Promise<void>;

  // afinidade e preferências
  afinidade(): Promise<Afinidade | null>;
  gravarAfinidade(r: Afinidade): Promise<void>;
  preferencias(): Promise<Preferencias>;
  gravarPreferencias(p: Preferencias): Promise<void>;
}
