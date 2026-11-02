// HOMEPAGE VIDEOS
// Videos are muted loops with preload="none": each one loads and plays only
// while it's on screen and pauses when scrolled away. Visitors who prefer
// reduced motion get the poster plus a play button instead of autoplay.
(function(){
  const vids=document.querySelectorAll('video[data-autoplay]');
  if(!vids.length)return;
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setState(v){const w=v.closest('.vid');if(w)w.classList.toggle('playing',!v.paused);}
  vids.forEach(v=>{
    v.muted=true;v.playsInline=true;
    v.addEventListener('play',()=>setState(v));v.addEventListener('pause',()=>setState(v));
    const w=v.closest('.vid'),btn=w&&w.querySelector('.vid-btn');
    const toggle=()=>{v.dataset.user='1';if(v.paused){v.play().catch(()=>{});}else v.pause();};
    if(btn)btn.addEventListener('click',e=>{e.stopPropagation();toggle();});
    v.addEventListener('click',toggle);
  });
  if(reduce||!('IntersectionObserver' in window))return;
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    const v=e.target;
    if(e.isIntersecting){if(v.dataset.user!=='1'||!v.paused)v.play().catch(()=>{});}
    else if(!v.paused)v.pause();
  }),{threshold:.35});
  vids.forEach(v=>io.observe(v));
})();
