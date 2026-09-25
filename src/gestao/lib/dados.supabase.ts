import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Acesso, Auditoria, Contrato, DadosPortal, Empresa, Indicador, LinhaPainel, Membro, MeusAcessos, Papel,
  ResultadoAgregacao, Setor, StatusMembro, UsoLicencas,
} from './tipos';

function traduzir(e: unknown): Error {
  const msg = (e as { message?: string })?.message || String(e);
  const code = (e as { code?: string })?.code || '';
  if (code === '42501' || /row-level security|Sem permissão/i.test(msg)) return new Error('Você não tem permissão para isso nesta empresa.');
  if (code === '23505') return new Error('Já existe um registro igual a esse.');
  if (code === 'P0002' || /Limite de licenças/.test(msg)) return new Error(msg.replace(/^.*?Limite/, 'Limite'));
  if (/Failed to fetch|NetworkError/i.test(msg)) return new Error('Sem conexão agora. Tente de novo em instantes.');
  return new Error(msg);
}

export class DadosSupabase implements DadosPortal {
  readonly demo = false;
  readonly enderecoApp = window.location.origin;   // o app mora no mesmo site

  constructor(private sb: SupabaseClient) {}

  // ---- sessão ----
  async sessaoAtual() { const { data } = await this.sb.auth.getSession(); const e = data.session?.user.email; return e ? { email: e } : null; }
  aoMudarSessao(cb: () => void) { const { data } = this.sb.auth.onAuthStateChange(() => cb()); return () => data.subscription.unsubscribe(); }
  async entrarComSenha(email: string, senha: string) {
    const { error } = await this.sb.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error('E-mail ou senha não conferem.');
  }
  async criarConta(email: string, senha: string) {
    const { data, error } = await this.sb.auth.signUp({ email, password: senha });
    if (error) throw new Error(/already registered/i.test(error.message) ? 'Esse e-mail já tem conta. Entre com a senha.' : error.message);
    return data.session ? 'entrou' : 'confirmar_email';
  }
  async enviarCodigo(email: string, voltarPara: string) {
    const { error } = await this.sb.auth.signInWithOtp({ email, options: { emailRedirectTo: voltarPara, shouldCreateUser: false } });
    if (error) throw new Error(/rate limit/i.test(error.message) ? 'Muitas tentativas. Espere um minuto.' : error.message);
  }
  async confirmarCodigo(email: string, codigo: string) {
    const { error } = await this.sb.auth.verifyOtp({ email, token: codigo.replace(/\D/g, ''), type: 'email' });
    if (error) throw new Error('Código não confere ou já venceu.');
  }
  async sair() { await this.sb.auth.signOut(); }

  async meusAcessos(): Promise<MeusAcessos> {
    const { data: s } = await this.sb.auth.getSession();
    const uid = s.session?.user.id; const email = s.session?.user.email ?? '';
    if (!uid) return { empresas: [], operacao: false, email };
    const [{ data: ups, error: e1 }, { data: eq }] = await Promise.all([
      this.sb.from('usuarios_portal').select('papel, ativo, empresas(id, nome, cnpj, ativa)').eq('usuario_id', uid).eq('ativo', true),
      this.sb.from('equipe_contigo').select('papel, ativo').eq('usuario_id', uid).maybeSingle(),
    ]);
    if (e1) throw traduzir(e1);
    const empresas = (ups ?? []).flatMap(r => {
      const e = r.empresas as unknown as Empresa | null;
      return e ? [{ empresa: e, papel: r.papel as Papel }] : [];
    }).sort((a, b) => a.empresa.nome.localeCompare(b.empresa.nome));
    return { empresas, operacao: !!(eq && eq.ativo && eq.papel === 'operacao'), email };
  }

  // ---- painel ----
  async indicadores(): Promise<Indicador[]> {
    const { data, error } = await this.sb.from('indicadores').select('codigo, nome, descricao, origem, ordem').order('ordem');
    if (error) throw traduzir(error); return data as Indicador[];
  }
  async painel(empresaId: string): Promise<LinhaPainel[]> {
    const { data, error } = await this.sb.from('painel_nr1').select('setor_id, setor, periodo, indicador, indicador_nome, origem, n, valor').eq('empresa_id', empresaId);
    if (error) throw traduzir(error);
    return (data ?? []).map(r => ({ setorId: r.setor_id, setor: r.setor, periodo: r.periodo, indicador: r.indicador, indicadorNome: r.indicador_nome, origem: r.origem, n: r.n, valor: Number(r.valor) }));
  }

  // ---- cadastro ----
  async setores(empresaId: string): Promise<Setor[]> {
    const { data, error } = await this.sb.from('setores').select('id, nome').eq('empresa_id', empresaId).order('nome');
    if (error) throw traduzir(error); return data as Setor[];
  }
  async criarSetor(empresaId: string, nome: string) { const { error } = await this.sb.from('setores').insert({ empresa_id: empresaId, nome: nome.trim() }); if (error) throw traduzir(error); }
  async renomearSetor(id: string, nome: string) { const { error } = await this.sb.from('setores').update({ nome: nome.trim() }).eq('id', id); if (error) throw traduzir(error); }
  async apagarSetor(id: string) { const { error } = await this.sb.from('setores').delete().eq('id', id); if (error) throw traduzir(error); }

