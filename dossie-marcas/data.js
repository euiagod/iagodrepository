// Marcação: {1} ou {1,3} = citação das referências; {?} = a confirmar
window.DOSSIE = {
refs: [
 {t:"NeoFeed — Petz compra Zee.Dog (R$ 700 mi+)", u:"https://neofeed.com.br/negocios/petz-compra-zee-dog-em-um-negocio-de-mais-de-r-700-milhoes/"},
 {t:"InfoMoney — Três amigos de infância e a marca pet mais famosa do país", u:"https://www.infomoney.com.br/?p=1356146"},
 {t:"Forbes Brasil — Zee.Dog anuncia plano de expansão de franquias (2024)", u:"https://forbes.com.br/forbes-money/2024/03/zee-dog-ligada-a-petz-anuncia-plano-de-expansao-de-franquias/"},
 {t:"Brazil Journal — Zee.Dog faz aquisição para criar vertical de comida", u:"https://braziljournal.com/zeedog-faz-aquisicao-para-criar-vertical-de-comida/"},
 {t:"InfoMoney — Zee.Now após compra pela Petz", u:"https://www.infomoney.com.br/?p=1687696"},
 {t:"Nasdaq/Motley Fool — 3 key takeaways from Duolingo's 2025", u:"https://www.nasdaq.com/articles/3-key-takeaways-duolingos-2025"},
 {t:"IstoÉ Dinheiro — Brasil é o 2º maior mercado do Duolingo", u:"https://istoedinheiro.com.br/brasil-duolingo-2o-mercado-apenas-uma"},
 {t:"Meio & Mensagem — Duolingo nas redes sociais", u:"https://www.meioemensagem.com.br/marketing/duolingo-redes-sociais"},
 {t:"Forbes Brasil — Analigia Martins, diretora de marketing do Duolingo", u:"https://forbes.com.br/forbes-mulher/2024/02/analigia-martins-diretora-de-marketing-do-duolingo-nunca-desperdicei-nenhuma-oportunidade-que-me-apareceu/"},
 {t:"Forbes Brasil — Como o Duolingo construiu um negócio de US$ 700 mi", u:"https://forbes.com.br/listas/2019/07/como-o-duolingo-construiu-um-negocio-de-us-700-milhoes"},
 {t:"Let's Data Science — Duolingo reporta marcos financeiros de 2025", u:"https://letsdatascience.com/news/duolingo-reports-strong-2025-financial-milestones-bd7c1f09"},
 {t:"Remio — Receita do Duolingo cresce, ação cai 11%", u:"https://www.remio.ai/pt/post/duolingos-revenue-growth-meets-an-11-stock-drop-pt"},
 {t:"Neofeed — Dos pets aos camelos: fundadores da Zee.Dog criam fundo", u:"https://neofeed.com.br/startups/dos-pets-aos-camelos-fundadores-da-zee-dog-criam-fundo-de-r-100-milhoes/"}
],
brands: [
{
 id:"zeedog", name:"Zee.Dog", tag:"Pet · Brasil", color:"pink",
 stats:[["2012","fundação, São Paulo"],["R$ 715 mi","compra pela Petz (2021)"],["20+","países via distribuidores"],["~30%","faturamento internacional (dado da época da compra)"]],
 sections:[
  {id:"z-visao", title:"Visão geral", html:`
   <p>A Zee.Dog nasceu em 2012, em São Paulo, criada pelos irmãos <b>Thadeu e Felipe Diz</b> com o amigo de infância <b>Rodrigo Monteiro</b> (depois CFO). Começou com coleiras estampadas vendidas em feiras e apostou em uma ideia simples: tratar acessório de pet como <b>moda e design</b>, não como mero utilitário.{1,2}</p>
   <p>A empresa ficou conhecida por aplicar a lógica de <i>fast fashion</i> ao universo pet: coleções frequentes, estética autoral e uma comunidade de tutores que se enxerga como pai e mãe de seus animais.{13}</p>`},
  {id:"z-timeline", title:"Linha do tempo", html:`
   <ul class="tl">
    <li><b>2012</b> — Fundação com as primeiras coleiras estampadas.{2}</li>
    <li><b>2013–2014</b> — Crescimento de ~300% e exportação para 19 países da Ásia e Europa (relato de 2017).{?}</li>
    <li><b>2020</b> — Compra a Eleven Chimps e cria a Zee.Dog Kitchen, alimentação natural por assinatura.{4}</li>
    <li><b>2021</b> — A Petz compra 100% da Zee.Dog por cerca de <b>R$ 715 milhões</b>. Fundadores ficam com 5,7% da Petz e permanecem na operação por ao menos cinco anos.{1}</li>
    <li><b>2023</b> — Primeira franquia no exterior, nas Filipinas.{3}</li>
    <li><b>2024</b> — Anuncia plano de expansão de franquias, com foco no Brasil e olhar para o exterior.{3}</li>
   </ul>`},
  {id:"z-modelo", title:"Modelo de negócio e ecossistema", html:`
   <ul>
    <li><b>Core:</b> acessórios (coleiras, guias, peitorais), camas, brinquedos e coleções com colaborações.</li>
    <li><b>Zee.Now:</b> app de entrega para pets, incorporado na compra pela Petz.{1,5}</li>
    <li><b>Zee.Dog Kitchen:</b> alimentação natural por assinatura, nova vertical a partir de 2020.{4}</li>
    <li><b>Zee.Cat:</b> linha para gatos. <span class="flag">a confirmar</span></li>
    <li><b>Canais:</b> e-commerce, lojas próprias no Brasil e uma loja em Nova York, distribuidores em 20+ países e varejistas globais como Pets at Home (Reino Unido) e Chewy (EUA).{1,13}</li>
    <li><b>EUA:</b> operação com dois centros de distribuição (Los Angeles e Carolina do Norte).{5}</li>
   </ul>`},
  {id:"z-marca", title:"Marca e posicionamento", html:`
   <p><span class="flag">leitura analítica</span> O ativo central é <b>design como identidade</b>: o tutor compra para expressar quem ele é, e o pet é o veículo. A marca vende pertencimento a um estilo de vida, e o produto é a porta de entrada.</p>
   <p>Esse posicionamento permitiu preço de marca em um mercado dominado por produto commodity e abriu caminho para extensões (comida, entrega, gatos).</p>`},
  {id:"z-lente", title:"Lente de inovação", html:`
   <div class="lens">
    <h3>Job to be done</h3>
    <p>“Quando quero mostrar o quanto meu pet faz parte da minha identidade, quero acessórios que me representem e que eu tenha orgulho de exibir.”</p>
    <h3>Perguntas para provocar</h3>
    <ul>
     <li>Com a Petz no controle, a Zee.Dog continua sendo marca de design ou virou categoria do varejo?</li>
     <li>O que acontece com o “fast fashion” pet quando sustentabilidade e consumo consciente pressionam o modelo de coleções frequentes?</li>
     <li>Extensões como comida e entrega fortalecem a promessa de marca ou diluem o diferencial?</li>
     <li>Qual é a “streak” da Zee.Dog, ou seja, o hábito que faz o tutor voltar sem depender de lançamento?</li>
    </ul>
   </div>`},
  {id:"z-atencao", title:"Pontos de atenção", html:`
   <ul>
    <li>Fontes divergem sobre o ano de fundação (a CB Insights cita 2011); a maioria aponta 2012.{2}</li>
    <li>Números de faturamento e presença internacional variam conforme a data da matéria.</li>
    <li>Não encontrei dados públicos de 2025 sobre novas lojas ou investimento nos EUA. Vale conferir os resultados trimestrais da Petz (PETZ3).</li>
   </ul>`}
 ]
},
{
 id:"duolingo", name:"Duolingo", tag:"Edtech · EUA", color:"green",
 stats:[[">US$ 1 bi","receita anual em 2025"],["50 mi+","usuários ativos diários"],["12,5 mi","assinantes pagos (1º tri 2026)"],["#2","Brasil entre os mercados"]],
 sections:[
  {id:"d-visao", title:"Visão geral", html:`
   <p>O Duolingo foi criado em Pittsburgh (EUA) por <b>Luis von Ahn</b> e <b>Severin Hacker</b>. Von Ahn já era conhecido por ter criado o CAPTCHA durante a faculdade.{10} A proposta: ensino de idiomas <b>gratuito e acessível</b> a qualquer pessoa, em modelo freemium, com assinatura paga (Super) para quem quer mais.</p>
   <p>O app foi lançado ao público em 2012 e a empresa abriu capital na Nasdaq em 2021. <span class="flag">a confirmar</span></p>`},
  {id:"d-numeros", title:"Números principais", html:`
   <ul>
    <li><b>Receita:</b> passou de US$ 1 bilhão em 2025, com margem bruta em torno de 73%.{6,11}</li>
    <li><b>Usuários:</b> mais de 50 milhões de ativos diários e cerca de 135 milhões de ativos mensais em 2025.{6}</li>
    <li><b>1º trimestre de 2026:</b> 56,5 milhões de ativos diários e 12,5 milhões de assinantes pagos.{6}</li>
    <li><b>Conversão:</b> pagantes representaram cerca de 9,2% da média de ativos mensais em 2025.{6}</li>
    <li><b>Brasil:</b> segundo maior mercado, atrás apenas dos EUA.{7,9}</li>
   </ul>
   <p class="muted small">Números variam conforme a fonte e o trimestre; confirme no relatório oficial de resultados.</p>`},
  {id:"d-produto", title:"Motor de produto: gamificação", html:`
   <p>O Duolingo transforma estudo em hábito. As peças principais são <b>ofensivas (streaks)</b>, XP, ligas e metas diárias. A lógica psicológica por trás é a <b>aversão à perda</b>: ninguém quer perder a sequência de dias construída.{?}</p>
   <p>O streak também funciona como mídia: usuários compartilham suas sequências espontaneamente nas redes, e a marca ganha divulgação sem comprar anúncio.{?}</p>`},
  {id:"d-marca", title:"Marca: o Duo e o marketing “social first”", html:`
   <ul>
    <li>O <b>Duo</b>, a coruja verde, é uma personificação da marca: ele reage em tempo real a tendências, memes e ao que acontece no país.{8}</li>
    <li>A estratégia é <b>viralizar de forma orgânica</b>, usando humor irreverente e linguagem de internet; a gamificação existe para o usuário gostar de estudar e não abandonar.{9}</li>
    <li>No Brasil, esse marketing ajudou a consolidar o país como segundo maior mercado.{7,9}</li>
   </ul>`},
  {id:"d-recente", title:"Momentos recentes", html:`
   <ul>
    <li><b>Fev/2025:</b> campanha em que o Duo “morreu” e depois voltou, rendendo grande engajamento orgânico. <span class="flag">a confirmar</span></li>
    <li><b>Abr/2025:</b> memo de Luis von Ahn declarando a empresa “AI-first”, que gerou debate e críticas nas redes. <span class="flag">a confirmar</span></li>
    <li><b>2026:</b> o crescimento de usuários desacelerou e a ação caiu bastante em relação à máxima histórica.{12}</li>
   </ul>`},
  {id:"d-lente", title:"Lente de inovação", html:`
   <div class="lens">
    <h3>Job to be done</h3>
    <p>“Quando quero evoluir em um idioma sem depender de força de vontade, quero algo leve, divertido e que me faça voltar todo dia.”</p>
    <h3>Perguntas para provocar</h3>
    <ul>
     <li>Quando a marca vira entretenimento, contra quem o produto compete: outros apps de idiomas ou o TikTok?</li>
     <li>A ofensiva mede aprendizado ou só hábito? O que acontece com a confiança na marca se o usuário não ficar fluente?</li>
     <li>Um personagem forte é um ativo ou um risco quando o tom da marca precisa mudar (como na discussão sobre IA)?</li>
     <li>Qual é o próximo teto de crescimento: mais usuários, mais conversão em assinatura ou novas matérias além de idiomas?</li>
    </ul>
   </div>`},
  {id:"d-atencao", title:"Pontos de atenção", html:`
   <ul>
    <li>Parte dos dados (retenção, streaks de 7+ dias) aparece em blogs de terceiros e não no relatório original. Evite citar sem confirmar.</li>
    <li>Os eventos de 2025 marcados como “a confirmar” precisam de checagem na notícia original.</li>
   </ul>`}
 ]
}
],
compare: {
 id:"comparativo", title:"Comparativo lado a lado",
 cols:["Dimensão","Zee.Dog","Duolingo"],
 rows:[
  ["Origem","São Paulo, 2012","Pittsburgh (EUA), lançado em 2012"],
  ["Fundadores","Thadeu e Felipe Diz, Rodrigo Monteiro","Luis von Ahn e Severin Hacker"],
  ["Produto de entrada","Coleira estampada","App gratuito de idiomas"],
  ["Modelo","Venda de produto, lojas, e-commerce e assinatura (Kitchen)","Freemium com assinatura (Super) e anúncios"],
  ["Ativo central de marca","Design e pertencimento","Hábito (streak) e personagem (Duo)"],
  ["Canal principal","E-commerce, lojas próprias e distribuidores","Redes sociais e produto digital"],
  ["Escala","20+ países, lojas no Brasil e em Nova York","50 mi+ ativos diários, receita > US$ 1 bi"],
  ["Dono","Petz (desde 2021)","Capital aberto (Nasdaq: DUOL)"],
  ["Risco principal","Diluir a marca de design dentro do varejo","Desaceleração e dependência de tom e personagem"],
  ["Lição de inovação","Transformar uma categoria utilitária em expressão de identidade","Transformar uma tarefa chata em hábito e entretenimento"]
 ],
 html:`<div class="lens"><h3>Padrões em comum</h3>
  <ul>
   <li>As duas começam com um produto simples e vendem <b>identidade e comunidade</b>.</li>
   <li>As duas dão personalidade à marca: Zee.Dog por estética, Duolingo por personagem.</li>
   <li>As duas enfrentam o mesmo dilema: <b>escalar sem perder a alma da marca</b>.</li>
  </ul>
  <h3>Pergunta final</h3>
  <p>Se uma marca vende pertencimento e a outra vende hábito, o que acontece quando o consumidor muda de comunidade ou perde o hábito? Qual é o plano B de cada uma?</p></div>`
},
pods: [
 {id:"zeedog", title:"Zee.Dog em 1 minuto", brand:"Zee.Dog", script:
 "Bem-vindo ao resumo em um minuto da Zee.Dog. Tudo começou em dois mil e doze, em São Paulo, quando os irmãos Thadeu e Felipe Diz e o amigo Rodrigo Monteiro criaram coleiras estampadas e resolveram tratar acessório pet como moda. Fast fashion para cachorro: coleções novas, design autoral e uma comunidade de tutores que se vê como pai e mãe de pet. A marca cresceu rápido, exportou cedo, e hoje está em mais de vinte países, com lojas próprias no Brasil e em Nova York. Depois vieram a Zee.Now, de entrega, e a Zee.Dog Kitchen, de alimentação natural. Em dois mil e vinte e um, a Petz comprou a empresa por cerca de setecentos e quinze milhões de reais, mantendo os fundadores na operação. A pergunta que fica para quem trabalha com inovação: como crescer em escala sem perder a alma de marca de design? E o que a Zee.Dog vende de fato: produto, ou pertencimento?"},
 {id:"duolingo", title:"Duolingo em 1 minuto", brand:"Duolingo", script:
 "Agora, o resumo em um minuto do Duolingo. A empresa nasceu em Pittsburgh, nos Estados Unidos, criada por Luis von Ahn e Severin Hacker, com uma promessa radical: ensinar idiomas de graça, para qualquer pessoa. O app foi lançado em dois mil e doze e, em dois mil e vinte e cinco, passou de um bilhão de dólares em receita anual, com mais de cinquenta milhões de usuários ativos por dia. O segredo está em duas peças. Primeiro, a gamificação: ofensivas, ligas e metas transformam estudar em hábito, apoiadas na aversão à perda. Segundo, o Duo, a coruja verde, que virou personagem de internet, com marketing irreverente e social first. O Brasil é o segundo maior mercado da marca. A provocação: quando a marca vira entretenimento, o produto compete com quê? Com outros apps de ensino, ou com o TikTok?"}
]
};
