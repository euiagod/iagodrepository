(function(){
const D = window.DOSSIE;
const $ = (s,r=document)=>r.querySelector(s);
const esc = s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm = s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

/* ---------- citações ---------- */
function cites(html){
  return html.replace(/\{([\d,\s]+)\}/g,(_,ns)=>'<sup class="cite">'+ns.split(',').map(n=>{
    n=n.trim();return `<a href="#ref-${n}" title="${esc(D.refs[n-1].t)}">[${n}]</a>`;}).join('')+'</sup>')
  .replace(/\{\?\}/g,' <span class="flag">a confirmar</span>');
}

/* ---------- blocos de conteúdo ---------- */
const blocks = []; // {brand, id, title, html, text, el}
D.brands.forEach(b=>b.sections.forEach(s=>blocks.push({brand:b.id,bname:b.name,id:s.id,title:s.title,html:cites(s.html)})));
const cmp = D.compare;
const tableHtml = `<div class="tablewrap"><table><thead><tr>${cmp.cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${
  cmp.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`+cmp.html;
blocks.push({brand:'comparativo',bname:'Comparativo',id:'comparativo',title:cmp.title,html:tableHtml});
blocks.forEach(b=>{const d=document.createElement('div');d.innerHTML=b.html;b.text=norm(b.title+' '+b.bname+' '+d.textContent);});

const cardsEl=$('#cards');
function render(){
  const frag=document.createDocumentFragment();
  D.brands.concat([{id:'comparativo'}]).forEach(b=>{
    if(b.id!=='comparativo'){
      const h=document.createElement('div');h.className='brandhead';h.dataset.brand=b.id;
      h.innerHTML=`<h2>${b.name}</h2><span class="badge ${b.color==='green'?'g':''}">${b.tag}</span>`;
      frag.appendChild(h);
      const st=document.createElement('div');st.className='stats';st.dataset.brand=b.id;
      st.innerHTML=b.stats.map(s=>`<div class="stat"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('');
      frag.appendChild(st);
    }
    blocks.filter(x=>x.brand===b.id).forEach(x=>{
      const c=document.createElement('article');c.className='card';c.id=x.id;c.dataset.brand=x.brand;
      c.innerHTML=`<header><h2>${x.title}</h2></header><div class="body">${x.html}</div>`;
      x.el=c;x.body=c.querySelector('.body');x.orig=x.html;x.h2=c.querySelector('h2');
      frag.appendChild(c);
    });
  });
  cardsEl.appendChild(frag);
}
render();

/* ---------- fontes (toggle) + atalhos ---------- */
const srcState={zeedog:true,duolingo:true,comparativo:true};
const srcNames={zeedog:'Zee.Dog',duolingo:'Duolingo',comparativo:'Comparativo'};
$('#srcToggles').innerHTML=Object.keys(srcNames).map(k=>`<li><label><input type="checkbox" data-s="${k}" checked><span class="dot" style="${k==='duolingo'?'background:var(--green)':k==='comparativo'?'background:var(--muted)':''}"></span>${srcNames[k]}</label></li>`).join('');
$('#srcToggles').addEventListener('change',e=>{srcState[e.target.dataset.s]=e.target.checked;apply();});
$('#jump').innerHTML=['<a href="#podcast">🎧 Podcast</a>']
 .concat(D.brands.map(b=>`<span class="grp">${b.name}</span>`+b.sections.map(s=>`<a href="#${s.id}">${s.title}</a>`).join('')))
 .concat(['<span class="grp">Geral</span><a href="#comparativo">Comparativo</a>']).join('');
$('#refList').innerHTML=D.refs.map((r,i)=>`<li id="ref-${i+1}"><a href="${r.u}" target="_blank" rel="noopener noreferrer">${esc(r.t)}</a></li>`).join('');
$('#refCount').textContent='('+D.refs.length+')';

/* ---------- busca ---------- */
const qEl=$('#q'),clr=$('#clear'),resEl=$('#results'),emptyEl=$('#empty');
function highlight(root,terms){
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
  while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(n=>{
    const t=n.nodeValue,nt=norm(t);let ranges=[];
    terms.forEach(term=>{let i=0;while((i=nt.indexOf(term,i))>-1){ranges.push([i,i+term.length]);i+=term.length;}});
    if(!ranges.length)return;
    ranges.sort((a,b)=>a[0]-b[0]);
    const merged=[];ranges.forEach(r=>{const l=merged[merged.length-1];if(l&&r[0]<=l[1])l[1]=Math.max(l[1],r[1]);else merged.push(r);});
    const f=document.createDocumentFragment();let p=0;
    merged.forEach(([a,b])=>{f.append(t.slice(p,a));const m=document.createElement('mark');m.textContent=t.slice(a,b);f.append(m);p=b;});
    f.append(t.slice(p));n.replaceWith(f);
  });
}
function apply(){
  const raw=qEl.value.trim();const terms=norm(raw).split(/\s+/).filter(t=>t.length>1);
  clr.hidden=!raw;let shown=0,hits=0;
  blocks.forEach(b=>{
    b.body.innerHTML=b.orig;b.h2.textContent=b.title;
    let ok=srcState[b.brand]&&(!terms.length||terms.every(t=>b.text.includes(t)));
    b.el.hidden=!ok;if(ok){shown++;if(terms.length){hits++;highlight(b.body,terms);highlight(b.h2,terms);}}
  });
  document.querySelectorAll('.brandhead,.stats').forEach(el=>{el.hidden=!srcState[el.dataset.brand]||terms.length>0;});
  document.querySelectorAll('.pod').forEach(p=>{
    const podData=D.pods.find(x=>x.id===p.dataset.id);
    p.hidden=!!terms.length&&!terms.every(t=>norm(podData.script+' '+podData.title).includes(t));
  });
  const podShown=[...document.querySelectorAll('.pod')].filter(p=>!p.hidden).length;
  $('#podcast').hidden=terms.length>0&&podShown===0;
  resEl.hidden=!terms.length;
  if(terms.length){const pt=podShown?` e ${podShown} roteiro${podShown>1?'s':''} de podcast`:'';
    resEl.textContent=`${hits} seç${hits===1?'ão':'ões'} encontrada${hits===1?'':'s'}${pt} para “${raw}”.`;}
  emptyEl.hidden=!(terms.length&&hits===0&&podShown===0)&&shown>0;
  if(!terms.length&&shown===0)emptyEl.hidden=false;
}
let tmr;qEl.addEventListener('input',()=>{clearTimeout(tmr);tmr=setTimeout(apply,120);});
clr.addEventListener('click',()=>{qEl.value='';apply();qEl.focus();});
document.addEventListener('keydown',e=>{
  if((e.key==='/'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='SELECT')||(e.key==='k'&&(e.metaKey||e.ctrlKey))){e.preventDefault();qEl.focus();qEl.select();}
  if(e.key==='Escape'&&document.activeElement===qEl){qEl.value='';apply();}
});

/* ---------- podcast (Web Speech API) ---------- */
const synth='speechSynthesis' in window?window.speechSynthesis:null;
let voices=[],current=null,token=0;
function pickVoices(){
  if(!synth)return;
  voices=synth.getVoices().filter(v=>/^pt/i.test(v.lang));
  voices.sort((a,b)=>(/pt[-_]BR/i.test(b.lang)-/pt[-_]BR/i.test(a.lang))||(/natural|neural|google|online/i.test(b.name)-/natural|neural|google|online/i.test(a.name)));
  document.querySelectorAll('.vsel').forEach(sel=>{
    const prev=sel.value;
    sel.innerHTML=voices.length?voices.map((v,i)=>`<option value="${i}">${esc(v.name)} (${v.lang})</option>`).join(''):'<option>voz padrão</option>';
    if(prev&&voices[prev])sel.value=prev;
  });
  $('#voiceNote').textContent=!synth?'Seu navegador não suporta áudio por voz; use a transcrição abaixo de cada card.'
    :voices.length?'Narração gerada pela voz em português do seu dispositivo. A qualidade varia por navegador; no Chrome, Edge e Safari costuma ficar melhor.'
    :'Nenhuma voz em português foi encontrada neste dispositivo; o navegador usará a voz padrão. A transcrição fica disponível abaixo.';
}
function sentences(text){return text.split(/(?<=[.?!])\s+/).map(s=>s.trim()).filter(Boolean);}
const grid=$('#podGrid');
D.pods.forEach(p=>{
  const sents=sentences(p.script),words=p.script.split(/\s+/).length;
  const el=document.createElement('div');el.className='pod';el.dataset.id=p.id;
  el.innerHTML=`<h3>${p.title}</h3><div class="meta">${words} palavras · ~${Math.round(words/155*60)} s</div>
   <div class="ctrls"><button class="play" aria-label="Ouvir ${esc(p.title)}">▶</button><div class="bar" role="progressbar" aria-label="Progresso"><i></i></div></div>
   <div class="ctrls" style="margin-top:10px;flex-wrap:wrap"><label class="small muted">Velocidade <select class="rate"><option value="0.9">0,9×</option><option value="1" selected>1×</option><option value="1.15">1,15×</option><option value="1.3">1,3×</option></select></label>
   <label class="small muted">Voz <select class="vsel" style="max-width:190px"></select></label></div>
   <div class="tr" aria-label="Transcrição">${sents.map((s,i)=>`<span data-i="${i}">${esc(s)} </span>`).join('')}</div>`;
  grid.appendChild(el);
  const btn=el.querySelector('.play'),bar=el.querySelector('.bar i');
  const total=sents.join('').length;
  const st={el,btn,bar,sents,total,idx:0,state:'idle',done:0};
  btn.addEventListener('click',()=>toggle(st,p));
});
function mark(st,i){st.el.querySelectorAll('.tr span').forEach(s=>s.classList.toggle('now',+s.dataset.i===i));}
function reset(st){st.state='idle';st.btn.textContent='▶';st.el.classList.remove('playing');st.bar.style.width='0';mark(st,-1);st.idx=0;}
function speakFrom(st,p,i){
  if(!synth||i>=st.sents.length){if(i>=st.sents.length)setTimeout(()=>{if(current===st){reset(st);current=null;}},300);return;}
  const my=token;st.idx=i;mark(st,i);
  st.bar.style.width=Math.round(st.sents.slice(0,i).join('').length/st.total*100)+'%';
  const u=new SpeechSynthesisUtterance(st.sents[i]);
  const vs=st.el.querySelector('.vsel');const v=voices[vs.value];
  u.lang=v?v.lang:'pt-BR';if(v)u.voice=v;u.rate=+st.el.querySelector('.rate').value;
  u.onend=()=>{if(my===token&&current===st&&st.state==='playing')speakFrom(st,p,i+1);};
  u.onerror=e=>{if(e.error==='canceled'||e.error==='interrupted')return;if(my===token){reset(st);current=null;}};
  synth.speak(u);
}
function toggle(st,p){
  if(!synth){alert('Seu navegador não suporta síntese de voz. Leia a transcrição abaixo.');return;}
  if(current===st&&st.state==='playing'){synth.cancel();token++;st.state='paused';st.btn.textContent='▶';return;}
  if(current&&current!==st){synth.cancel();token++;reset(current);}
  token++;synth.cancel();
  const resume=current===st&&st.state==='paused';
  current=st;st.state='playing';st.btn.textContent='❚❚';st.el.classList.add('playing');
  speakFrom(st,p,resume?st.idx:0);
}
['change'].forEach(ev=>grid.addEventListener(ev,e=>{
  if(!e.target.matches('.rate,.vsel'))return;
  const pod=e.target.closest('.pod');if(current&&current.el===pod&&current.state==='playing'){token++;synth.cancel();speakFrom(current,null,current.idx);}
}));
if(synth){pickVoices();synth.onvoiceschanged=pickVoices;}else pickVoices();
window.addEventListener('pagehide',()=>synth&&synth.cancel());
$('#goPod').addEventListener('click',()=>$('#podcast').scrollIntoView({behavior:'smooth'}));
})();
