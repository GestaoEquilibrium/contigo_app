import type {
  Afinidade, Checkin, Conta, Dados, Passo, Pratica, Preferencias, ResultadoApagar, TextoConsentimento, Trilha,
} from './tipos';
import { local } from './util';

/**
 * Modo demonstração: sem servidor, sem chave. Tudo fica só neste aparelho.
 * Serve para sentir o produto — não tem valor clínico e não vai para lugar nenhum.
 */
const K = 'contigo.demo';

interface Estado {
  email: string | null;
  nome: string | null;
  vinculo: 'ativo' | 'inativo' | null;
  consentiu: boolean;
  checkins: Checkin[];
  praticasFeitas: { praticaId: string; em: string }[];
  passosConcluidos: string[];
  afinidade: Afinidade | null;
  prefs: Preferencias;
}
const vazio = (): Estado => ({
  email: null, nome: null, vinculo: null, consentiu: false,
  checkins: [], praticasFeitas: [], passosConcluidos: [], afinidade: null, prefs: { avisarConversa: false },
});

const PRATICAS: Pratica[] = [
  { id: 'p1', codigo: 'respirar_1min', nome: 'Respirar por 1 minuto', descricao: 'Antes de o dia começar a puxar você.', momento: 'manha', duracaoSeg: 60 },
  { id: 'p2', codigo: 'pausa_2min', nome: 'Pausa de 2 minutos', descricao: 'O corpo pede um intervalo no meio do dia.', momento: 'meiodia', duracaoSeg: 120 },
  { id: 'p3', codigo: 'preparar_sono', nome: 'Preparar o sono', descricao: 'Respirações lentas para o corpo entender que o dia acabou.', momento: 'noite', duracaoSeg: 90 },
];

const TRILHAS: Trilha[] = [
  { id: 't-sono', codigo: 'sono', nome: 'Sono', subtitulo: 'Quatro semanas para dormir melhor', frase: 'O corpo desacelera antes da mente. Esta trilha trabalha o que vem antes de deitar.', ordem: 1 },
];

// Rascunho para revisão clínica — o mesmo texto que está no banco.
const PASSOS_SONO: Omit<Passo, 'id' | 'trilhaId'>[] = [
  { ordem: 1, titulo: 'Por que o sono é o primeiro alvo', tipo: 'leitura', minutos: 3, trechos: [
    'Quando o sono quebra, tudo fica mais difícil: a paciência encurta, o corpo dói mais, a cabeça repete pensamento.',
    'Por isso o sono é o primeiro lugar onde a gente mexe. Não porque é o mais importante, mas porque é o que destrava o resto.',
    'Aqui você não vai receber uma receita de "durma oito horas". Vamos olhar para o que acontece nas duas horas antes de deitar — que é onde quase sempre está o problema.'] },
  { ordem: 2, titulo: 'O que você faz na última hora do dia', tipo: 'reflexao', minutos: 4, trechos: [
    'Pense na noite de ontem. O que você estava fazendo uma hora antes de apagar a luz?',
    'Não é para julgar. É só para enxergar. A maioria das pessoas nunca parou para olhar essa hora — ela simplesmente acontece.',
    'Guarde essa imagem. Nos próximos passos ela vai fazer sentido.'] },
  { ordem: 3, titulo: 'A diferença entre cansaço e sono', tipo: 'leitura', minutos: 3, trechos: [
    'Cansaço é o corpo pedindo para parar. Sono é o corpo pronto para dormir. Parecem a mesma coisa, mas não são.',
    'Dá para estar exausto e sem sono nenhum — deitado, olhando o teto. E dá para estar com sono e continuar acordado por hábito.',
    'Reconhecer qual dos dois você está sentindo já muda o que fazer.'] },
  { ordem: 4, titulo: 'Primeiro sinal: a luz', tipo: 'pratica', minutos: 2, trechos: [
    'A luz forte diz para o corpo que ainda é dia. A tela do celular, a luz branca da cozinha — tudo isso adia o sono.',
    'A prática de hoje é simples: uma hora antes de deitar, deixe a casa mais escura. Uma luz baixa e amarelada já resolve.',
    'Experimente hoje à noite. Amanhã a gente conversa sobre como foi.'] },
  { ordem: 5, titulo: 'Segundo sinal: a temperatura', tipo: 'pratica', minutos: 2, trechos: [
    'O corpo precisa esfriar um pouco para dormir. Um quarto abafado atrasa isso.',
    'Hoje, antes de deitar: abra a janela por alguns minutos ou deixe o quarto mais fresco do que o resto da casa.',
    'Não precisa ser perfeito. Só um pouco mais fresco do que ontem.'] },
  { ordem: 6, titulo: 'Quando a cabeça não desliga', tipo: 'pratica', minutos: 3, trechos: [
    'Deitar e a cabeça começar a repassar o dia é uma das coisas mais comuns do mundo. Não é defeito seu.',
    'Uma saída simples: antes de deitar, escreva em um papel as três coisas que estão rondando. Não para resolver — só para tirar da cabeça e pôr no papel.',
    'A cabeça solta o que sabe que está guardado em algum lugar.'] },
  { ordem: 7, titulo: 'A sua hora de desligar', tipo: 'reflexao', minutos: 4, trechos: [
    'Você já olhou para a sua última hora, para a luz, para a temperatura e para os pensamentos. Agora é juntar.',
    'Pense em uma sequência curta, sua, para os minutos antes de deitar. Duas ou três coisas, não mais. Coisas que você consegue fazer numa noite ruim também.',
    'Isso é a sua rotina de desligar. Ela não precisa ser bonita — precisa ser sua.'] },
];
const PASSOS: Passo[] = PASSOS_SONO.map(p => ({ ...p, id: `sono-${p.ordem}`, trilhaId: 't-sono' }));

