import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Afinidade, Checkin, Conta, Dados, Passo, Pratica, Preferencias, ResultadoApagar, TextoConsentimento, Trilha,
} from './tipos';

/** Traduz erros do banco para frases que a pessoa entende. */
function traduzir(e: unknown): Error {
  const msg = (e as { message?: string })?.message || String(e);
  const code = (e as { code?: string })?.code || '';
  if (code === '42501' || /row-level security/i.test(msg)) return new Error('O Contigo não pôde gravar isso. Confira se você aceitou o termo e se o seu acesso está ativo.');
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return new Error('Sem conexão agora. Tente de novo em instantes.');
  return new Error(msg);
}

export class DadosSupabase implements Dados {
  readonly demo = false;
  private conta: Conta | null = null;

  constructor(private sb: SupabaseClient) {}

  private get clinico() { return this.sb.schema('clinico'); }

  private async ids(): Promise<{ pessoaId: string; membroId: string }> {
    const c = this.conta ?? (await this.minhaConta());
    if (!c.membroId) throw new Error('Você ainda não tem um acesso ativo.');
    return { pessoaId: c.pessoaId, membroId: c.membroId };
  }

  // ---- sessão ---------------------------------------------------------------
  async sessaoAtual() {
    const { data } = await this.sb.auth.getSession();
    const email = data.session?.user.email;
    return email ? { email } : null;
  }
  aoMudarSessao(cb: () => void) {
    const { data } = this.sb.auth.onAuthStateChange(() => { this.conta = null; cb(); });
    return () => data.subscription.unsubscribe();
  }
  async enviarCodigo(email: string, voltarPara: string) {
    const { error } = await this.sb.auth.signInWithOtp({
      email, options: { emailRedirectTo: voltarPara, shouldCreateUser: true },
    });
    if (error) {
      if (/rate limit|429/i.test(error.message)) throw new Error('Muitas tentativas. Espere um minuto e tente de novo.');
      throw traduzir(error);
    }
  }
  async confirmarCodigo(email: string, codigo: string) {
    const { error } = await this.sb.auth.verifyOtp({ email, token: codigo.replace(/\D/g, ''), type: 'email' });
    if (error) throw new Error('Código não confere ou já venceu. Peça um novo.');
  }
  async entrarComSenha(email: string, senha: string) {
    const { error } = await this.sb.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error('E-mail ou senha não conferem.');
  }
  async sair() { this.conta = null; await this.sb.auth.signOut(); }

  // ---- conta ------------------------------------------------------------------
  async minhaConta(): Promise<Conta> {
    const { data, error } = await this.sb.rpc('minha_conta');
    if (error) throw traduzir(error);
    const j = (data ?? {}) as Record<string, unknown>;
    this.conta = {
      pessoaId: String(j.pessoa_id),
      nome: (j.nome as string | null) ?? null,
      empresa: (j.empresa as string | null) ?? null,
      setor: (j.setor as string | null) ?? null,
      membroId: (j.membro_id as string | null) ?? null,
      vinculo: (j.vinculo as Conta['vinculo']) ?? null,
      consentiu: Boolean(j.consentiu),
      versaoConsentimento: Number(j.versao_consentimento ?? 1),
      camada2: Boolean(j.camada_2),
    };
    return this.conta;
  }
  async aceitarConvite(token: string) {
    const { data, error } = await this.sb.rpc('aceitar_convite', { p_token: token });
    if (error) throw new Error(error.message);   // as mensagens do banco já são para gente
    this.conta = null;
    const j = data as { empresa: string; nome: string };
    return { empresa: j.empresa, nome: j.nome };
  }
  async textoConsentimento(): Promise<TextoConsentimento> {
    const { data, error } = await this.sb.from('textos_consentimento').select('versao, texto').order('versao', { ascending: false }).limit(1).single();
    if (error) throw traduzir(error);
    return { versao: data.versao as number, texto: data.texto as string };
  }
  async registrarConsentimento(versao: number) {
    const { error } = await this.sb.rpc('registrar_consentimento', { p_versao: versao });
    if (error) throw traduzir(error);
    this.conta = null;
  }
  async mudarNome(nome: string) {
    const { pessoaId } = await this.ids().catch(async () => ({ pessoaId: (await this.minhaConta()).pessoaId }));
    const { error } = await this.sb.from('pessoas').update({ nome_exibicao: nome.trim() || null }).eq('id', pessoaId);
    if (error) throw traduzir(error);
    this.conta = null;
  }
  async apagarMeusDados(): Promise<ResultadoApagar> {
    const { data, error } = await this.sb.rpc('apagar_meus_dados');
    if (error) throw traduzir(error);
    this.conta = null;
    const j = data as { apagados: number; retidos_para_decisao_rt: number };
    return { apagados: j.apagados, retidosParaDecisaoRt: j.retidos_para_decisao_rt };
  }

