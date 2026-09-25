# Contigo · Gestão (portal da empresa)

Grupo Equilibrium Med Center · Uberlândia/MG

Portal web para a empresa cliente (admin, RH, gestor, SESMT) e para a operação do
Contigo. Mesmo banco do app, mesma chave `anon`: o que cada papel vê é decidido
pela RLS no Postgres, não pela tela. **Nenhum dado individual chega aqui** — o
banco não entrega.

## Telas

| Tela | Quem vê | O quê |
|---|---|---|
| Painel NR-1 | todos os papéis | agregados por mês, empresa inteira e por setor; recorte < 12 aparece como suprimido; exportar CSV para o PGR |
| Funcionários | admin, RH | cadastro (nome, e-mail, setor, situação), convidar 1 ou vários, link de ativação, reativar, desativar |
| Setores | admin, RH | criar, renomear, apagar; mostra quantos faltam para o setor aparecer no painel |
| Acessos | admin | quem entra no portal e com que papel; liberar acesso por e-mail |
| Contrato | todos | licenças em uso, vigência, camadas, cláusula de vedação |
| Auditoria | admin | quem fez o quê no cadastro (sem o token dos convites) |
| Empresas e contratos | operação do Contigo | criar empresa, contrato, liberar o primeiro acesso, recalcular agregados |

## Rodar

```bash
npm install
cp .env.example .env     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e VITE_APP_URL (endereço do app, para os links de ativação)
npm run dev              # http://localhost:5174
```
Sem `.env`, sobe em demonstração com dados inventados.

## Publicar (Cloudflare Workers, grátis)

Workers & Pages → Create → conectar o GitHub → repositório do portal. Build
`npm run build`, saída `dist`. Em *Settings → Build → Build variables and
secrets*: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`.
O `wrangler.jsonc` (nome `contigo-gestao`) já cuida das rotas.

Banco: precisa da migração `0006_portal.sql` (funções `acessos_da_empresa`,
`conceder_acesso_portal`, `auditoria_da_empresa`, `uso_licencas`).

## Entrar

- **Senha**: para equipe e RH com senha definida.
- **Código por e-mail**: só depois do SMTP próprio no Supabase.
- **Criar conta**: a pessoa cria; o admin da empresa (ou a operação) libera em *Acessos*.
