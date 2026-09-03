# Garagem+

PWA de rede social para entusiastas de carros preparados: perfis de **Piloto** e **Oficina**, ficha técnica do carro (tração, aspiração, suspensão, rodas, pneus, HP/WHP), feed de fotos estilo Instagram e uma tela de descoberta estilo Tinder (arraste para seguir/pular projetos).

## Stack

- React + TypeScript + Vite
- React Router
- Tailwind CSS v4
- `vite-plugin-pwa` (manifest + service worker, instalável e com cache offline)
- Supabase (opcional) para auth, banco de dados e storage de fotos

## Rodando localmente

```bash
npm install
npm run dev
```

O app funciona **sem nenhuma configuração extra**, usando dados de exemplo em `src/data/mock.ts` (perfis, carros e posts fictícios).

## Estrutura

- `src/types/domain.ts` — modelo de dados (Profile, Car, CarSpec, Post, Comment)
- `src/data/mock.ts` — dados de exemplo usados enquanto não há backend
- `src/pages/` — Feed, Descobrir (swipe), Perfil, Detalhe do Carro, Publicar
- `src/components/` — BottomNav, TopBar, PostCard, SpecSheet
- `src/lib/supabase.ts` — cliente Supabase, ativado automaticamente quando as env vars estiverem configuradas

## Conectando um backend real (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Crie as tabelas `profiles`, `cars`, `posts`, `likes`, `comments` e `follows` seguindo os tipos de `src/types/domain.ts` (com RLS habilitado, cada usuário só edita seus próprios dados).
4. Crie um bucket no Storage para as fotos dos posts.
5. Troque os imports de `src/data/mock.ts` pelas queries ao Supabase (`src/lib/supabase.ts`) nas páginas — comece por `Feed.tsx` e `Upload.tsx`.

Enquanto essas variáveis não existirem, o app continua funcionando normalmente com os dados mock.

## Build de produção

```bash
npm run build
npm run preview
```

O build gera o service worker e o manifest da PWA (`dist/sw.js`, `dist/manifest.webmanifest`), prontos para deploy em qualquer host estático (Vercel, Netlify, Cloudflare Pages, S3+CloudFront etc.). Depois do deploy em HTTPS, o navegador oferece "Instalar app" tanto no Android quanto no desktop; no iOS, a instalação é via Safari → Compartilhar → "Adicionar à Tela de Início".

## Próximos passos sugeridos

- Autenticação (email/senha ou magic link via Supabase Auth)
- Upload real de fotos (Supabase Storage) com compressão no cliente
- Curtidas/comentários persistidos e contadores em tempo real (Supabase Realtime)
- Notificações push (Web Push) para curtidas, comentários e novos seguidores
- Busca/filtro por marca, tipo de tração, faixa de potência
