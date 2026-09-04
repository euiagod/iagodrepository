# CARTEL CLUB — Prompt para gerar o PWA no Lovable

> **Como usar:** o Lovable trabalha muito melhor em etapas do que com um prompt gigante único.
> Cole a **Fase 1** primeiro e deixe gerar. Depois vá colando as fases seguintes, uma por vez,
> conferindo o resultado entre elas. As seções "Design System" e "Modelo de dados" são a base —
> se o Lovable se perder em alguma fase, recole a seção relevante junto com o pedido.

> **Sobre o backend e segurança:** o prompt usa Supabase (Postgres) — não porque seja a opção
> mais frágil e sim porque é a que o Lovable integra nativamente como **Lovable Cloud**, sem
> você precisar copiar URL/chave de projeto na mão (é aí que a maioria dos apps feitos com IA
> fica insegura: não é o banco que falha, é alguém esquecer de restringir quem pode ler/editar
> cada linha). Quando o Lovable perguntar qual backend usar, **escolha Lovable Cloud** — mesmo
> Postgres por baixo, mas gerenciado dentro do próprio editor, com menos chance de erro de
> configuração. A Fase 2 abaixo tem uma seção de SEGURANÇA dedicada, com checklist de teste;
> não pule ela mesmo se estiver ansioso para ver a interface pronta.

---

## FASE 1 — Fundação, design system e navegação

