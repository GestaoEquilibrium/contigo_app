export function dataBr(iso: string | null | undefined, comHora = false): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  return comHora ? d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                 : d.toLocaleDateString('pt-BR');
}
export function mesBr(periodo: string): string {
  const d = new Date(periodo + 'T12:00:00');
  const s = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function primeiroDiaDoMes(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
export function mesAnterior(): string {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return primeiroDiaDoMes(d);
}
export function emailValido(s: string): boolean { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.trim()); }
export function formatarValor(indicador: string, origem: string, v: number): string {
  if (indicador === 'adesao') return `${v.toFixed(0)}%`;
  if (origem === 'checkin') return v.toFixed(1);
  return v.toFixed(0);
}
export function csv(linhas: (string | number | null)[][]): string {
  return linhas.map(l => l.map(c => { const s = c == null ? '' : String(c); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(';')).join('\r\n');
}
export function baixar(nome: string, conteudo: string, tipo = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + conteudo], { type: tipo });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export async function copiar(texto: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(texto); return true; } catch { return false; }
}
