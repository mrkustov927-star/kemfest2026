(function(){
  const CONFIG=window.KEMFEST_CONFIG||{};
  const ADMIN_HASH=CONFIG.adminPinHash||'';
  const SESSION_KEY='kemfest2026_admin_session_v1';
  const $=id=>document.getElementById(id);

  async function hashPin(pin){
    const data=new TextEncoder().encode('kemfest2026:'+pin);
    const hash=await crypto.subtle.digest('SHA-256',data);
    return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function setStatus(text){
    const status=$('adminStatus');
    if(!status)return;
    status.dataset.touched='1';
    status.textContent=text;
  }
  function applyAdmin(on){
    document.body.classList.toggle('is-admin',!!on);
    if(on)sessionStorage.setItem(SESSION_KEY,'1');
    else sessionStorage.removeItem(SESSION_KEY);

    const title=$('adminTitle'),hint=$('adminHint'),pin=$('adminPin'),login=$('adminLogin'),logout=$('adminLogout'),change=$('adminChangePin'),toggle=$('adminToggle'),status=$('adminStatus');
    if(title)title.textContent=on?'Режим администратора':'Вход администратора';
    if(hint)hint.textContent=on?'Административные разделы открыты. После работы нажмите «Выйти».':'Введите PIN, который знает только администратор проекта.';
    if(pin){pin.hidden=!!on;if(on)pin.value='';}
    if(login)login.hidden=!!on;
    if(logout)logout.hidden=!on;
    if(change)change.hidden=true;
    if(toggle)toggle.hidden=!on;
    if(status&&!status.dataset.touched)status.textContent='';
  }
  async function login(){
    const pin=$('adminPin');
    const value=(pin&&pin.value?pin.value:'').trim();
    if(!ADMIN_HASH){setStatus('PIN администратора ещё не настроен. Обратитесь к администратору сайта.');return;}
    if(!value){setStatus('Введите PIN администратора.');return;}
    try{
      const hash=await hashPin(value);
      if(hash===ADMIN_HASH){
        const status=$('adminStatus');
        if(status){status.dataset.touched='1';status.textContent='Доступ открыт.';}
        applyAdmin(true);
      }else{
        setStatus('Неверный PIN. Административные данные не открыты.');
      }
    }catch(e){setStatus('Не удалось проверить PIN в этом браузере.');}
  }

  const loginBtn=$('adminLogin'),logoutBtn=$('adminLogout'),pin=$('adminPin'),toggle=$('adminToggle');
  if(loginBtn)loginBtn.onclick=login;
  if(logoutBtn)logoutBtn.onclick=()=>{const status=$('adminStatus');if(status){delete status.dataset.touched;status.textContent='';}applyAdmin(false);};
  if(pin)pin.onkeydown=e=>{if(e.key==='Enter')login();};
  if(toggle)toggle.onclick=()=>{const panel=$('adminPanel');if(panel)panel.hidden=!panel.hidden;};
  applyAdmin(sessionStorage.getItem(SESSION_KEY)==='1');
})();
