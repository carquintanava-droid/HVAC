(function(){
  const CONFIG = window.ELECTROCLIMA_CONFIG || {};
  const SUPABASE_URL = CONFIG.SUPABASE_URL;
  const SUPABASE_KEY = CONFIG.SUPABASE_PUBLISHABLE_KEY;
  const WHATSAPP_NUMBER = CONFIG.WHATSAPP_NUMBER || '51977193893';

  const form=document.getElementById('bookingForm');
  const steps=[...document.querySelectorAll('.wizard-step')];
  const dots=[...document.querySelectorAll('#stepDots span')];
  const prevBtn=document.getElementById('prevBtn');
  const nextBtn=document.getElementById('nextBtn');
  const submitBtn=document.getElementById('submitBtn');
  const errorBox=document.getElementById('wizardError');
  const reviewTable=document.getElementById('reviewTable');
  const stepLabel=document.getElementById('stepLabel');
  const stepPercent=document.getElementById('stepPercent');
  const stepBar=document.getElementById('stepBar');
  let currentStep=1;

  function qs(name){return form.querySelector(`[name="${name}"]`)}
  function getValue(name){
    const el=qs(name);
    if(!el)return '';
    if(el.type==='radio'){
      const checked=form.querySelector(`[name="${name}"]:checked`);
      return checked?checked.value:'';
    }
    if(el.type==='checkbox') return el.checked;
    return el.value.trim();
  }
  function setMessage(msg,ok=false){
    errorBox.textContent=msg;
    errorBox.classList.add('show');
    errorBox.style.background=ok?'#eefcf1':'#fff1f1';
    errorBox.style.borderColor=ok?'#b8ebc4':'#f0c5c5';
    errorBox.style.color=ok?'#216738':'#9a2020';
  }
  function clearMessage(){errorBox.classList.remove('show');errorBox.textContent='';}
  function selectCardUI(){
    document.querySelectorAll('.choice').forEach(c=>{
      const i=c.querySelector('input');
      c.classList.toggle('selected',!!i.checked);
    });
  }
  document.querySelectorAll('.choice input').forEach(input=>input.addEventListener('change',selectCardUI));

  function showStep(n){
    currentStep=n;
    steps.forEach(step=>step.classList.toggle('active',Number(step.dataset.step)===n));
    stepLabel.textContent=`PASO ${n} DE 5`;
    stepPercent.textContent=`${n*20}%`;
    stepBar.style.width=`${n*20}%`;
    dots.forEach((dot,i)=>{
      dot.classList.toggle('active',i+1===n);
      dot.classList.toggle('done',i+1<n);
    });
    prevBtn.disabled=n===1;
    nextBtn.hidden=n===5;
    submitBtn.hidden=n!==5;
    if(n===5) renderReview();
    clearMessage();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function validateStep(){
    if(currentStep===1) return !!getValue('service');
    if(currentStep===2) return getValue('details').length>=8 && !!getValue('siteType') && !!getValue('urgency');
    if(currentStep===3) return getValue('district').length>=2;
    if(currentStep===4) return getValue('name').length>=2 && getValue('phone').length>=7 && getValue('consent');
    return true;
  }

  function escapeHtml(v){
    return String(v).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  }

  function renderReview(){
    const rows=[
      ['Servicio',getValue('service')],
      ['Descripción',getValue('details')],
      ['Espacio',getValue('siteType')],
      ['Urgencia',getValue('urgency')],
      ['Ubicación',getValue('district')],
      ['Referencia',getValue('address')||'No indicada'],
      ['Nombre',getValue('name')],
      ['WhatsApp',getValue('phone')],
      ['Correo',getValue('email')||'No indicado']
    ];
    reviewTable.innerHTML=rows.map(([a,b])=>`<div class="review-row"><b>${escapeHtml(a)}</b><span>${escapeHtml(b)}</span></div>`).join('');
  }

  prevBtn.addEventListener('click',()=>showStep(Math.max(1,currentStep-1)));
  nextBtn.addEventListener('click',()=>{
    if(!validateStep()){
      setMessage('Revisa los campos obligatorios antes de continuar.');
      return;
    }
    showStep(Math.min(5,currentStep+1));
  });

  async function saveToSupabase(payload){
    if(!SUPABASE_URL || !SUPABASE_KEY){
      throw new Error('Falta la configuración de Supabase en js/config.js.');
    }

    const response=await fetch(`${SUPABASE_URL}/rest/v1/cotizaciones`,{
      method:'POST',
      headers:{
        'apikey':SUPABASE_KEY,
        'Content-Type':'application/json',
        'Prefer':'return=minimal'
      },
      body:JSON.stringify(payload)
    });

    if(!response.ok){
      let detail='';
      try{
        const data=await response.json();
        detail=data.message || data.hint || JSON.stringify(data);
      }catch(_){
        detail=await response.text();
      }

      if(response.status===401){
        throw new Error('Supabase rechazó la clave pública (401). Revisa js/config.js y recarga con Ctrl+F5.');
      }
      if(response.status===403){
        throw new Error('Supabase rechazó el permiso de inserción (403). Revisa la política RLS de cotizaciones.');
      }
      throw new Error(`Supabase respondió ${response.status}${detail?`: ${detail}`:''}`);
    }
  }

  function buildWhatsAppUrl(){
    const message=[
      'Hola ElectroClima, quiero solicitar una cotización.',
      '',
      `Nombre: ${getValue('name')}`,
      `Servicio: ${getValue('service')}`,
      `Descripción: ${getValue('details')}`,
      `Tipo de espacio: ${getValue('siteType')}`,
      `Urgencia: ${getValue('urgency')}`,
      `Ubicación: ${getValue('district')}`,
      `Referencia: ${getValue('address')||'No indicada'}`,
      `Teléfono: ${getValue('phone')}`,
      `Correo: ${getValue('email')||'No indicado'}`
    ].join('\n');
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    renderReview();

    submitBtn.disabled=true;
    submitBtn.textContent='Guardando solicitud…';
    clearMessage();

    const payload={
      nombre:getValue('name'),
      servicio:getValue('service'),
      descripcion:[
        `Descripción: ${getValue('details')}`,
        `Tipo de espacio: ${getValue('siteType')}`,
        `Urgencia: ${getValue('urgency')}`,
        `Distrito: ${getValue('district')}`,
        `Referencia: ${getValue('address')||'No indicada'}`,
        `Teléfono: ${getValue('phone')}`,
        `Correo: ${getValue('email')||'No indicado'}`
      ].join(' | ')
    };

    try{
      await saveToSupabase(payload);
      setMessage('Solicitud guardada correctamente en Supabase. Abriendo WhatsApp…',true);
      submitBtn.textContent='Solicitud enviada ✓';
      window.location.href=buildWhatsAppUrl();
    }catch(err){
      console.error('Error al guardar cotización:',err);
      setMessage('No se pudo guardar la solicitud. '+err.message);
      submitBtn.disabled=false;
      submitBtn.textContent='Reintentar envío ↗';
    }
  });

  // Soporta parámetros nuevos y los usados por versiones anteriores.
  const params=new URLSearchParams(window.location.search);
  const rawService=params.get('service') || params.get('servicio') || '';
  const rawName=params.get('name') || params.get('nombre') || '';
  const rawDetails=params.get('details') || params.get('detalle') || '';
  const aliases={
    electrico:'Instalaciones eléctricas',
    eléctrico:'Instalaciones eléctricas',
    electronico:'Ingeniería electrónica',
    electrónico:'Ingeniería electrónica',
    hvac:'Climatización HVAC',
    ventilacion:'Ventilación y extracción',
    ventilación:'Ventilación y extracción'
  };
  const serviceValue=aliases[rawService.toLowerCase()] || rawService;
  if(serviceValue){
    const radio=[...form.querySelectorAll('[name="service"]')].find(x=>x.value===serviceValue);
    if(radio) radio.checked=true;
  }
  if(rawName && qs('name')) qs('name').value=rawName;
  if(rawDetails && qs('details')) qs('details').value=rawDetails;

  showStep(1);
  selectCardUI();
})();
