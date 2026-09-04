# Cartel Club

Rede social para entusiastas de carros preparados — perfis de **Piloto** e **Oficina**, ficha
técnica completa do carro, feed de fotos estilo Instagram, descoberta por swipe estilo Tinder
(com match automático) e garagem com fichas técnicas detalhadas.

Full stack real: banco Postgres, API própria com autenticação e autorização, upload de imagem
com validação de verdade — nada aqui é mock.

## Stack

- **web/** — React + TypeScript + Vite + Tailwind v4 + `vite-plugin-pwa` (PWA instalável e
  com cache offline). Tema preto/branco/vermelho, Plus Jakarta Sans.
- **server/** — Node + Express + TypeScript + PostgreSQL (via `pg`). Autenticação por
  cookie httpOnly assinado (JWT), senhas com bcrypt, validação com Zod, upload com
  verificação de assinatura binária do arquivo (não confia em extensão nem Content-Type).

## Rodando localmente

### 1. Banco de dados

Precisa de um Postgres rodando (local ou gerenciado). Para criar um banco de desenvolvimento
local:

```bash
sudo service postgresql start   # ou o equivalente no seu sistema
sudo -u postgres psql <<'SQL'
CREATE USER cartelclub WITH PASSWORD 'cartelclub_dev_pw';
CREATE DATABASE cartelclub OWNER cartelclub;
SQL
```

### 2. Backend

```bash
cd server
cp .env.example .env   # ajuste DATABASE_URL e gere um JWT_SECRET novo:
#   sed -i "s/troque-este-segredo-antes-de-ir-para-producao/$(openssl rand -hex 32)/" .env
npm install
npm run migrate   # aplica server/src/db/schema.sql
npm run dev       # http://localhost:8787
```

### 3. Frontend

```bash
cd web
npm install
npm run dev       # http://localhost:5173 — proxya /api e /uploads para o backend
```

Abra `http://localhost:5173`, crie uma conta e siga o onboarding.

## Segurança — o que já está implementado

- **Autorização em toda escrita**: o dono de um recurso é sempre derivado da sessão
  (`req.userId`), nunca de um campo enviado pelo cliente. Editar/apagar carro, post ou
  comentário de outra pessoa retorna 404 (a query já filtra por dono na cláusula `WHERE`).
- **Upload validado por assinatura binária** (magic bytes), não por extensão do nome nem
  pelo `Content-Type` declarado — um arquivo `.png` que não é PNG de verdade é rejeitado.
  Cada usuário só escreve dentro da própria pasta (`uploads/{userId}/...`).
- **Rate limit** dedicado e mais apertado em `/auth/login` e `/auth/register` (força bruta),
  mais um limite geral na API.
- **Senhas** com bcrypt (custo 12), nunca armazenadas nem logadas em texto puro.
- **Mensagens de erro genéricas** em login/registro — não dá pra descobrir se um e-mail já
  existe por tentativa e erro.
- **Constraints no banco** (CHECK, UNIQUE, FK com `ON DELETE CASCADE`) como segunda linha de
  defesa, além da validação da API com Zod.
- **Texto livre nunca vira HTML**: legendas e comentários são renderizados como texto puro
  pelo React (que já escapa por padrão) — sem `dangerouslySetInnerHTML` em nenhum lugar.
- **Trilha de auditoria** (`audit_log`) já modelada no schema para ações de moderação
  (homologar certificado de dyno, verificar perfil etc.) — falta ligar a rota de admin.

## O que falta para produção

- Trocar o Postgres local por um gerenciado (Neon, Railway, RDS) — só muda `DATABASE_URL`.
- Trocar o storage local em disco por um bucket de verdade (S3, R2, Supabase Storage) —
  só muda `server/src/routes/upload.ts`.
- HTTPS + `secure: true` nos cookies (`server/src/lib/auth.ts` já liga isso sozinho quando
  `NODE_ENV=production`).
- Rota de admin para homologar certificados de dyno (hoje só o schema existe).
- Testes automatizados (o fluxo foi validado manualmente ponta a ponta nesta sessão, mas
  não há suíte de testes ainda).