```
Crie um PWA mobile-first chamado CARTEL CLUB: uma rede social brasileira para entusiastas de
carros preparados. É uma mistura de Instagram com Tinder para o mundo automotivo — cada pessoa
monta seu perfil, cadastra os carros da garagem com ficha técnica completa e compartilha fotos
dos projetos em estilo editorial.

REGRA INEGOCIÁVEL — O APP TEM QUE SER 100% FUNCIONAL
Isto não é um protótipo nem uma maquete clicável. Todo botão, campo, filtro, aba e gesto
precisa executar a ação de verdade e refletir o resultado na tela e no banco de dados.
- Se um controle aparece na tela, ele funciona. Se ainda não dá pra fazer funcionar, não coloque.
- Proibido: botão decorativo, link que não leva a lugar nenhum, aba que não troca de conteúdo,
  alert() no lugar da funcionalidade, "em breve", "coming soon", TODO, ou tela de placeholder.
- A partir da Fase 2 nada de dado chumbado no código: tudo lê e escreve no Supabase.
- Toda ação persiste. Se eu curtir um post, fechar o app e abrir de novo, a curtida está lá.
- Todo formulário valida de verdade e mostra a mensagem de erro no campo certo.
- Toda tela tem os três estados implementados: carregando, vazio e erro.
- Antes de encerrar cada fase, percorra você mesmo o fluxo completo no preview, encontre o que
  está quebrado e conserte. Só entregue a fase depois que ela funcionar de ponta a ponta.

STACK E REQUISITOS TÉCNICOS
- React + TypeScript + Vite + Tailwind + shadcn/ui.
- Supabase para autenticação, banco de dados (Postgres com RLS) e storage de imagens.
- PWA instalável de verdade: manifest.webmanifest completo (name "CARTEL CLUB", short_name
  "Cartel Club", display "standalone", display_override ["standalone","minimal-ui"],
  orientation "portrait", lang "pt-BR", background_color "#050505", theme_color "#050505",
  ícones 192/512 + um maskable 512), service worker com cache do app shell para funcionar
  offline, meta tags do iOS (apple-mobile-web-app-capable, apple-touch-icon,
  apple-mobile-web-app-status-bar-style "black-translucent").
- Respeitar safe areas do iPhone: usar env(safe-area-inset-bottom) e
  env(safe-area-inset-top) nas barras fixas, e viewport com viewport-fit=cover.
- Toda a interface em português do Brasil.
- Layout travado em coluna única, largura máxima de 440px centralizada no desktop,
  com o fundo preto sangrando nas laterais (simula um aparelho). Zero scroll horizontal.

DESIGN SYSTEM — "Velocità Obsidian"
Estética dark-mode-first, premium, inspirada em editorial automotivo e instrumentação de
cockpit. Minimalismo + glassmorphism atmosférico: pretos profundos, camadas acrílicas
translúcidas, bordas hairline de 1px e formas em pílula. Sem cores decorativas — a energia
cromática vem exclusivamente das fotos dos carros.

Cores (defina como CSS variables e tokens do Tailwind):
- void / fundo base: #050505
- superfície base (cards, trilhos): #0A0A0A
- superfície elevada (grupos aninhados): #121212
- vidro translúcido: rgba(255,255,255,0.04)
- vidro elevado (hover/ativo): rgba(255,255,255,0.08)
- borda hairline: rgba(255,255,255,0.08)
- borda ativa/foco: rgba(255,255,255,0.22)
- texto primário: #FFFFFF
- texto secundário: #8E8E93
- texto terciário / desabilitado: #48484A
- vermelho de marca (o ÚNICO acento do app): #FF1F17
- vermelho profundo (estados pressionados e preenchimentos maiores): #C1110A

A paleta é PRETO, BRANCO E VERMELHO. Não existe nenhuma outra cor na interface — sem azul,
sem verde, sem laranja, sem gradiente colorido, sem cor de "sucesso" ou "erro" fora dessa
paleta. A única cor que aparece além de preto, branco e vermelho é a das fotos dos carros.

Onde o vermelho pode aparecer (e só aí, sempre em dose pequena):
- selo de verificado, selo "DYNO CERTIFIED" e badges de destaque ("FEATURED SPEC");
- item ativo da navegação e indicador de notificação não lida;
- coração de curtida quando ativo;
- números de destaque quando forem o assunto do bloco (ex.: o ganho "+46 WHP vs OEM");
- ações destrutivas e o selo "PULAR" do swipe;
- detalhes finos: uma régua de 2px, o ponto de status, a borda de um card em foco.

Onde o vermelho NÃO pode aparecer: fundo de tela inteira, blocos grandes preenchidos, texto
corrido, fundo de card. Confirmação e sucesso são feitos em BRANCO (preenchimento branco sólido
com texto preto), não em vermelho e nunca em verde.

Tipografia: Plus Jakarta Sans em todo o app (Google Fonts).
- display-hero: 56px/60 peso 800, tracking -0.035em (mobile: 38px/42, -0.03em)
- headline-xl: 40px/48 peso 700, -0.03em (mobile: 28px/34, -0.025em)
- headline-lg: 24px/30 peso 700, -0.02em
- headline-md: 20px/26 peso 600, -0.015em
- headline-sm: 17px/22 peso 600, -0.01em
- body-lg: 17px/24 | body-md: 15px/21 | body-sm: 13px/18 (peso 400)
- label-caps: 11px/14 peso 700, UPPERCASE, tracking 0.08em
- label-ui: 14px/18 peso 600
Números técnicos (potência, torque, tempos de volta, pressão) sempre com
font-feature-settings: 'tnum' para alinhamento tabular.

Formas:
- Pílula (border-radius 9999px) para botões, chips, filtros, campo de busca e a dock inferior.
- Cards grandes: 24px a 32px de raio, com corner smoothing.
- Superfícies internas aninhadas: 16px a 20px.
- Toda forma mantém uma borda interna de 1px para não sangrar no preto do fundo.

Profundidade (sem drop shadow difuso — o fundo é preto demais):
- Nível 1 (cards): #0A0A0A + borda 1px rgba(255,255,255,0.06).
- Nível 2 (vidro flutuante): rgba(20,20,20,0.65) + backdrop-filter: blur(28px) saturate(180%),
  com hairline em gradiente no topo.
- Nível 3 (modais e dock): rgba(28,28,30,0.78) + blur(40px) +
  box-shadow: 0 20px 48px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.12).

Componentes base:
- Botão primário: pílula branca sólida #FFFFFF com texto preto, label-ui. Ao tocar:
  opacidade 0.88 e scale(0.98).
- Botão secundário: pílula de vidro rgba(255,255,255,0.08), borda rgba(255,255,255,0.12),
  texto branco.
- Botões de ícone: circulares, 44px no mobile, em vidro, com ícone de traço 1.5px a 20px.
- Chips/filtros: altura 32px, px-16, fundo rgba(255,255,255,0.05), borda
  rgba(255,255,255,0.08), texto #8E8E93. Estado ativo: fundo branco sólido, texto preto e
  halo sutil 0 0 16px rgba(255,255,255,0.18).
- Campo de busca: pílula de 48px, fundo rgba(255,255,255,0.06), borda 1px
  rgba(255,255,255,0.1), placeholder #8E8E93; no foco a borda vai para rgba(255,255,255,0.4).
- Listas: sem fundo, separadas por divisores hairline rgba(255,255,255,0.06) com inset de 16px.
- Use ícones estilo Material Symbols Outlined (traço fino) em todo o app.

NAVEGAÇÃO
Dock inferior flutuante em pílula, centralizada, com bottom-6, padding 8px, vidro
rgba(15,15,15,0.75), blur 32px e borda rgba(255,255,255,0.12). Quatro destinos, com o
item ativo em destaque (círculo branco sólido com ícone preto):
1. Feed (/)
2. Descobrir (/descobrir)
3. Garagem / meu perfil (/garagem)
4. Notificações (/notificacoes)
Além disso, um botão flutuante de "publicar" acessível a partir do Feed.

Nesta primeira fase, crie a estrutura de rotas, o design system completo, a dock de navegação,
o setup do PWA e telas com dados fictícios (mock) coerentes com o universo automotivo
brasileiro — Interlagos, Curitiba, Golf GTI, Civic, Porsche 911 GT3, Subaru, marcas como
FuelTech, Brembo, Öhlins, Enkei, Advan. Ainda não conecte o Supabase.

PRONTO QUANDO (confira antes de seguir para a próxima fase):
- As quatro abas da dock navegam de verdade e cada rota renderiza sua própria tela.
- O app instala no celular (aparece "Adicionar à tela de início") e abre em tela cheia,
  sem a barra do navegador.
- Depois do primeiro acesso, o app abre offline.
- Nenhum botão da interface é decorativo.
```

