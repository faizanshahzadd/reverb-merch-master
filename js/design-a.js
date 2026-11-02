// DESIGN A: page behaviour for new-design-a.html
// Portfolio (data/portfolio.json) + filters + lightbox, countdown banner,
// stat counters, FAQ accordion, mobile menu, nav shrink, reveal-on-scroll,
// marquees and the Netlify contact form. Reviews, Instagram, the mockup tool
// and videos come from the shared js/social.js, js/mockup.js and js/videos.js.
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

function escapeHTML(s){
  return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
}

// ---------- framed photos: square local shots have a white watermark band at the bottom ----------
var FRAMED=/(^|\/)images\/(inline\/)?[^\/]+\.jpe?g$/i;
function markFramed(img){
  if(img.closest('.lb'))return;
  var src=img.getAttribute('src')||'';
  if(FRAMED.test(src)&&img.naturalWidth&&Math.abs(img.naturalWidth-img.naturalHeight)<2)img.classList.add('sq-frame');
}
document.addEventListener('load',function(e){if(e.target&&e.target.tagName==='IMG')markFramed(e.target);},true);
document.querySelectorAll('img').forEach(function(i){if(i.complete)markFramed(i);});

// ---------- marquees: clone the track contents once so translateX(-50%) loops ----------
document.querySelectorAll('[data-marquee]').forEach(function(track){
  var kids=Array.prototype.slice.call(track.children);
  kids.forEach(function(k){
    var c=k.cloneNode(true);
    c.setAttribute('aria-hidden','true');
    c.querySelectorAll('img').forEach(function(i){i.alt='';});
    track.appendChild(c);
  });
});

// ---------- portfolio ----------
var pfItems=[],pfFilter='all';
function renderPortfolio(items){
  var grid=$('pfGrid');
  grid.innerHTML=items.map(function(it){
    var title=escapeHTML(it.title),desc=escapeHTML(it.desc),image=escapeHTML(it.image),cat=escapeHTML(it.cat);
    return '<button type="button" class="pf-item" data-cat="'+cat+'" data-title="'+title+'" data-desc="'+desc+'">'+
      '<img src="'+image+'" alt="'+title+'" loading="lazy">'+
      '<span class="pf-ov"><span class="pf-cat">'+cat+'</span><span class="pf-t">'+title+'</span><span class="pf-d">'+desc+'</span></span>'+
      '<span class="pf-zoom" aria-hidden="true">+</span></button>';
  }).join('')||'<p class="pf-empty">More work coming soon.</p>';
}
function applyFilter(){
  renderPortfolio(pfFilter==='all'?pfItems:pfItems.filter(function(i){return i.cat===pfFilter;}));
}
fetch('data/portfolio.json').then(function(r){return r.json();}).then(function(d){pfItems=d.items||[];applyFilter();}).catch(function(){});
document.querySelectorAll('.fb').forEach(function(b){
  b.addEventListener('click',function(){
    document.querySelectorAll('.fb').forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false');});
    b.classList.add('active');b.setAttribute('aria-pressed','true');
    pfFilter=b.dataset.f;applyFilter();
  });
});
$('pfGrid').addEventListener('click',function(e){
  var el=e.target.closest('.pf-item');
  if(el)openLB(el);
});

// ---------- lightbox ----------
var lb=$('lb'),lastFocus=null;
function openLB(el){
  lastFocus=el;
  $('lbImg').src=el.querySelector('img').src;
  $('lbImg').alt=el.dataset.title||'';
  $('lbTitle').textContent=el.dataset.title||'';
  $('lbDesc').textContent=el.dataset.desc||'';
  lb.classList.add('open');
  $('lbCloseBtn').focus();
}
function closeLB(){
  if(!lb.classList.contains('open'))return;
  lb.classList.remove('open');
  if(lastFocus)lastFocus.focus();
}
lb.addEventListener('click',function(e){if(e.target===e.currentTarget)closeLB();});
$('lbCloseBtn').addEventListener('click',closeLB);

// ---------- nav / menu ----------
var nav=$('navbar'),links=$('navLinks'),hbg=$('hbg');
$('navCtaBtn').addEventListener('click',function(){location.href='#contact';});
function closeMenu(){
  links.classList.remove('open');nav.classList.remove('menu-open');hbg.classList.remove('open');
  document.body.classList.remove('menu-open');
  hbg.setAttribute('aria-expanded','false');hbg.setAttribute('aria-label','Open menu');
}
function toggleMenu(){
  var isOpen=links.classList.toggle('open');
  nav.classList.toggle('menu-open',isOpen);hbg.classList.toggle('open',isOpen);
  document.body.classList.toggle('menu-open',isOpen);
  hbg.setAttribute('aria-expanded',String(isOpen));hbg.setAttribute('aria-label',isOpen?'Close menu':'Open menu');
}
hbg.addEventListener('click',toggleMenu);
links.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closeMenu);});
window.matchMedia('(min-width: 1025px)').addEventListener('change',function(m){if(m.matches)closeMenu();});
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  closeLB();closeMenu();
  $('tm-overlay').classList.remove('open');
});
function onScroll(){nav.classList.toggle('sc',window.scrollY>50);}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();

