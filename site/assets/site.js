
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

  // Property photo lightbox
  const gal=document.querySelector('.gal[data-photos]');
  if(gal){
    let photos=[];
    try{photos=JSON.parse(gal.dataset.photos);}catch{photos=[];}
    if(photos.length){
      const lb=document.createElement('div');
      lb.className='lb';
      lb.innerHTML=
        '<div class="lb-head"><span class="lb-count"></span><button class="lb-close" aria-label="Fermer">✕</button></div>'+
        '<div class="lb-stage"><button class="lb-nav prev" aria-label="Précédent">‹</button><img alt=""><button class="lb-nav next" aria-label="Suivant">›</button></div>'+
        '<div class="lb-thumbs"></div>';
      document.body.appendChild(lb);
      const stage=lb.querySelector('.lb-stage img');
      const count=lb.querySelector('.lb-count');
      const prev=lb.querySelector('.lb-nav.prev');
      const next=lb.querySelector('.lb-nav.next');
      const thumbsEl=lb.querySelector('.lb-thumbs');
      thumbsEl.innerHTML=photos.map((u,i)=>'<button type="button" class="lb-thumb" data-i="'+i+'"><img src="'+u+'" loading="lazy" alt=""></button>').join('');
      let idx=0;
      function show(i){
        idx=Math.max(0,Math.min(photos.length-1,i));
        stage.src=photos[idx];
        count.textContent=(idx+1)+' / '+photos.length;
        prev.disabled=idx===0; next.disabled=idx===photos.length-1;
        thumbsEl.querySelectorAll('.lb-thumb').forEach((t,j)=>t.classList.toggle('active',j===idx));
        const active=thumbsEl.querySelector('.lb-thumb.active');
        if(active)active.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
      }
      function open(i){show(i||0);lb.classList.add('open');document.body.style.overflow='hidden';}
      function close(){lb.classList.remove('open');document.body.style.overflow='';}
      gal.querySelectorAll('[data-open-lightbox]').forEach(el=>{
        el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(+el.dataset.openLightbox||0);});
      });
      lb.querySelector('.lb-close').addEventListener('click',close);
      prev.addEventListener('click',()=>show(idx-1));
      next.addEventListener('click',()=>show(idx+1));
      thumbsEl.addEventListener('click',e=>{const b=e.target.closest('.lb-thumb');if(b)show(+b.dataset.i);});
      document.addEventListener('keydown',e=>{
        if(!lb.classList.contains('open'))return;
        if(e.key==='Escape')close();
        if(e.key==='ArrowLeft')show(idx-1);
        if(e.key==='ArrowRight')show(idx+1);
      });
      // Swipe sur mobile
      let touchX=null;
      lb.querySelector('.lb-stage').addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;},{passive:true});
      lb.querySelector('.lb-stage').addEventListener('touchend',e=>{
        if(touchX===null)return;
        const dx=e.changedTouches[0].clientX-touchX;
        if(dx>50)show(idx-1); else if(dx<-50)show(idx+1);
        touchX=null;
      });
    }
  }

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