---

## FASE 2 — Supabase: modelo de dados, autenticação e onboarding

```
Agora conecte o backend (Lovable Cloud / Supabase) e implemente autenticação, o modelo de
dados completo e as regras de segurança abaixo. Trate a seção SEGURANÇA como parte obrigatória
da entrega desta fase, não como um extra — um app social com fotos e perfis públicos é alvo
óbvio de gente tentando ler dado de outro usuário ou abusar de curtidas/swipes.

AUTENTICAÇÃO
- Cadastro e login por e-mail/senha e também por magic link.
- Após o primeiro login, um onboarding obrigatório em etapas:
  1. Escolher o TIPO DE PERFIL: "Piloto" (entusiasta dono de carro) ou "Oficina"
     (preparadora/prestador de serviço). Essa escolha muda o perfil e é destacada visualmente.
  2. Definir @username único, nome de exibição, cidade e estado.
  3. Piloto: cadastrar o primeiro carro da garagem (pode pular).
     Oficina: informar especialidades (ex.: Turbo, Suspensão, Dyno, Remap/ECU, Solda,
     Preparação de motor, Freios, Aerodinâmica) e endereço.
- Rotas protegidas: quem não está logado só vê login/cadastro.

TABELAS (Postgres, todas com RLS habilitado)

profiles
  id uuid PK (referencia auth.users), username text unique, display_name text,
  type text check in ('piloto','oficina'), avatar_url text, bio text, city text, state text,
  member_number serial, is_verified bool default false, is_pro bool default false,
  specialties text[] (só oficina), address text (só oficina), created_at timestamptz

cars
  id uuid PK, owner_id uuid -> profiles, nickname text (ex.: "VW Golf GTI Stage 3"),
  brand text, model text, year int,
  drivetrain text check in ('dianteira','traseira','4x4'),
  aspiration text check in ('aspirado','turbo','supercharger','turbo+supercharger','eletrico'),
  engine text (ex.: "2.0 TSI Gen3"), displacement text (ex.: "2.0L 16V"),
  gearbox text (ex.: "7-speed DSG"),
  suspension text check in ('original','coilover','a ar','rebaixamento fixo','competicao'),
  suspension_detail text (ex.: "Öhlins TTX"),
  wheels text (ex.: 'Enkei RPF1 17"'), tires text (ex.: "Advan A050 235/40 R18"),
  brakes text (ex.: "Brembo 6-pot 380mm"),
  hp int (potência declarada), whp int (potência aferida na roda),
  torque_kgfm numeric, boost_bar numeric, fuel text (ex.: "E100", "Gasolina", "Etanol"),
  ecu text (ex.: "FuelTech FT550"),
  stage text (ex.: "Stage 3"),
  build_status text check in ('original','em construcao','pronto para pista','show car'),
  is_primary bool (o carro principal da garagem), cover_url text, created_at timestamptz

car_mods  (as "tags" de preparação que aparecem como chips)
  id uuid PK, car_id uuid -> cars, category text (motor, suspensao, freios, rodas,
  aerodinamica, seguranca, eletronica), label text (ex.: "TURBO IS38")

posts
  id uuid PK, author_id uuid -> profiles, car_id uuid -> cars (opcional),
  caption text, location text, created_at timestamptz

post_media
  id uuid PK, post_id uuid -> posts, url text, position int

likes        (post_id, user_id) chave primária composta, created_at
comments     id uuid PK, post_id, author_id, body text, parent_id (para respostas), created_at
follows      (follower_id, following_id) chave primária composta, created_at

swipes       id uuid PK, user_id, car_id, direction text check in ('like','pass','boost'),
             created_at — unique(user_id, car_id)
matches      id uuid PK, user_a uuid, user_b uuid, created_at — criado automaticamente
             (via trigger) quando dois usuários dão like um no carro do outro

dyno_certificates
  id uuid PK, car_id uuid -> cars, whp numeric, torque_kgfm numeric, boost_bar numeric,
  rpm int, fuel text, dyno_shop text (ex.: "Servitec 4x4"), dyno_type text (ex.: "Rolo"),
  gain_vs_oem int, certified_at date, auth_hash text unique (ex.: "#DYNO-SP-99214-GTI"),
  document_url text, status text check in ('pendente','homologado','recusado')

circuits     id uuid PK, name text, city text, state text, is_official bool
lap_times    id uuid PK, user_id, car_id, circuit_id, time_ms int, sector1_ms int,
             top_speed_kmh int, is_verified bool (via transponder/GPS oficial), recorded_at date

notifications id uuid PK, user_id (destinatário), actor_id, type text
             (like, comment, follow, match, dyno_homologado, lap_record), entity_id, read bool,
             created_at

REGRAS DE RLS
- Todo mundo autenticado pode LER profiles, cars, posts, post_media, comments, likes, follows,
  circuits, lap_times e dyno_certificates com status 'homologado'.
- Cada usuário só pode INSERIR/EDITAR/APAGAR os próprios registros (profiles.id = auth.uid(),
  cars.owner_id = auth.uid(), posts.author_id = auth.uid(), etc.).
- swipes e notifications: cada usuário só enxerga as próprias linhas.
- matches: visível apenas para user_a e user_b.
- dyno_certificates: o dono do carro cria como 'pendente'; só um admin muda para 'homologado'.

STORAGE
- Bucket "media" (leitura pública, escrita restrita — só o dono do post/carro grava, e o
  caminho do arquivo inclui o user_id, ex.: media/{user_id}/{post_id}/{arquivo}, com uma
  política que só permite gravar dentro da própria pasta) para fotos de posts e capas de
  carro; bucket "avatars" no mesmo esquema para fotos de perfil.
- Comprimir a imagem no cliente antes do upload (máx. 1600px no maior lado, ~85% de qualidade),
  rejeitar no cliente E no servidor qualquer arquivo que não seja imagem (valide o
  content-type real, não a extensão do nome) e limitar o tamanho (ex.: 8MB por foto).

SEGURANÇA — trate cada item abaixo como obrigatório, não como sugestão
- Nunca confie em nenhum ID vindo do cliente. Toda escrita usa auth.uid() do lado do servidor
  para decidir o dono da linha — o formulário nunca envia "sou o usuário X", o backend é quem
  sabe disso pela sessão autenticada.
- RLS "deny by default": crie a política de leitura/escrita explícita para cada tabela; se uma
  tabela não tem política nenhuma, ninguém lê nem escreve nela — nunca desligue o RLS "pra
  testar mais rápido" e esquecer de religar.
- Teste a RLS de verdade: crie duas contas de teste (A e B) e confirme que a conta B recebe erro
  de permissão ao tentar editar/apagar um post, carro, comentário ou curtida que pertence à
  conta A — inclusive tentando direto pela API, não só escondendo o botão na interface.
- Nunca exponha a service role key / chave de administrador no código do cliente — ela só pode
  existir em uma função de servidor (edge function), nunca em uma variável acessível pelo
  navegador. Homologar um certificado de dyno (mudar status para 'homologado') só pode
  acontecer por uma rota de admin que valida a permissão no servidor, nunca por uma escrita
  direta que o cliente possa disparar.
- Sanitize tudo que é texto livre (legenda, comentário, bio, nome do carro): renderize sempre
  como texto puro, nunca injete em innerHTML/dangerouslySetInnerHTML — isso fecha a porta pra
  XSS sem precisar de biblioteca extra. Limite o tamanho de cada campo de texto no banco.
- Rate limit nas ações que podem ser abusadas em massa: swipes, curtidas, comentários e envio
  de mensagem. Se o Lovable Cloud tiver esse recurso pronto, use-o; senão, pelo menos garanta
  no banco que não dá pra duplicar a mesma ação (ex.: unique(user_id, car_id) em swipes já
  cobre isso) e limite a frequência no lado do servidor, não só desabilitando o botão na tela.
- Toda ação de moderação (homologar dyno, verificar perfil, remover post denunciado) grava
  quem fez, quando e o motivo em uma tabela de auditoria — nunca é uma edição silenciosa.
- Senhas seguem as regras padrão do provedor de auth (mínimo de caracteres, sem lista de senhas
  óbvias); nunca implemente hash de senha por conta própria.
- Nenhuma chave, senha ou segredo é commitada no código-fonte — tudo vem de variável de
  ambiente/segredo do projeto.

Contadores (seguidores, curtidas, comentários) devem vir de views ou colunas mantidas por
trigger — nunca contar no cliente carregando todas as linhas.

PRONTO QUANDO:
- Consigo criar conta, sair, entrar de novo e continuo logado ao recarregar a página.
- O onboarding grava o perfil no banco e não aparece de novo nos próximos logins.
- Testei com duas contas (A e B): a conta B não consegue ler dado privado, nem editar ou
  apagar nenhum registro que pertence à conta A — nem pela interface, nem chamando a API
  direto.
- Toda tabela tem política de RLS explícita; nenhuma ficou sem política "porque ainda não deu
  tempo".
- A service role key não aparece em nenhum arquivo que vai para o navegador.
- O upload da foto de perfil funciona, rejeita arquivo que não é imagem, e a imagem aparece na
  tela depois de salva.
```

