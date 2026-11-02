// LIVE REVIEWS + INSTAGRAM FEED
// Reads Google reviews, Facebook recommendations and Instagram posts from the
// Netlify functions in netlify/functions/. Each widget falls back to static
// content (review screenshots, portfolio photos) when a function isn't
// configured yet or the API is down, so the homepage never shows an empty box.
(function(){
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stars=n=>{const r=Math.max(0,Math.min(5,Math.round(n||0)));return'★★★★★☆☆☆☆☆'.slice(5-r,10-r);};
const getJSON=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();});
const live=d=>d&&d.configured&&!d.error;
const ago=t=>{if(!t)return'';const s=(Date.now()-new Date(t))/1000;if(isNaN(s))return'';const u=[[31536e3,'year'],[2592e3,'month'],[604800,'week'],[86400,'day']];for(const[k,n]of u){const v=Math.floor(s/k);if(v>=1)return v+' '+n+(v>1?'s':'')+' ago';}return'recently';};
const igSvg='<svg viewBox="0 0 24 24" width="26" height="26" fill="white" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>';

// ---------- review cards ----------
// A card is any element with data-reviews="google|facebook" containing
// .rv-summary, .rv-slider, .rv-nav (.rv-prev, .rv-dots, .rv-next), .rv-links.
const SOURCES={
  google:{
    url:'/.netlify/functions/google-reviews',
    summary:d=>`<div class="grev-score-row"><span class="grev-score">${d.rating?d.rating.toFixed(1):'5.0'}</span><span class="grev-stars">${stars(d.rating||5)}</span></div><div class="grev-count">Based on ${d.total||0} Google reviews</div>`,
    links:d=>`<a href="${esc(d.mapsUri||'https://www.google.com/search?q=reverb+merch+karachi+reviews')}" target="_blank" rel="noopener noreferrer">Read all on Google →</a>${d.writeReviewUri?` <a href="${esc(d.writeReviewUri)}" target="_blank" rel="noopener noreferrer">Write a review</a>`:''}`,
    fallback:{summary:'<div class="grev-score-row"><span class="grev-score">5.0</span><span class="grev-stars">★★★★★</span></div><div class="grev-count">Real reviews from Google</div>',
      slider:'<div class="fb-screens"><a href="images/reviews/google-review-1.jpg" target="_blank" rel="noopener noreferrer"><img src="images/reviews/google-review-1.jpg" alt="Google reviews from Aleena Ahtesham, Naveed Ahmad, and Riffat Nazia" loading="lazy"></a><a href="images/reviews/google-review-2.jpg" target="_blank" rel="noopener noreferrer"><img src="images/reviews/google-review-2.jpg" alt="Google reviews from Riffat Nazia, Jumana Rizvi, and Tanveer Ali" loading="lazy"></a></div>',
      links:'<a href="https://www.google.com/search?q=reverb+merch+karachi+reviews" target="_blank" rel="noopener noreferrer">See full Google reviews →</a>'},
  },
  facebook:{
    url:'/.netlify/functions/facebook-reviews',
    summary:d=>d.rating?`<div class="grev-score-row"><span class="grev-score">${d.rating.toFixed(1)}</span><span class="grev-stars">${stars(d.rating)}</span></div><div class="grev-count">Based on ${d.total||0} Facebook reviews</div>`
      :`<div class="grev-score-row"><span class="grev-score">${d.recommendPct!=null?d.recommendPct+'%':'★'}</span><span class="grev-count" style="margin:0">recommend us</span></div><div class="grev-count">Based on ${d.total||0} Facebook reviews</div>`,
    links:d=>`<a href="${esc(d.reviewsUri||'https://www.facebook.com/reverbmerchofficial/reviews')}" target="_blank" rel="noopener noreferrer">See all on Facebook →</a>`,
    fallback:{summary:'<div class="grev-score-row"><span class="grev-score">Facebook Reviews</span></div><div class="grev-count">Real feedback from our page</div>',
      slider:'<div class="fb-screens"><a href="images/reviews/facebook-review-1.jpg" target="_blank" rel="noopener noreferrer"><img src="images/reviews/facebook-review-1.jpg" alt="Facebook review from Muhammad Rashid and Amna Noor" loading="lazy"></a></div>',
      links:'<a href="https://www.facebook.com/reverbmerchofficial/reviews" target="_blank" rel="noopener noreferrer">See more on Facebook →</a>'},
  },
};
const results={};
function initCard(card){
  const src=card.dataset.reviews,cfg=SOURCES[src];if(!cfg)return;
  const $=s=>card.querySelector(s);
  const sum=$('.rv-summary'),slider=$('.rv-slider'),nav=$('.rv-nav'),dots=$('.rv-dots'),links=$('.rv-links');
  let idx=0,items=[],timer=null;
  function fallback(){sum.innerHTML=cfg.fallback.summary;slider.innerHTML=cfg.fallback.slider;if(links)links.innerHTML=cfg.fallback.links;if(nav)nav.style.display='none';}
  function go(n){
    idx=(n+items.length)%items.length;
    slider.querySelectorAll('.grev-item').forEach((el,i)=>el.classList.toggle('active',i===idx));
    dots.querySelectorAll('.grev-dot').forEach((d,i)=>d.classList.toggle('active',i===idx));
    if(timer){clearInterval(timer);timer=setInterval(()=>go(idx+1),7000);}
  }
  function render(d){
    results[src]=d;updateBadges();
    if(!live(d)||!d.reviews||!d.reviews.length){fallback();return;}
    sum.innerHTML=cfg.summary(d);if(links)links.innerHTML=cfg.links(d);
    items=d.reviews.slice(0,8);
    slider.innerHTML=items.map((r,i)=>{
      const av=r.photo?`<img class="grev-av" src="${esc(r.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<div class="grev-av-fallback">${esc((r.author||'?')[0])}</div>`;
      const when=r.relativeTime||ago(r.time);
      const name=r.profile?`<a href="${esc(r.profile)}" target="_blank" rel="noopener noreferrer">${esc(r.author)}</a>`:esc(r.author);
      const badge=src==='facebook'&&!d.rating?'<div class="grev-item-stars rv-rec">✔ Recommends Reverb Merch</div>':`<div class="grev-item-stars">${stars(r.rating)}</div>`;
      return `<div class="grev-item${i===0?' active':''}">${badge}<blockquote>“${esc(r.text.length>420?r.text.slice(0,417)+'…':r.text)}”</blockquote><div class="grev-author">${av}<div><div class="grev-author-name">${name}</div><div class="grev-author-time">${esc(when)}</div></div></div></div>`;
    }).join('');
    if(items.length>1&&nav){
      nav.style.display='flex';
      dots.innerHTML=items.map((_,i)=>`<button type="button" class="grev-dot${i===0?' active':''}" aria-label="Review ${i+1}"></button>`).join('');
      dots.querySelectorAll('.grev-dot').forEach((b,i)=>b.addEventListener('click',()=>go(i)));
      $('.rv-prev').addEventListener('click',()=>go(idx-1));
      $('.rv-next').addEventListener('click',()=>go(idx+1));
      timer=setInterval(()=>go(idx+1),7000);
      card.addEventListener('mouseenter',()=>{clearInterval(timer);timer=null;});
      card.addEventListener('mouseleave',()=>{if(!timer)timer=setInterval(()=>go(idx+1),7000);});
    }
  }
  getJSON(cfg.url).then(render).catch(()=>{results[src]=null;fallback();});
}
// Hero / summary badges: any element with data-rating-badge.
function updateBadges(){
  const g=results.google,f=results.facebook,parts=[];
  if(live(g)&&g.rating)parts.push(`<span class="hr-stars">★</span> ${g.rating.toFixed(1)} on Google`);
  if(live(f)){if(f.rating)parts.push(`${f.rating.toFixed(1)} on Facebook`);else if(f.recommendPct!=null&&f.total)parts.push(`${f.recommendPct}% recommend on Facebook`);}
  document.querySelectorAll('[data-rating-badge]').forEach(el=>{if(!parts.length)return;el.innerHTML=parts.join(' <span class="hr-sep">·</span> ');el.style.display='inline-flex';});
}
document.querySelectorAll('[data-reviews]').forEach(initCard);

