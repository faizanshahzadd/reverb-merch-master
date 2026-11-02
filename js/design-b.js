// DESIGN B: page behaviour for new-design-b.html
// Portfolio (data/portfolio.json) + filters + lightbox, countdown, stat
// counters, services tabs, FAQ accordion, mobile menu, nav shrink, reveal on
// scroll and the Netlify contact form. Reviews, Instagram, mockup tool and
// videos come from the shared js/social.js, js/mockup.js and js/videos.js.
(function(){
const $=id=>document.getElementById(id);
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

function escapeHTML(s){
  return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- portfolio ----------
const PF_LIMIT=8;let pfFilter='all',pfExpanded=false;
const pfGrid=$('pfGrid'),pfMore=$('pfMore');
const CAT_LABEL={gifts:'Corporate Gifts',employee:'Employee Kits',apparel:'Apparel',events:'Events',packaging:'Packaging',stationery:'Stationery'};
function renderPortfolio(items){
  pfGrid.innerHTML=items.map(it=>{
    const title=escapeHTML(it.title),desc=escapeHTML(it.desc),image=escapeHTML(it.image),cat=escapeHTML(it.cat);
    return `
<figure class="pf-item" data-cat="${cat}" data-title="${title}" data-desc="${desc}" tabindex="0" role="button" aria-label="View ${title}">
  <div class="pf-img"><img src="${image}" alt="${title}" loading="lazy"><span class="pf-zoom" aria-hidden="true">↗</span></div>
  <figcaption><span class="pf-cat c-${cat}"><i class="dot"></i>${escapeHTML(CAT_LABEL[it.cat]||it.cat)}</span><h4>${title}</h4><p>${desc}</p></figcaption>
</figure>`;
  }).join('');
  applyFilter();
}
function applyFilter(){
  let shown=0;
  pfGrid.querySelectorAll('.pf-item').forEach(i=>{
    const match=pfFilter==='all'||i.dataset.cat===pfFilter;
    i.classList.toggle('hidden',!match);
    if(match){shown++;i.classList.toggle('more-hidden',pfFilter==='all'&&!pfExpanded&&shown>PF_LIMIT);}
    else i.classList.remove('more-hidden');
  });
  if(pfMore)pfMore.hidden=!(pfFilter==='all'&&!pfExpanded&&shown>PF_LIMIT);
}
fetch('data/portfolio.json').then(r=>r.json()).then(d=>renderPortfolio(d.items||[])).catch(()=>{});
document.querySelectorAll('.fb').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.fb').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');});
  b.classList.add('active');b.setAttribute('aria-pressed','true');
  pfFilter=b.dataset.f;applyFilter();
}));
if(pfMore)pfMore.addEventListener('click',()=>{pfExpanded=true;applyFilter();});

// ---------- lightbox ----------
const lb=$('lb');
function openLB(el){
  $('lbImg').src=el.querySelector('img').src;
  $('lbImg').alt=el.dataset.title||'';
  $('lbTitle').textContent=el.dataset.title||'';
  $('lbDesc').textContent=el.dataset.desc||'';
  lb.classList.add('open');document.body.classList.add('modal-open');
  $('lbCloseBtn').focus();
}
function closeLB(){lb.classList.remove('open');document.body.classList.remove('modal-open');}
pfGrid.addEventListener('click',e=>{const el=e.target.closest('.pf-item');if(el)openLB(el);});
pfGrid.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target.closest('.pf-item');if(el){e.preventDefault();openLB(el);}});
lb.addEventListener('click',e=>{if(e.target===e.currentTarget)closeLB();});
$('lbCloseBtn').addEventListener('click',closeLB);

// ---------- nav + mobile menu ----------
const nav=$('navbar'),links=$('navLinks'),hbg=$('hbg');
$('navCtaBtn').addEventListener('click',()=>location.href='#contact');
function closeMenu(){
  links.classList.remove('open');nav.classList.remove('menu-open');hbg.classList.remove('open');
  hbg.setAttribute('aria-expanded','false');hbg.setAttribute('aria-label','Open menu');
  document.body.classList.remove('menu-open');
}
function toggleMenu(){
  const isOpen=links.classList.toggle('open');
  nav.classList.toggle('menu-open',isOpen);hbg.classList.toggle('open',isOpen);
  hbg.setAttribute('aria-expanded',String(isOpen));hbg.setAttribute('aria-label',isOpen?'Close menu':'Open menu');
  document.body.classList.toggle('menu-open',isOpen);
}
hbg.addEventListener('click',toggleMenu);
links.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
window.addEventListener('resize',()=>{if(innerWidth>1024)closeMenu();});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  closeLB();closeMenu();$('tm-overlay').classList.remove('open');
});
const onScroll=()=>nav.classList.toggle('sc',scrollY>50);
window.addEventListener('scroll',onScroll,{passive:true});onScroll();