---

## FASE 3 — Feed social (o "Instagram")

```
Implemente a tela de Feed (rota /), que é o coração do app.

TOPO
- Barra fixa com o wordmark "CARTEL CLUB •" centralizado, ícone de menu à esquerda e ícone de
  mensagens à direita (com bolinha indicadora quando houver não lidas).
- Logo abaixo, uma régua horizontal rolável de "stories": o primeiro item é "NOVO POST" (círculo
  com +), seguido dos perfis que o usuário segue, cada avatar em círculo com anel e o @username
  embaixo em label pequeno.

CARD DE POST (o elemento mais importante do app — capriche)
- Cabeçalho: avatar, @username, selo de verificado, tipo do perfil ("• Piloto" ou "• Oficina"),
  localização com ícone de pin, tempo relativo ("Há 2h"), botão "Seguir"/"Seguindo" e menu "…".
- Foto do carro em destaque, proporção 4:5, ocupando a largura toda, com cantos arredondados.
- Sobre a foto, no topo à esquerda, badges em pílula de vidro: "DYNO CERTIFIED" (quando o carro
  tem certificado homologado) e o stage do carro (ex.: "STAGE 3").
- No canto inferior direito da foto, um badge escuro com o número principal em destaque:
  ex. "180 WHP" (número grande em branco, unidade menor em cinza).
- Barra de ações: curtir (coração), comentar, compartilhar e, à direita, salvar.
- Linha "Curtido por @track_daily e outras 1.420 pessoas" com avatares empilhados.
- FICHA TÉCNICA DO PROJETO: um bloco de vidro logo abaixo, com o título em label-caps e o
  número do build à direita (ex.: "Build #084"), contendo três métricas lado a lado —
  POTÊNCIA (ex.: 180 WHP), TORQUE (ex.: 28.4 KGFM), PRESSÃO (ex.: 1.6 BAR).
- Abaixo, os chips de preparação do carro (car_mods): ex. "TURBO IS38", "FWD Torsen",
  "Brembo 4-Piston", 'Enkei RPF1 17"', "FuelTech FT550".
- Legenda com @username em negrito seguido do texto, e link "Ver todos os N comentários".

INTERAÇÕES
- Curtir com duplo toque na foto, com animação de coração; o botão reflete o estado.
- Curtir, comentar e seguir com atualização otimista (a UI responde na hora, sincroniza depois).
- Tela de comentários (/post/:id) com lista, respostas aninhadas em um nível e campo de envio
  fixo no rodapé.
- Scroll infinito com paginação e skeletons de carregamento no estilo do design system.
- Pull-to-refresh no topo.
- O feed mostra posts de quem o usuário segue; se ele ainda não segue ninguém, mostrar posts
  populares e um convite para ir em Descobrir.

PRONTO QUANDO:
- Curtir, descurtir, comentar e seguir gravam no banco e sobrevivem ao recarregar.
- O feed pagina de verdade conforme eu rolo, sem recarregar tudo.
- Criando um post com a conta A, ele aparece no feed da conta B que segue A.
- Os contadores de curtidas e comentários batem com o banco.
```

