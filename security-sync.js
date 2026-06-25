(function(){
  const STATE_KEY='kemfest2026_state_v7';
  const ADMIN_PIN_KEY='kemfest2026_admin_pin_sha256_v1';
  const ADMIN_SESSION_KEY='kemfest2026_admin_session_v1';
  const CLOUD_SECRET_KEY='kemfest2026_cloud_secret_v1';
  const CONFIG=window.KEMFEST_CONFIG||{};
  const ADMIN_TABS=new Set(['people','budget','cloud','history','report']);
  const PUBLIC_INPUTS=new Set(['taskSearch','taskFilter']);
  let isAdmin=sessionStorage.getItem(ADMIN_SESSION_KEY)==='1';
  let cloudSecret=localStorage.getItem(CLOUD_SECRET_KEY)||'';

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function readState(){
    try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null');}
    catch(e){return null;}
  }
  function writeState(state){
    localStorage.setItem(STATE_KEY,JSON.stringify(state));
  }
  function keepConfigUrl(state){
    if(!state||!CONFIG.appsScriptUrl)return state;
    state.cloud=state.cloud||{};
    if(!state.cloud.appsScriptUrl)state.cloud.appsScriptUrl=CONFIG.appsScriptUrl;
    return state;
  }
  function sanitizePublicState(raw){
    const safe=JSON.parse(JSON.stringify(raw||{}));
    safe.people=(safe.people||[]).map(row=>({
      date:row.date||'',
      taskId:Number(row.taskId||0),
      unique:Number(row.unique||0),
      repeat:Number(row.repeat||0),
      age:row.age!==false,
      listLink:''
    }));
    safe.budget=(safe.budget||[]).map(row=>({
      fact:Number(row.fact||0),
      docType:row.docType||'folder',
      docUrl:'',
      docAmount:Number(row.docAmount||0),
      taskId:Number(row.taskId||0),
      checkStatus:row.checkStatus||'empty'
    }));
    safe.cloud={driveUrl:'',sheetUrl:'',statsFolderUrl:'',financeFolderUrl:'',appsScriptUrl:CONFIG.appsScriptUrl||''};
    safe.history=[];
    safe.report={results:safe.report&&safe.report.results?safe.report.results:'',risks:''};
    return safe;
  }
  async function hashPin(pin){
    const data=new TextEncoder().encode('kemfest2026:'+pin);
    if(window.crypto&&crypto.subtle){
      const hash=await crypto.subtle.digest('SHA-256',data);
      return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
    }
    return btoa(unescape(encodeURIComponent('kemfest2026:'+pin)));
  }
  function setStatus(text){
    const status=$('adminStatus');
    if(status){status.dataset.touched='1';status.textContent=text;}
  }
  function requireAdmin(message){
    if(isAdmin)return true;
    const panel=$('adminPanel');
    if(panel)panel.hidden=false;
    setStatus(message||'Войдите как администратор, чтобы менять данные сайта.');
    const pin=$('adminPin');
    if(pin)pin.focus();
    return false;
  }
  function setAdminMode(on){
    isAdmin=!!on;
    if(isAdmin)sessionStorage.setItem(ADMIN_SESSION_KEY,'1');
    else sessionStorage.removeItem(ADMIN_SESSION_KEY);
    applyAdminUi();
  }
  async function adminLogin(){
    const pin=$('adminPin');
    const value=(pin&&pin.value||'').trim();
    if(value.length<4){setStatus('PIN должен быть не короче 4 символов.');return;}
    const stored=localStorage.getItem(ADMIN_PIN_KEY);
    const hash=await hashPin(value);
    if(!stored){
      localStorage.setItem(ADMIN_PIN_KEY,hash);
      setStatus('PIN создан. Режим администратора включен.');
      setAdminMode(true);
      return;
    }
    if(stored===hash){
      setStatus('Режим администратора включен.');
      setAdminMode(true);
    }else{
      setStatus('PIN не подходит. Проверьте ввод.');
    }
  }
  async function changePin(){
    if(!requireAdmin('Сначала войдите как администратор.'))return;
    const next=prompt('Новый PIN администратора для этого браузера, минимум 4 символа');
    if(!next)return;
    if(next.trim().length<4){setStatus('PIN должен быть не короче 4 символов.');return;}
    localStorage.setItem(ADMIN_PIN_KEY,await hashPin(next.trim()));
    setStatus('PIN администратора изменен.');
  }
  function showDashboardIfNeeded(){
    const active=document.querySelector('.tab.active');
    if(active&&ADMIN_TABS.has(active.id)&&!isAdmin){
      const dashboardButton=document.querySelector('#nav [data-tab="dashboard"]');
      if(dashboardButton)dashboardButton.click();
    }
  }
  function ensureCloudSecretField(){
    const form=$('cloudForm');
    if(!form||$('cloudSecret'))return;
    form.insertAdjacentHTML('beforeend',`<div class="field full"><label>Ключ доступа Apps Script</label><input id="cloudSecret" type="password" value="${esc(cloudSecret)}" placeholder="Хранится только в этом браузере"></div>`);
    $('cloudSecret').onchange=e=>{
      if(!requireAdmin())return;
      cloudSecret=String(e.target.value||'').trim();
      localStorage.setItem(CLOUD_SECRET_KEY,cloudSecret);
    };
  }
  function applyAdminUi(){
    document.body.classList.toggle('is-admin',isAdmin);
    const stored=!!localStorage.getItem(ADMIN_PIN_KEY);
    const title=$('adminTitle'),hint=$('adminHint'),toggle=$('adminToggle'),login=$('adminLogin'),logout=$('adminLogout'),change=$('adminChangePin'),pin=$('adminPin'),status=$('adminStatus');
    if(title)title.textContent=isAdmin?'Режим администратора':'Публичный режим';
    if(hint)hint.textContent=isAdmin?'Открыты служебные разделы, редактирование и отправка данных в Apps Script.':'Публично доступны дашборд, план, доказательства, документы и автопроверка. '+(stored?'Введите PIN администратора.':'При первом входе задайте PIN для этого браузера.');
    if(status&&!status.dataset.touched)status.textContent=isAdmin?'Администратор вошел. После работы нажмите «Выйти».':'Это локальная защита для GitHub Pages: служебные настройки скрыты от обычных посетителей.';
    if(toggle)toggle.textContent=isAdmin?'Администратор: включен':'Администратор';
    if(login)login.hidden=isAdmin;
    if(logout)logout.hidden=!isAdmin;
    if(change)change.hidden=!isAdmin;
    if(pin){pin.hidden=isAdmin;if(isAdmin)pin.value='';}
    showDashboardIfNeeded();
    ensureCloudSecretField();
    document.querySelectorAll('main input,main select,main textarea').forEach(el=>{
      if(PUBLIC_INPUTS.has(el.id)||el.id==='reportText')return;
      el.disabled=!isAdmin;
    });
    document.querySelectorAll('main button').forEach(btn=>{
      btn.disabled=!isAdmin;
      btn.classList.toggle('locked-action',!isAdmin);
    });
  }
  function guardGlobals(){
    ['setTask','addProof','proofSet','deleteProof','addPerson','personSet','deletePerson','budgetSet','docSet','cloudSet','setMeta'].forEach(name=>{
      const original=window[name];
      if(typeof original!=='function'||original.__guarded)return;
      const wrapped=function(){
        if(!requireAdmin())return;
        const result=original.apply(this,arguments);
        setTimeout(()=>{guardGlobals();applyAdminUi();},0);
        return result;
      };
      wrapped.__guarded=true;
      window[name]=wrapped;
    });
  }
  function blockPublicEdit(e){
    if(isAdmin)return;
    const target=e.target;
    if(!target)return;
    if(target.closest('#adminPanel')||target.closest('#adminToggle'))return;
    if(target.closest('.nav'))return;
    if(target.closest('a'))return;
    if(PUBLIC_INPUTS.has(target.id))return;
    const editable=target.closest('main input,main select,main textarea,main button');
    if(!editable)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    requireAdmin();
  }
  async function saveCloud(){
    if(!requireAdmin())return;
    const state=keepConfigUrl(readState());
    const url=(state&&state.cloud&&state.cloud.appsScriptUrl)||CONFIG.appsScriptUrl||'';
    const status=$('cloudStatus');
    if(!url){if(status)status.textContent='Сначала укажите Apps Script Web App URL.';return;}
    if(!cloudSecret){if(status)status.textContent='Укажите ключ доступа Apps Script.';return;}
    if(!state){if(status)status.textContent='На этом устройстве пока нет сохраненных данных.';return;}
    if(status)status.textContent='Отправка...';
    try{
      const report=$('reportText')?$('reportText').value:'';
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({project:'КемьФест 2026',key:cloudSecret,state,report})});
      const data=await res.json().catch(()=>({ok:res.ok}));
      if(!res.ok||data.ok===false)throw new Error(data.error||('Apps Script ответил: '+res.status));
      if(status)status.textContent='Данные сохранены в облаке.';
    }catch(err){
      if(status)status.textContent='Не удалось сохранить: '+String(err.message||err);
    }
  }
  async function loadCloud(){
    if(!requireAdmin())return;
    const state=keepConfigUrl(readState()||{cloud:{}});
    const url=(state.cloud&&state.cloud.appsScriptUrl)||CONFIG.appsScriptUrl||'';
    const status=$('cloudStatus');
    if(!url){if(status)status.textContent='Сначала укажите Apps Script Web App URL.';return;}
    if(!cloudSecret){if(status)status.textContent='Укажите ключ доступа Apps Script.';return;}
    if(status)status.textContent='Загрузка...';
    try{
      const requestUrl=url+(url.includes('?')?'&':'?')+'mode=state&key='+encodeURIComponent(cloudSecret)+'&t='+Date.now();
      const res=await fetch(requestUrl,{cache:'no-store'});
      const data=await res.json();
      if(!data.ok||!data.state)throw new Error(data.error||'В облаке пока нет сохраненной версии.');
      writeState(keepConfigUrl(data.state));
      if(status)status.textContent='Данные загружены. Страница обновляется...';
      location.reload();
    }catch(err){
      if(status)status.textContent='Не удалось загрузить: '+String(err.message||err);
    }
  }
  async function loadPublicCloud(){
    if(!CONFIG.appsScriptUrl||localStorage.getItem(STATE_KEY))return;
    try{
      const url=CONFIG.appsScriptUrl+(CONFIG.appsScriptUrl.includes('?')?'&':'?')+'mode=public&t='+Date.now();
      const res=await fetch(url,{cache:'no-store'});
      const data=await res.json();
      if(data.ok&&data.state){
        writeState(sanitizePublicState(data.state));
        location.reload();
      }
    }catch(e){}
  }
  function bind(){
    guardGlobals();
    applyAdminUi();
    const toggle=$('adminToggle'),login=$('adminLogin'),logout=$('adminLogout'),change=$('adminChangePin'),pin=$('adminPin');
    if(toggle)toggle.onclick=()=>{const panel=$('adminPanel');if(panel)panel.hidden=!panel.hidden;applyAdminUi();};
    if(login)login.onclick=adminLogin;
    if(logout)logout.onclick=()=>setAdminMode(false);
    if(change)change.onclick=changePin;
    if(pin)pin.onkeydown=e=>{if(e.key==='Enter')adminLogin();};
    if($('sendCloud'))$('sendCloud').onclick=saveCloud;
    if($('loadCloud'))$('loadCloud').onclick=loadCloud;
    document.addEventListener('input',blockPublicEdit,true);
    document.addEventListener('change',blockPublicEdit,true);
    document.addEventListener('click',blockPublicEdit,true);
    loadPublicCloud();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
})();
