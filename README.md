# Contigo · aplicativo (PWA)

Grupo Equilibrium Med Center · Uberlândia/MG

Site instalável na tela inicial — não é app de loja. React + Vite + TypeScript,
ligado ao banco oficial do Contigo (Supabase) só pela chave `anon`; quem protege
o dado é a RLS. Sem as chaves, roda em **modo demonstração** (dados só no aparelho).

## Rodar no seu computador

```bash
npm install
cp .env.example .env        # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev                 # abre em http://localhost:5173
```

Sem `.env`, o app sobe em modo demonstração: qualquer e-mail entra, o código é
qualquer coisa, e nada sai do navegador. Serve para sentir o produto.

## O que o Supabase precisa ter (além do banco instalado)

1. **Authentication → URL Configuration**
   - *Site URL*: o endereço onde o app vai morar (ex.: `https://contigo.equilibrium.com.br`)
   - *Redirect URLs*: adicionar `http://localhost:5173/**` (para testar) e
     `https://SEU-ENDERECO/**` (produção). Sem isso o link do e-mail volta
     para o lugar errado.
2. **Integrations → Data API → Exposed schemas**: `clinico` (já feito).
3. **Migração 0005** aplicada (coluna `avisar_conversa`) — está no `instalar.sql`
   novo; quem já instalou roda só o `0005_ajustes_app.sql`.

## Como a pessoa entra (o fluxo real)

1. O RH cria o convite pelo portal (`convidar_membro`) e manda o link
   `https://SEU-ENDERECO/ativar/<token>` por e-mail, WhatsApp, o que for.
2. A pessoa abre o link → vê "Oi. Que bom que você veio" → digita o **e-mail que
   a empresa cadastrou** → recebe um código (ou um link, enquanto não houver SMTP
   próprio) → entra.
3. O app chama `aceitar_convite(token)`: o banco confere se o e-mail bate, se o
   token não venceu e não foi usado. Se bater, liga a conta ao vínculo.
4. Consentimento (versão registrada) → instalação guiada (iPhone/Android) → app.
5. Nas próximas vezes: abre o ícone, entra com o e-mail, pronto.

Quem entra sem convite vê "Falta o convite da sua empresa". Quem apagou os dados
vê "O seu acesso foi encerrado" e precisa de convite novo.

## Publicar (grátis, com HTTPS)

**Vercel** (recomendado): `npm i -g vercel` → `vercel` na pasta do projeto →
aceitar os padrões → em *Settings → Environment Variables* colocar as duas
`VITE_...` → `vercel --prod`. O `vercel.json` já cuida das rotas do app.
Depois, apontar `contigo.equilibrium.com.br` para lá (Settings → Domains).

**Netlify**: arrastar a pasta `dist` (depois de `npm run build`) no painel; o
`public/_redirects` já cuida das rotas. As variáveis vão em *Site settings →
Environment variables* (aí precisa buildar no Netlify, não arrastar).

Em qualquer um: depois de publicar, atualizar *Site URL* e *Redirect URLs* no
Supabase com o endereço final.

## Estrutura

```
src/
  App.tsx                 o portão: decide onde a pessoa pode estar
  estilo.css              tokens coral + componentes (escala enquadrada)
  lib/tipos.ts            o contrato Dados — o que as telas pedem ao banco
  lib/dados.supabase.ts   implementação real (tabelas, RPCs, schema clinico)
  lib/dados.demo.ts       implementação de demonstração (localStorage)
  lib/dados.ts            escolhe uma das duas pelo .env
  lib/sessao.tsx          sessão + conta (minha_conta) em contexto React
  lib/util.ts             momento do dia, textos fixos, temas, afinidade
  componentes/base.tsx    moldura, abas, opção, linha de ação, respiração, ouvir
  componentes/icones.tsx  ícones de linha, carinhas e barras
  telas/Chegada.tsx       boas-vindas · e-mail · código · ativar · consentir · instalar · sem acesso
  telas/Hoje.tsx          hoje · check-in (3 telas) · pronto · prática guiada
  telas/Trilhas.tsx       trilhas · trilha · passo · passo feito · tema em breve
  telas/Conversar.tsx     vamos conversar · afinidade (7 telas) · pronto
  telas/Ajuda.tsx         188 · 192 · respirar
  telas/Eu.tsx            quem vê · nome · instalar · apagar · sair
```

## O que ainda não está aqui (de propósito)

- **Código por e-mail no lugar de link**: precisa de SMTP próprio no Supabase
  (Resend, Brevo…). Sem isso, o iPhone instalado na tela não consegue logar
  pelo link (ele abre no Safari, fora do app). O app já aceita os dois.
- **Lembrete diário (push)**: precisa de chave VAPID + uma função no servidor.
  A tela "Eu" não mostra o interruptor até isso existir — nada de botão de mentira.
- **Rastreio (escalas)**: o banco está pronto (cortina + alertas), mas não há
  instrumento cadastrado. Entra quando a RT fechar a lista SATEPSI.
- **Vamos conversar**: fechado até o protocolo clínico-jurídico.