---

## FASE 4 — Descobrir (o "Tinder")

```
Implemente a tela Descobrir (/descobrir): uma pilha de cards de carros para dar match.

TOPO
- Wordmark "CARTEL CLUB •" e, abaixo, a linha de contexto: "RADAR: 25KM • TRACK SETUPS".
- Linha de filtros em chips: um filtro de preparação (ex.: "TRACK / STAGE 2+"), um de
  localização com ícone de pin (ex.: "CURITIBA") e, à direita, o contador da sessão ("01 / 15").
- Os filtros devem abrir um painel com: raio em km, tipo de tração, faixa de potência (WHP),
  aspiração, stage e tipo de perfil (piloto/oficina).

CARD DE DESCOBERTA
- Card grande em vidro ocupando quase toda a tela, com as bordas dos próximos cards da pilha
  aparecendo sutilmente atrás.
- Foto do carro 4:5 no topo, com um gradiente escuro na base protegendo o texto.
- Badge "FEATURED SPEC" com ícone de raio no canto superior direito quando for destaque.
- Sobre a foto, na parte de baixo: código do projeto em label-caps (ex.:
  "PROJECT #992-GT3RS") seguido do status em vermelho ("• ACTIVE TRACK SETUP"); o nome do carro
  em display grande (ex.: "PORSCHE 911 GT3") com selo de verificado; a linha de subtítulo
  (ex.: "CLUBSPORT // STAGE 3"); e a linha do dono: @username • local • distância ("12km").
- Grade 2x2 de telemetria em blocos de vidro, cada um com o rótulo em label-caps à esquerda e
  o valor em negrito à direita: POWER (520 WHP), ENGINE (4.0L FLAT-6 NA), GEARBOX (7-SPEED PDK),
  TIRES (CUP 2 R 335).
- Rodapé do card: "FULL TELEMETRY & DYNO SHEET" com o link "Ver ficha completa ↗" que leva
  para /carro/:id.

AÇÕES
- Arrastar o card para a direita = curtir/seguir; para a esquerda = pular. O card acompanha o
  dedo com rotação proporcional, e aparece um selo "SEGUIR" (branco sólido com texto preto,
  à direita) ou "PULAR" (contorno vermelho, à esquerda) conforme a direção. Soltar antes do limiar volta o card ao lugar.
- Fileira de botões circulares embaixo: desfazer último swipe, pular (X), boost (raio, destaque
  do perfil — limitado por dia), curtir (coração, botão branco em destaque) e abrir filtros.
- Deve funcionar tanto com toque quanto com mouse (pointer events), e ter atalhos de teclado
  (setas) no desktop.
- Quando houver match recíproco, mostrar um toast fixo na parte de baixo:
  "NEW GARAGE MATCH: Golf GTI Mk7.5 Stage 2 — 2m ago", e gravar em matches + notifications.
- Registrar cada swipe para nunca repetir o mesmo carro para o mesmo usuário.
- Estado vazio elegante quando acabarem os cards, sugerindo aumentar o raio do radar.

PRONTO QUANDO:
- O swipe funciona com o dedo no celular e com o mouse no desktop.
- Um carro que já recebeu swipe nunca reaparece para o mesmo usuário.
- Match recíproco cria o registro em matches e gera a notificação para os dois lados.
- Mudar os filtros muda de verdade os carros que aparecem na pilha.
```