const TEXTO_CONSENTIMENTO = 'O Contigo registra o que você responde no aplicativo — como você está, práticas que fez e questionários — para que um profissional de psicologia possa acompanhar você ao longo do tempo. O aplicativo não devolve resultado nem diagnóstico: só o profissional lê e interpreta. A sua empresa recebe apenas indicadores do grupo, sem nome e sem qualquer dado que permita identificar você, e somente quando o grupo tem 12 pessoas ou mais. Você pode pedir para ver, corrigir ou apagar o que registrou a qualquer momento, como garante a Lei Geral de Proteção de Dados.';

const espera = (ms = 120) => new Promise(r => setTimeout(r, ms));

export class DadosDemo implements Dados {
  readonly demo = true;
  private ouvintes = new Set<() => void>();
  private e: Estado = local.ler<Estado>(K, vazio());

  private salvar() { local.gravar(K, this.e); }
  private avisar() { this.ouvintes.forEach(f => f()); }

  async sessaoAtual() { return this.e.email ? { email: this.e.email } : null; }
  aoMudarSessao(cb: () => void) { this.ouvintes.add(cb); return () => { this.ouvintes.delete(cb); }; }
  async enviarCodigo(email: string) { await espera(); local.gravar('contigo.demo.email-pendente', email); }
  async confirmarCodigo(email: string) { await espera(); this.e.email = email; this.salvar(); this.avisar(); }
  async sair() { this.e.email = null; this.salvar(); this.avisar(); }

  async minhaConta(): Promise<Conta> {
    await espera(60);
    return {
      pessoaId: 'demo', nome: this.e.nome, empresa: this.e.vinculo ? 'Empresa Demonstração' : null,
      setor: this.e.vinculo ? 'Produção' : null, membroId: this.e.vinculo === 'ativo' ? 'demo-membro' : null,
      vinculo: this.e.vinculo, consentiu: this.e.consentiu, versaoConsentimento: 1, camada2: true,
    };
  }
  async aceitarConvite() {
    await espera();
    this.e.vinculo = 'ativo'; this.e.nome = this.e.nome || 'Visitante'; this.salvar();
    return { empresa: 'Empresa Demonstração', nome: this.e.nome };
  }
  async textoConsentimento(): Promise<TextoConsentimento> { return { versao: 1, texto: TEXTO_CONSENTIMENTO }; }
  async registrarConsentimento() { this.e.consentiu = true; this.salvar(); }
  async mudarNome(nome: string) { this.e.nome = nome.trim() || null; this.salvar(); }
  async apagarMeusDados(): Promise<ResultadoApagar> {
    const n = this.e.checkins.length + this.e.praticasFeitas.length + this.e.passosConcluidos.length + (this.e.afinidade ? 1 : 0);
    this.e = { ...vazio(), email: null }; this.salvar(); this.avisar();
    return { apagados: n, retidosParaDecisaoRt: 0 };
  }

  async checkinsDeHoje(data: string) { return this.e.checkins.filter(c => c.data === data); }
  async gravarCheckin(c: Checkin) {
    this.e.checkins = this.e.checkins.filter(x => !(x.data === c.data && x.momento === c.momento)).concat(c); this.salvar();
  }
  async praticas() { return PRATICAS; }
  async praticasFeitasHoje(data: string) { return this.e.praticasFeitas.filter(p => p.em.startsWith(data)).map(p => p.praticaId); }
  async registrarPratica(praticaId: string) {
    const d = new Date(); const p = (n: number) => String(n).padStart(2, '0');
    this.e.praticasFeitas.push({ praticaId, em: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` });
    this.salvar();
  }

  async trilhas() { return TRILHAS; }
  async passos() { return PASSOS; }
  async passosConcluidos() { return this.e.passosConcluidos; }
  async concluirPasso(id: string) { if (!this.e.passosConcluidos.includes(id)) { this.e.passosConcluidos.push(id); this.salvar(); } }

  async afinidade() { return this.e.afinidade; }
  async gravarAfinidade(r: Afinidade) { this.e.afinidade = r; this.salvar(); }
  async preferencias() { return this.e.prefs; }
  async gravarPreferencias(p: Preferencias) { this.e.prefs = p; this.salvar(); }
}
