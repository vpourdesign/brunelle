
// Smooth scroll + reveal + video hover-play
document.addEventListener('DOMContentLoaded',()=>{
  const io=new IntersectionObserver((es)=>{for(const e of es){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}},{threshold:.01,rootMargin:'0px 0px -5% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  // Safety fallback — make everything visible after 2s in case JS stalls
  setTimeout(()=>document.querySelectorAll('.reveal:not(.in)').forEach(el=>el.classList.add('in')),1500);

  // Video hover preview (muted) + click → modal fullscreen with sound
  const modal=document.createElement('div');
  modal.className='vid-modal';
  modal.innerHTML='<button class="close" aria-label="Fermer">✕</button><video controls playsinline></video>';
  document.body.appendChild(modal);
  const modalVid=modal.querySelector('video');
  const closeModal=()=>{modal.classList.remove('open'); modalVid.pause(); modalVid.removeAttribute('src'); modalVid.load();};
  modal.querySelector('.close').addEventListener('click',closeModal);
  modal.addEventListener('click',(e)=>{if(e.target===modal)closeModal();});
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeModal();});

  document.querySelectorAll('.vid').forEach(card=>{
    const v=card.querySelector('video');
    if(!v) return;
    v.muted=true; v.playsInline=true; v.loop=true;
    card.addEventListener('mouseenter',()=>v.play().catch(()=>{}));
    card.addEventListener('mouseleave',()=>{v.pause(); v.currentTime=0});
    card.addEventListener('click',(e)=>{
      e.preventDefault();
      const src=v.querySelector('source')?.src; if(!src) return;
      modalVid.src=src.split('#')[0];
      modal.classList.add('open');
      modalVid.currentTime=0;
      modalVid.play().catch(()=>{});
    });
  });

  // Donut animate
  document.querySelectorAll('.donut').forEach(d=>{
    const v=parseFloat(d.dataset.v||0);
    requestAnimationFrame(()=>d.style.setProperty('--v',v));
  });

  // Property filters
  const fb=document.querySelectorAll('[data-filter]');
  if(fb.length){
    fb.forEach(b=>b.addEventListener('click',()=>{
      fb.forEach(x=>x.classList.remove('active')); b.classList.add('active');
      const f=b.dataset.filter;
      document.querySelectorAll('[data-prop]').forEach(c=>{
        if(f==='all'||c.dataset.prop.includes(f)) c.style.display='';
        else c.style.display='none';
      });
    }));
  }
});