  // ---- ritual -----------------------------------------------------------------
  async checkinsDeHoje(data: string): Promise<Checkin[]> {
    const { pessoaId } = await this.ids();
    const { data: rows, error } = await this.clinico.from('checkins')
      .select('data, momento, humor, energia, intencao').eq('pessoa_id', pessoaId).eq('data', data);
    if (error) throw traduzir(error);
    return (rows ?? []) as Checkin[];
  }
  async gravarCheckin(c: Checkin) {
    const { pessoaId, membroId } = await this.ids();
    const { error } = await this.clinico.from('checkins').upsert(
      { pessoa_id: pessoaId, membro_id: membroId, data: c.data, momento: c.momento, humor: c.humor, energia: c.energia, intencao: c.intencao },
      { onConflict: 'pessoa_id,data,momento' },
    );
    if (error) throw traduzir(error);
  }
  async praticas(): Promise<Pratica[]> {
    const { data, error } = await this.sb.from('praticas').select('id, codigo, nome, descricao, momento, duracao_seg');
    if (error) throw traduzir(error);
    return (data ?? []).map(r => ({ id: r.id, codigo: r.codigo, nome: r.nome, descricao: r.descricao, momento: r.momento, duracaoSeg: r.duracao_seg }));
  }
  async praticasFeitasHoje(data: string): Promise<string[]> {
    const { pessoaId } = await this.ids();
    const ini = `${data}T00:00:00`, fim = `${data}T23:59:59`;
    const { data: rows, error } = await this.clinico.from('praticas_feitas').select('pratica_id')
      .eq('pessoa_id', pessoaId).gte('em', ini).lte('em', fim);
    if (error) throw traduzir(error);
    return (rows ?? []).map(r => r.pratica_id as string);
  }
  async registrarPratica(praticaId: string, duracaoSeg: number) {
    const { pessoaId, membroId } = await this.ids();
    const { error } = await this.clinico.from('praticas_feitas').insert({ pessoa_id: pessoaId, membro_id: membroId, pratica_id: praticaId, duracao_seg: duracaoSeg });
    if (error) throw traduzir(error);
  }

  // ---- trilhas ----------------------------------------------------------------
  async trilhas(): Promise<Trilha[]> {
    const { data, error } = await this.sb.from('trilhas').select('id, codigo, nome, subtitulo, frase, ordem').order('ordem');
    if (error) throw traduzir(error);
    return (data ?? []) as Trilha[];
  }
  async passos(): Promise<Passo[]> {
    const { data, error } = await this.sb.from('passos_trilha').select('id, trilha_id, ordem, titulo, tipo, minutos, trechos').order('ordem');
    if (error) throw traduzir(error);
    return (data ?? []).map(r => ({ id: r.id, trilhaId: r.trilha_id, ordem: r.ordem, titulo: r.titulo, tipo: r.tipo, minutos: r.minutos, trechos: r.trechos ?? [] }));
  }
  async passosConcluidos(): Promise<string[]> {
    const { pessoaId } = await this.ids();
    const { data, error } = await this.clinico.from('progresso_trilha').select('passo_id').eq('pessoa_id', pessoaId);
    if (error) throw traduzir(error);
    return (data ?? []).map(r => r.passo_id as string);
  }
  async concluirPasso(passoId: string) {
    const { pessoaId, membroId } = await this.ids();
    const { error } = await this.clinico.from('progresso_trilha').insert({ pessoa_id: pessoaId, membro_id: membroId, passo_id: passoId });
    if (error && error.code !== '23505') throw traduzir(error);   // já concluído: tudo bem
  }

  // ---- afinidade e preferências ----------------------------------------------
  async afinidade(): Promise<Afinidade | null> {
    const { pessoaId } = await this.ids();
    const { data, error } = await this.clinico.from('respostas_afinidade').select('respostas').eq('pessoa_id', pessoaId).maybeSingle();
    if (error) throw traduzir(error);
    return (data?.respostas as Afinidade) ?? null;
  }
  async gravarAfinidade(r: Afinidade) {
    const { pessoaId } = await this.ids();
    const { error } = await this.clinico.from('respostas_afinidade').upsert({ pessoa_id: pessoaId, respostas: r, em: new Date().toISOString() });
    if (error) throw traduzir(error);
  }
  async preferencias(): Promise<Preferencias> {
    const { pessoaId } = await this.ids();
    const { data, error } = await this.sb.from('preferencias_app').select('avisar_conversa').eq('pessoa_id', pessoaId).maybeSingle();
    if (error) throw traduzir(error);
    return { avisarConversa: Boolean(data?.avisar_conversa) };
  }
  async gravarPreferencias(p: Preferencias) {
    const { pessoaId } = await this.ids();
    const { error } = await this.sb.from('preferencias_app').upsert({ pessoa_id: pessoaId, avisar_conversa: p.avisarConversa, atualizado_em: new Date().toISOString() });
    if (error) throw traduzir(error);
  }
}