// ---------- countdown (Nov 15, rolls to next year) ----------
function updateCD(){
  const now=new Date(),t=new Date(now.getFullYear(),10,15);
  if(now>t)t.setFullYear(t.getFullYear()+1);
  const d=t-now;
  $('cd-d').textContent=String(Math.floor(d/86400000)).padStart(2,'0');
  $('cd-h').textContent=String(Math.floor(d%86400000/3600000)).padStart(2,'0');
  $('cd-m').textContent=String(Math.floor(d%3600000/60000)).padStart(2,'0');
}
updateCD();setInterval(updateCD,60000);

// ---------- stat counters ----------
const statsEl=$('stats');
function runCounters(){
  document.querySelectorAll('.stat-n').forEach(el=>{
    const t=parseInt(el.dataset.t,10),suffix=t>=100?'+':'';
    if(reduce){el.textContent=t+suffix;return;}
    let s;const a=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/1500,1),e2=1-Math.pow(1-p,3);el.textContent=Math.floor(e2*t)+suffix;if(p<1)requestAnimationFrame(a);};
    requestAnimationFrame(a);
  });
}
if('IntersectionObserver' in window&&statsEl){
  const so=new IntersectionObserver(e=>{if(e[0].isIntersecting){runCounters();so.disconnect();}},{threshold:.3});
  so.observe(statsEl);
}else runCounters();

// ---------- reveal on scroll ----------
const rvEls=document.querySelectorAll('.rv');
if('IntersectionObserver' in window&&!reduce){
  const ro=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('on');ro.unobserve(x.target);}}),{threshold:.1,rootMargin:'0px 0px -40px 0px'});
  rvEls.forEach(el=>ro.observe(el));
}else rvEls.forEach(el=>el.classList.add('on'));

// ---------- services tabs ----------
const tabs=[...document.querySelectorAll('.svc-tab')];
function selectTab(tab,focus){
  tabs.forEach(t=>{
    const on=t===tab;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;
    const p=$(t.getAttribute('aria-controls'));if(p)p.hidden=!on;
  });
  if(focus)tab.focus();
}
tabs.forEach((t,i)=>{
  t.addEventListener('click',()=>selectTab(t));
  t.addEventListener('keydown',e=>{
    const k=e.key;let n=null;
    if(k==='ArrowDown'||k==='ArrowRight')n=(i+1)%tabs.length;
    else if(k==='ArrowUp'||k==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;
    else if(k==='Home')n=0;else if(k==='End')n=tabs.length-1;
    if(n!==null){e.preventDefault();selectTab(tabs[n],true);}
  });
});

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-item').forEach(item=>{
  const q=item.querySelector('.faq-q');
  q.addEventListener('click',()=>{
    const was=item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i=>{i.classList.remove('open');i.querySelector('.faq-q').setAttribute('aria-expanded','false');});
    if(!was){item.classList.add('open');q.setAttribute('aria-expanded','true');}
  });
});

// ---------- contact form (Netlify) ----------
(function(){
  const form=document.querySelector('form[name="contact"]');
  if(!form)return;
  const submitBtn=form.querySelector('.ct-submit');
  function encode(data){
    return Object.keys(data).map(k=>encodeURIComponent(k)+"="+encodeURIComponent(data[k])).join("&");
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const data={};
    new FormData(form).forEach((v,k)=>{data[k]=v;});
    submitBtn.disabled=true;
    fetch('/',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:encode(data)
    }).then(()=>{
      $('tm-overlay').classList.add('open');
      $('tmCloseBtn').focus();
      form.reset();
    }).catch(()=>{
      alert('Something went wrong sending your enquiry. Please try WhatsApp instead.');
    }).finally(()=>{
      submitBtn.disabled=false;
    });
  });
  $('tmCloseBtn').addEventListener('click',()=>$('tm-overlay').classList.remove('open'));
})();

// ---------- clients marquee: duplicate the logo row for a seamless loop ----------
const cl=$('clGrid');
if(cl&&!reduce){
  const copy=cl.cloneNode(true);copy.removeAttribute('id');copy.setAttribute('aria-hidden','true');
  copy.querySelectorAll('img').forEach(i=>i.alt='');
  cl.parentNode.appendChild(copy);cl.parentNode.classList.add('run');
}
})();