---

## FASE 5 — Perfil e Garagem

```
Implemente o perfil (/garagem para o próprio, /perfil/:username para os outros).

CABEÇALHO DO PERFIL
- Foto em destaque, @username, badge de nível ("PRO PILOT" ou "OFICINA"), tipo e localização
  ("Piloto & Enthusiast • São Paulo, SP"), e dois selos em pílula: "TELEMETRIA ATIVA" e
  "Membro #409".
- Botão "Editar Garagem" (perfil próprio) ou "Seguir"/"Seguindo" + "Mensagem" (outros perfis).
- Grade 2x2 de estatísticas em cards de vidro, número grande em cima e rótulo em label-caps
  embaixo: CARROS NA GARAGEM, TRACK DAYS, PISTAS HOMOLOGADAS, SEGUIDORES.

SELO DYNO CERTIFIED
- Bloco destacado com ícone de selo, título "Dyno Certified Official Stamp", badge vermelho
  "HOMOLOGADO" e a descrição da certificação ("Certificação de Potência em Rolo — Servitec 4x4
  • Calibrado em 14/Out/2024").
- Linha com "HASH DE AUTENTICIDADE" e o código (ex.: "#DYNO-SP-99214-GTI") com botão de
  download do laudo.
- Três métricas: RODA (WHP) com o ganho em vermelho embaixo ("+46 whp vs OEM"),
  TORQUE NA RODA (com o RPM: "@ 3.400 RPM") e PRESSÃO DE TURBO (com o combustível: "E100").

CIRCUITOS HOMOLOGADOS
- Seção com título e botão "+ Anexar". Carrossel horizontal de cards de pista, cada um com o
  estado ("SÃO PAULO • SP"), badge "OFICIAL", nome do autódromo, e a melhor volta:
  "MELHOR VOLTA (PB) 1:54.218", com "Setor 1: 41.2s" e "Top Speed 218 km/h" em vermelho.
- Explicação em texto pequeno: "Pistas com cronometragem oficial via GPS transponder anexadas
  ao piloto".

GARAGEM ATIVA
- Seção com o carro principal, com um carrossel (indicador "1 / 3") se houver mais de um.
- Card grande com a foto do carro, badge "SETUP DE PISTA" no topo e o selo redondo
  "SELO CARTEL DYNO CERTIFIED".
- Abaixo da foto: label "SETUP DE COMPETIÇÃO • 2021", o nome em display
  ("VW Golf GTI Stage 3") e a linha resumo ("180 WHP Dyno Certified • Garrett Powermax Turbo
  • Suspensão Coilover Clubsport").
- Grade 2x2 de especificações: MOTORIZAÇÃO (2.0 TSI Gen 3 / IS38 Hybrid Turbo),
  POTÊNCIA AFERIDA (180.4 WHP / Servitec 4x4 Rolo, o número em vermelho), PNEUS DE PISTA
  (Trofeo R / 235/40 R18 Forged), FREIOS / PASTILHAS (Brembo 6-Pot / Discos Flutuantes 380mm).
- Dois botões: "Gerenciar Mapa de Injeção (ECU)" (primário, branco) e
  "Histórico de Manutenção" (secundário, vidro).

OUTROS VEÍCULOS CADASTRADOS
- Lista compacta com "Ver todos (3)", cada linha com miniatura quadrada da foto, nome do carro,
  resumo em label pequeno (ex.: "410 WHP • Stage 2 Bootmod3" / "Garagem Secundária") e chevron.

PERFIL DE OFICINA
- Mesma estrutura, mas trocando as seções de piloto por: especialidades em chips, endereço com
  mapa, botão "Solicitar orçamento", galeria de trabalhos realizados (posts da oficina) e a
  lista de carros que a oficina preparou (marcados por outros usuários).

TELAS RELACIONADAS
- /carro/:id — ficha técnica completa do carro: galeria de fotos, todas as specs organizadas em
  seções (Motor, Transmissão, Suspensão, Freios, Rodas e Pneus, Eletrônica), lista completa de
  modificações, certificados de dyno, tempos de volta e todos os posts daquele carro.
- /garagem/carro/novo e /garagem/carro/:id/editar — formulário de cadastro do carro em etapas,
  com todos os campos do modelo de dados, selects para tração/aspiração/suspensão/stage e
  upload da foto de capa.

PRONTO QUANDO:
- Cadastrar e editar um carro grava todos os campos da ficha técnica no banco.
- Definir outro carro como principal muda o que aparece em "Garagem Ativa".
- Abrindo o perfil de outra pessoa, vejo os dados dela e o botão seguir funciona.
- A ficha completa do carro (/carro/:id) mostra specs, modificações e posts reais.
```