// ---------- thank-you overlay ----------
$('tmCloseBtn').addEventListener('click',function(){$('tm-overlay').classList.remove('open');});
$('tm-overlay').addEventListener('click',function(e){if(e.target===e.currentTarget)e.currentTarget.classList.remove('open');});

// ---------- countdown (Nov 15, rolls to next year) ----------
function updateCD(){
  var now=new Date(),t=new Date(now.getFullYear(),10,15);
  if(now>t)t.setFullYear(t.getFullYear()+1);
  var d=t-now;
  $('cd-d').textContent=String(Math.floor(d/86400000)).padStart(2,'0');
  $('cd-h').textContent=String(Math.floor(d%86400000/3600000)).padStart(2,'0');
  $('cd-m').textContent=String(Math.floor(d%3600000/60000)).padStart(2,'0');
}
updateCD();setInterval(updateCD,60000);

// ---------- stat counters ----------
var statsEl=document.querySelector('.stats');
function runCounters(){
  document.querySelectorAll('.stat-n').forEach(function(el){
    var t=parseInt(el.dataset.t,10),s;
    if(reduce){el.textContent=t+(t>=100?'+':'');return;}
    var a=function(ts){if(!s)s=ts;var p=Math.min((ts-s)/1500,1),e2=1-Math.pow(1-p,3);el.textContent=Math.floor(e2*t)+(t>=100?'+':'');if(p<1)requestAnimationFrame(a);};
    requestAnimationFrame(a);
  });
}
if('IntersectionObserver' in window&&statsEl){
  var so=new IntersectionObserver(function(e){if(e[0].isIntersecting){runCounters();so.disconnect();}},{threshold:.3});
  so.observe(statsEl);
}else runCounters();

// ---------- reveal on scroll ----------
if('IntersectionObserver' in window&&!reduce){
  document.documentElement.classList.add('js-rv');
  var ro=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('on');ro.unobserve(x.target);}});},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.rv').forEach(function(el){
    // stagger siblings inside the same grid
    var sib=el.parentElement?Array.prototype.indexOf.call(el.parentElement.children,el):0;
    el.style.transitionDelay=Math.min(sib%8,7)*60+'ms';
    // drop the stagger once revealed so hover effects respond instantly
    el.addEventListener('transitionend',function(){el.style.transitionDelay='';},{once:true});
    ro.observe(el);
  });
}

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-item').forEach(function(item){
  var q=item.querySelector('.faq-q');
  q.addEventListener('click',function(){
    var was=item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(i){i.classList.remove('open');i.querySelector('.faq-q').setAttribute('aria-expanded','false');});
    if(!was){item.classList.add('open');q.setAttribute('aria-expanded','true');}
  });
});

// ---------- subtle tilt on hero tiles + pricing cards (pointer devices only) ----------
if(!reduce&&window.matchMedia('(hover: hover) and (pointer: fine)').matches){
  document.querySelectorAll('[data-tilt], .ht, .pr-card, .bl-card').forEach(function(el){
    el.addEventListener('pointermove',function(e){
      var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      el.style.setProperty('--rx',(-y*6).toFixed(2)+'deg');el.style.setProperty('--ry',(x*6).toFixed(2)+'deg');
    });
    el.addEventListener('pointerleave',function(){el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg');});
  });
}

// ---------- contact form (Netlify) ----------
(function(){
  var form=document.querySelector('form[name="contact"]');
  if(!form)return;
  var submitBtn=form.querySelector('.ct-submit');
  function encode(data){
    return Object.keys(data).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(data[k]);}).join('&');
  }
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var data={};
    new FormData(form).forEach(function(v,k){data[k]=v;});
    submitBtn.disabled=true;
    fetch('/',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:encode(data)
    }).then(function(){
      $('tm-overlay').classList.add('open');
      form.reset();
    }).catch(function(){
      alert('Something went wrong sending your enquiry. Please try WhatsApp instead.');
    }).finally(function(){
      submitBtn.disabled=false;
    });
  });
})();
})();
