// Search index
let INDEX = [];
fetch('search-index.json').then(r=>r.json()).then(d=>{INDEX=d;}).catch(()=>{});

const input = document.getElementById('search-input');
const box   = document.getElementById('search-results');

if(input){
  input.addEventListener('input', onSearch);
  input.addEventListener('keydown', onKey);
  document.addEventListener('click', e=>{
    if(!e.target.closest('.search-wrap')) closeSearch();
  });
}

function onSearch(){
  const q = input.value.trim().toLowerCase();
  if(q.length < 2){ closeSearch(); return; }
  const terms = q.split(/\s+/).filter(Boolean);
  const results = [];
  for(const page of INDEX){
    const hay = (page.title+' '+page.text).toLowerCase();
    if(terms.every(t=>hay.includes(t))){
      results.push({...page, snippet: getSnippet(page.text, terms)});
      if(results.length >= 8) break;
    }
  }
  renderResults(results);
}

function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

function getSnippet(text, terms){
  const lower = text.toLowerCase();
  let best = 0;
  for(const t of terms){ const i = lower.indexOf(t); if(i!==-1){best=i;break;} }
  const start = Math.max(0, best-60);
  const end   = Math.min(text.length, best+120);
  let s = (start>0?'…':'')+text.slice(start,end)+(end<text.length?'…':'');
  for(const t of terms) s = s.replace(new RegExp(escRe(t),'gi'), m=>'<mark>'+m+'</mark>');
  return s;
}

function renderResults(results){
  if(!results.length){
    box.innerHTML = '<div class="sr-empty">No results found</div>';
  } else {
    box.innerHTML = results.map((r,i)=>
      '<a class="sr-item'+(i===0?' active':'')+'" href="'+r.file+'?q='+encodeURIComponent(input.value)+'">'+
        '<div class="sr-section">'+r.section+'</div>'+
        '<div class="sr-title">'+r.title+'</div>'+
        '<div class="sr-snippet">'+r.snippet+'</div>'+
      '</a>'
    ).join('');
  }
  box.classList.add('visible');
}

function closeSearch(){ box.classList.remove('visible'); }

let activeIdx = 0;
function onKey(e){
  const items = box.querySelectorAll('.sr-item');
  if(!items.length) return;
  if(e.key==='ArrowDown'){e.preventDefault();activeIdx=(activeIdx+1)%items.length;hl(items);}
  else if(e.key==='ArrowUp'){e.preventDefault();activeIdx=(activeIdx-1+items.length)%items.length;hl(items);}
  else if(e.key==='Enter'){e.preventDefault();items[activeIdx]?.click();}
  else if(e.key==='Escape') closeSearch();
}
function hl(items){
  items.forEach((el,i)=>el.classList.toggle('active',i===activeIdx));
  items[activeIdx]?.scrollIntoView({block:'nearest'});
}

// Highlight terms from URL ?q=
const urlQ = new URLSearchParams(location.search).get('q');
if(urlQ){
  const terms = urlQ.trim().toLowerCase().split(/\s+/);
  const content = document.querySelector('.content');
  if(content){
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      let html = node.textContent;
      let changed = false;
      for(const t of terms){
        const rx = new RegExp(escRe(t),'gi');
        if(rx.test(html)){html=html.replace(rx,m=>'<mark class="hl">'+m+'</mark>');changed=true;}
      }
      if(changed){
        const span = document.createElement('span');
        span.innerHTML = html;
        node.parentNode.replaceChild(span, node);
      }
    });
  }
  if(input) input.value = urlQ;
}