---

## FASE 6 — Publicar, notificações, busca e ajustes finais

```
Complete o app com as telas restantes e o polimento.

PUBLICAR (/publicar)
- Seleção de uma ou mais fotos da galeria ou câmera, com prévia e reordenação.
- Vincular o post a um carro da garagem (select com miniatura).
- Legenda com contador de caracteres, campo de localização (ex.: "Interlagos, SP") e opção de
  marcar a oficina responsável pela preparação.
- Toggle para exibir a ficha técnica do carro junto do post.
- Upload com barra de progresso e compressão no cliente. Só permite vincular carros e marcar
  oficinas que existem de verdade no banco (nunca um texto livre virando referência solta).

NOTIFICAÇÕES (/notificacoes)
- Lista agrupada por período (Hoje / Esta semana / Antes), com avatar do autor, texto da ação
  e miniatura do post à direita. Tipos: curtida, comentário, novo seguidor, match,
  dyno homologado e recorde de volta.
- Indicador de não lidas na dock.

BUSCA (/buscar)
- Campo de busca em pílula, com abas: Pilotos, Oficinas, Carros e Pistas.
- Filtros por marca, modelo, tração, faixa de potência (WHP), aspiração, stage, cidade/estado.
- Grade de resultados no estilo editorial (fotos grandes).

CONFIGURAÇÕES (/configuracoes)
- Editar perfil, trocar tipo de perfil, privacidade (perfil público/privado), preferências do
  radar (raio, tipos de carro), notificações, sair da conta e excluir conta.

POLIMENTO FINAL
- Estados de carregamento com skeletons no estilo do design system (nunca spinners genéricos).
- Estados vazios com ilustração/texto no tom da marca, sempre com uma ação sugerida.
- Tratamento de erro com toast discreto e opção de tentar novamente.
- Transições rápidas e táteis (150–250ms), com scale(0.98) no toque dos botões. Respeitar
  prefers-reduced-motion.
- Acessibilidade: contraste adequado, área de toque mínima de 44px, labels em todos os campos,
  navegação por teclado no desktop e aria-labels nos botões de ícone.
- Otimizar imagens (lazy loading, srcset) e garantir que o app abra rápido em 4G.

PRONTO QUANDO (o app está pronto para uso real):
- Publicar cria o post com a imagem no storage e ele aparece no feed na hora.
- Notificações chegam, marcam como lidas e o indicador da dock zera.
- A busca retorna resultados reais do banco e os filtros funcionam.
- Não existe nenhum TODO, alert(), texto "em breve" ou tela sem estado de vazio e erro.
- Percorri o app inteiro como um usuário novo, do cadastro ao primeiro post, sem travar.
```

---

## Observações importantes para o Lovable

- **Não invente cores fora da paleta.** O app é preto, branco e vermelho `#FF1F17`, ponto.
  Sem azul, sem verde, sem gradiente colorido — nem para status de sucesso ou erro. A única
  cor fora disso vem das fotos dos carros.
- **Nunca use avatar circular no card de descoberta** — ali a foto é sempre retangular 4:5.
- **Os números técnicos são o produto.** WHP, torque, pressão e tempo de volta precisam estar
  sempre em destaque tipográfico, com números tabulares.
- O app é **mobile-first**: desenhe para 390px de largura e só depois adapte para telas maiores.
- **Funcional vale mais que bonito.** Se precisar escolher, entregue a funcionalidade
  completa e simplifique o visual — nunca o contrário. Tela bonita que não faz nada
  não conta como entregue.
- Se algo ficar pesado, priorize nesta ordem: Feed → Descobrir → Perfil/Garagem → resto.
- **Segurança não é opcional nem é "depois".** A seção SEGURANÇA da Fase 2 vale para o app
  inteiro — cada tabela nova criada nas fases seguintes (posts, swipes, notificações etc.)
  precisa nascer com política de RLS, não só as que já existiam na Fase 2.
