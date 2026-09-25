(function(){
  const menuToggle=document.getElementById('menuToggle');
  const mainNav=document.getElementById('mainNav');
  if(menuToggle && mainNav){
    menuToggle.addEventListener('click',()=>mainNav.classList.toggle('open'));
    mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mainNav.classList.remove('open')));
  }

  const compareCard=document.getElementById('compareCard');
  const compareRange=document.getElementById('compareRange');
  if(compareCard && compareRange){
    const update=()=>compareCard.style.setProperty('--pos',`${compareRange.value}%`);
    compareRange.addEventListener('input',update);
    update();
  }

  const quickForm=document.getElementById('quickForm');
  if(quickForm){
    quickForm.addEventListener('submit',e=>{
      e.preventDefault();
      const fd=new FormData(quickForm);
      const params=new URLSearchParams({
        nombre:String(fd.get('nombre')||''),
        servicio:String(fd.get('servicio')||''),
        detalle:String(fd.get('detalle')||'')
      });
      window.location.href=`reservar.html?${params.toString()}`;
    });
  }
})();