// ---------- Instagram ----------
const grid=document.getElementById('igGrid');
if(grid){
  const count=n=>n>=1000?(n/1000).toFixed(n>=1e4?0:1)+'k':n;
  function fallback(){
    // Portfolio photos as stand-ins, all linking to the profile.
    getJSON('data/portfolio.json').then(d=>{
      const items=(d.items||[]).slice(0,9);if(!items.length)throw 0;
      grid.innerHTML=items.map(it=>`<a class="ig-item" href="https://instagram.com/reverbmerch" target="_blank" rel="noopener noreferrer"><img src="${esc(it.image)}" alt="${esc(it.title)}" loading="lazy"><div class="ig-ov">${igSvg}</div></a>`).join('');
    }).catch(()=>{grid.innerHTML='<div class="ig-fallback"><p>See our latest posts, behind-the-scenes, and client unboxings on Instagram.</p><a href="https://instagram.com/reverbmerch" target="_blank" rel="noopener noreferrer">Visit @reverbmerch →</a></div>';});
  }
  getJSON('/.netlify/functions/instagram-feed').then(d=>{
    if(!live(d)||!d.posts||!d.posts.length){fallback();return;}
    grid.innerHTML=d.posts.map(p=>{
      const kind=p.type==='VIDEO'?'<span class="ig-kind" aria-label="Reel">▶</span>':p.type==='CAROUSEL_ALBUM'?'<span class="ig-kind" aria-label="Carousel">❐</span>':'';
      const stats=(p.likes!=null||p.comments!=null)?`<div class="ig-stats">${p.likes!=null?'♥ '+count(p.likes):''}${p.comments!=null?' &nbsp;💬 '+count(p.comments):''}</div>`:'';
      return `<a class="ig-item" href="${esc(p.permalink)}" target="_blank" rel="noopener noreferrer"><img src="${esc(p.image)}" alt="${esc(p.caption)||'@reverbmerch post'}" loading="lazy" referrerpolicy="no-referrer">${kind}<div class="ig-ov"><div class="ig-ov-in">${igSvg}${stats}${p.caption?`<p>${esc(p.caption)}</p>`:''}</div></div></a>`;
    }).join('');
  }).catch(fallback);
}
})();