  async membros(empresaId: string): Promise<Membro[]> {
    const { data, error } = await this.sb.from('membros_empresa')
      .select('id, nome, email, setor_id, status, convidado_em, ativado_em, desativado_em, setores(nome)').eq('empresa_id', empresaId).order('nome');
    if (error) throw traduzir(error);
    return (data ?? []).map(r => ({
      id: r.id, nome: r.nome, email: r.email, setorId: r.setor_id, setor: (r.setores as unknown as { nome: string } | null)?.nome ?? null,
      status: r.status, convidadoEm: r.convidado_em, ativadoEm: r.ativado_em, desativadoEm: r.desativado_em,
    }));
  }
  async convidar(empresaId: string, nome: string, email: string, setorId: string | null) {
    const { data, error } = await this.sb.rpc('convidar_membro', { p_empresa: empresaId, p_nome: nome, p_email: email, p_setor: setorId });
    if (error) throw traduzir(error);
    const j = data as { membro_id: string; token: string };
    return { membroId: j.membro_id, token: j.token };
  }
  async alterarMembro(id: string, m: { setorId?: string | null; status?: StatusMembro }) {
    const mud: Record<string, unknown> = {};
    if (m.setorId !== undefined) mud.setor_id = m.setorId;
    if (m.status !== undefined) { mud.status = m.status; if (m.status === 'inativo') mud.desativado_em = new Date().toISOString(); }
    const { error } = await this.sb.from('membros_empresa').update(mud).eq('id', id);
    if (error) throw traduzir(error);
  }

  // ---- acessos, contrato, auditoria ----
  async acessos(empresaId: string): Promise<Acesso[]> {
    const { data, error } = await this.sb.rpc('acessos_da_empresa', { p_empresa: empresaId });
    if (error) throw traduzir(error);
    return (data ?? []).map((r: Record<string, unknown>) => ({ usuarioId: r.usuario_id as string, email: r.email as string, papel: r.papel as Papel, ativo: !!r.ativo, criadoEm: r.criado_em as string }));
  }
  async concederAcesso(empresaId: string, email: string, papel: Papel) {
    const { error } = await this.sb.rpc('conceder_acesso_portal', { p_empresa: empresaId, p_email: email, p_papel: papel });
    if (error) throw new Error(error.message);
  }
  async alterarAcesso(empresaId: string, usuarioId: string, m: { papel?: Papel; ativo?: boolean }) {
    const { error } = await this.sb.from('usuarios_portal').update(m).eq('usuario_id', usuarioId).eq('empresa_id', empresaId);
    if (error) throw traduzir(error);
  }
  async usoLicencas(empresaId: string): Promise<UsoLicencas> {
    const { data, error } = await this.sb.rpc('uso_licencas', { p_empresa: empresaId });
    if (error) throw traduzir(error);
    const j = data as Record<string, unknown>;
    return { licencas: (j.licencas as number | null) ?? null, convidados: Number(j.convidados ?? 0), ativos: Number(j.ativos ?? 0),
      vigenciaInicio: (j.vigencia_inicio as string | null) ?? null, vigenciaFim: (j.vigencia_fim as string | null) ?? null, camada2: !!j.camada_2, camada3: !!j.camada_3 };
  }
  async contratos(empresaId: string): Promise<Contrato[]> {
    const { data, error } = await this.sb.from('contratos').select('id, licencas, vigencia_inicio, vigencia_fim, camada_2, camada_3, ativo').eq('empresa_id', empresaId).order('vigencia_inicio', { ascending: false });
    if (error) throw traduzir(error);
    return (data ?? []).map(r => ({ id: r.id, licencas: r.licencas, vigenciaInicio: r.vigencia_inicio, vigenciaFim: r.vigencia_fim, camada2: r.camada_2, camada3: r.camada_3, ativo: r.ativo }));
  }
  async auditoria(empresaId: string, limite = 200): Promise<Auditoria[]> {
    const { data, error } = await this.sb.rpc('auditoria_da_empresa', { p_empresa: empresaId, p_limite: limite });
    if (error) throw traduzir(error);
    return (data ?? []).map((r: Record<string, unknown>) => ({ id: r.id as number, em: r.em as string, email: (r.email as string | null) ?? null, tabela: r.tabela as string, operacao: r.operacao as string, registroId: (r.registro_id as string | null) ?? null, antes: (r.antes as Record<string, unknown> | null) ?? null, depois: (r.depois as Record<string, unknown> | null) ?? null }));
  }

  // ---- operação ----
  async empresas(): Promise<Empresa[]> {
    const { data, error } = await this.sb.from('empresas').select('id, nome, cnpj, ativa').order('nome');
    if (error) throw traduzir(error); return data as Empresa[];
  }
  async criarEmpresa(nome: string, cnpj: string | null): Promise<Empresa> {
    const { data, error } = await this.sb.from('empresas').insert({ nome: nome.trim(), cnpj: cnpj?.trim() || null }).select('id, nome, cnpj, ativa').single();
    if (error) throw traduzir(error); return data as Empresa;
  }
  async alterarEmpresa(id: string, m: { nome?: string; ativa?: boolean }) { const { error } = await this.sb.from('empresas').update(m).eq('id', id); if (error) throw traduzir(error); }
  async criarContrato(empresaId: string, c: Omit<Contrato, 'id' | 'ativo'>) {
    const { error } = await this.sb.from('contratos').insert({ empresa_id: empresaId, licencas: c.licencas, vigencia_inicio: c.vigenciaInicio, vigencia_fim: c.vigenciaFim, camada_2: c.camada2, camada_3: c.camada3 });
    if (error) throw traduzir(error);
  }
  async encerrarContrato(id: string) { const { error } = await this.sb.from('contratos').update({ ativo: false }).eq('id', id); if (error) throw traduzir(error); }
  async calcularAgregados(periodo: string): Promise<ResultadoAgregacao> {
    const { data, error } = await this.sb.rpc('calcular_agregados_nr1', { p_periodo: periodo });
    if (error) throw traduzir(error);
    const j = data as Record<string, unknown>;
    return { periodo: j.periodo as string, k: Number(j.k), linhas: Number(j.linhas), recortesSuprimidos: Number(j.recortes_suprimidos) };
  }
}
