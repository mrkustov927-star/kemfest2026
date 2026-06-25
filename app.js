(function(){
  const PLAN={events:12,people:480,pubs:57,views:69000,budget:891000,deadline:'2026-11-30'};
  const TASKS=[
    [1,'Визуальный стиль проекта','2026-01-31',0,1,500,['publication'],['Дизайн-макеты','Логотип','Публикация или скриншот']],
    [2,'Стартовые пресс-релизы','2026-02-28',0,5,2000,['publication','stats'],['Тексты','Ссылки','Скриншоты статистики']],
    [3,'Общеорганизационная подготовка','2026-06-30',0,1,500,['publication','folder','act'],['Протоколы','Договоры','Счета и акты']],
    [4,'Историческая информация','2026-02-28',0,1,500,['publication'],['Источники','Тексты','Согласования']],
    [5,'Мастер-классы по костюмам','2026-05-31',80,5,5000,['publication','stats','participants','photo'],['Не менее 10 мастер-классов','80 участников 14-25 лет','Списки','Фото и видео','Публикации']],
    [6,'Запись и монтаж видеороликов','2026-05-31',0,1,500,['video','act','folder'],['Договор и акт','6 видеороликов','Исходники']],
    [7,'Подготовка фестиваля','2026-06-06',0,5,2000,['publication','folder','act'],['Программа','Договоры','Закупки','Анонсы']],
    [8,'Проведение фестиваля «КемьФест»','2026-06-07',400,6,5000,['publication','stats','participants','photo','video'],['Программа','Список участников','Фото и видео','Публикации']],
    [9,'Размещение и распространение видеороликов','2026-11-30',0,25,50000,['publication','stats','video'],['Ссылки на ролики','25 публикаций','Скриншоты статистики']],
    [10,'Итоговое собрание команды','2026-06-15',0,1,500,['folder'],['Протокол','Список присутствующих','Выводы']],
    [11,'Итоговые пост-релизы','2026-06-30',0,5,2000,['publication','stats'],['5 публикаций','Ссылки','Скриншоты статистики']],
    [12,'Аналитическая и финансовая отчетность','2026-11-30',0,1,500,['folder','act'],['Аналитический отчет','Финансовый отчет','Реестр документов']]
  ].map(x=>({id:x[0],title:x[1],deadline:x[2],people:x[3],pubs:x[4],views:x[5],required:x[6],evidence:x[7]}));
  const BUDGET=[
    ['Расходные материалы',140000],['Полиграфия',22700],['Медали и кубки',31500],['Подарочная продукция',104000],
    ['Проживание',60000],['Перевозка',30000],['Оборудование',103700],['Материалы для инсталляций',93000],
    ['Оружие и доспехи',90000],['Пошив костюмов',106100],['Услуги дизайнера',50000],['Запись видеороликов',60000]
  ].map(x=>({name:x[0],plan:x[1]}));
  const DOCS=['Аналитический отчет','Финансовый отчет','Реестр договоров и актов','Реестр публикаций со ссылками','Скриншоты статистики просмотров и охватов','Списки участников','Фотоархив','Видеоархив','Документы по закупкам','Протоколы собраний','Архив писем и материалов партнеров'];
  const PROOF_TYPES={publication:'Публикация',stats:'Скрин статистики',photo:'Фото',video:'Видео',participants:'Список',act:'Акт',folder:'Папка',other:'Другое'};
  const FIN_TYPES={contract:'Договор',invoice:'Счет',act:'Акт / УПД',check:'Чек',payment:'Платежка',folder:'Папка',other:'Другое'};
  const FIN_STATUSES={empty:'не загружено',review:'на проверке',issues:'есть замечания',accepted:'принято'};
  const KEY='kemfest2026_state_v7';

  let S=load();

  function blankBudget(){return{fact:0,docType:'folder',docUrl:'',docAmount:0,taskId:0,checkStatus:'empty'};}
  function defaults(){return{
    tasks:Object.fromEntries(TASKS.map(t=>[t.id,{status:'planned',date:'',result:'',note:''}])),
    proofs:[],people:[],budget:BUDGET.map(blankBudget),docs:DOCS.map(()=>false),
    report:{results:'',risks:''},
    cloud:{driveUrl:'',sheetUrl:'',statsFolderUrl:'',financeFolderUrl:'',appsScriptUrl:''},
    meta:{masterClassesHeld:0},
    history:[]
  };}
  function normalizeProof(p){
    return {
      type:p.type||'publication',
      taskId:+p.taskId||stageToTask(p.stage)||9,
      date:p.date||'',
      platform:p.platform||p.source||'',
      title:p.title||p.result||'',
      url:p.url||p.link||'',
      views:+p.views||0,
      reach:+p.reach||0,
      verified:!!(p.verified||p.screenshot===true||p.screenshot==='yes')
    };
  }
  function stageToTask(s){const n=parseInt(String(s||'').match(/\d+/));return n&&n>=1&&n<=12?n:0;}
  function migrate(raw){
    const d=defaults(),p=raw||{};
    const out={...d,...p,tasks:{...d.tasks,...(p.tasks||{})},report:{...d.report,...(p.report||{})},cloud:{...d.cloud,...(p.cloud||{})},meta:{...d.meta,...(p.meta||{})}};
    out.proofs=(p.proofs||[]).map(normalizeProof).concat((p.publications||[]).map(normalizeProof));
    out.people=(p.people||p.participants||[]).map(x=>({date:x.date||'',taskId:+x.taskId||5,unique:+(x.unique||x.count)||0,repeat:+x.repeat||0,age:x.age!==false,listLink:x.listLink||x.url||''}));
    out.budget=BUDGET.map((_,i)=>({...blankBudget(),...((p.budget||[])[i]||{})}));
    out.docs=DOCS.map((_,i)=>!!((p.docs||[])[i]));
    out.history=(p.history||[]).slice(0,80);
    return out;
  }
  function load(){
    try{
      let raw=localStorage.getItem(KEY);
      if(raw)return migrate(JSON.parse(raw));
      for(const k of ['kemfest2026_state_v6','kemfest2026_state_v5','kemfest2026_state_v4','kemfest2026_state_v3','kemfest2026_state_v2','kemfest2026_state_v1']){
        raw=localStorage.getItem(k);
        if(raw)return migrate(JSON.parse(raw));
      }
      raw=localStorage.getItem('kemfest2026_publications_v1');
      return raw?migrate({proofs:JSON.parse(raw)}):defaults();
    }catch(e){return defaults();}
  }
  function save(action,details){
    syncKpi();
    if(action)S.history=[{at:new Date().toISOString(),action,details:details||''},...(S.history||[])].slice(0,80);
    localStorage.setItem(KEY,JSON.stringify(S));
    renderAll();
  }
  function syncKpi(){
    S.kpi={
      people:S.people.reduce((a,x)=>a+(+x.unique||0),0),
      pubs:S.proofs.filter(x=>x.type==='publication').length,
      views:S.proofs.reduce((a,x)=>a+(+x.views||0),0),
      reach:S.proofs.reduce((a,x)=>a+(+x.reach||0),0)
    };
  }
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function num(n){return new Intl.NumberFormat('ru-RU').format(+n||0);}
  function money(n){return num(n)+' руб.';}
  function pct(a,b){return Math.min(100,Math.round(((+a||0)/(+b||1))*100));}
  function fd(d){return d?new Date(d+'T00:00:00').toLocaleDateString('ru-RU'):'не указано';}
  function left(d){const x=new Date(d+'T00:00:00'),t=new Date();t.setHours(0,0,0,0);return Math.ceil((x-t)/86400000);}
  function taskName(id){const t=TASKS.find(x=>x.id===+id);return t?t.id+'. '+t.title:'не указано';}
  function risk(t){const l=left(t.deadline),done=S.tasks[t.id]?.status==='completed';return done?'выполнено':l<0?'просрочено '+Math.abs(l)+' дн.':l<=14?'скоро: '+l+' дн.':'осталось '+l+' дн.';}
  function proofs(id,type){return S.proofs.filter(p=>+p.taskId===+id&&(!type||p.type===type));}
  function hasProof(id,type){return proofs(id,type).length>0;}
  function hasVerifiedStats(id){return proofs(id).some(p=>p.verified&&(+p.views||+p.reach||p.type==='stats'));}
  function totals(){
    syncKpi();
    const done=TASKS.filter(t=>S.tasks[t.id].status==='completed').length;
    const spent=S.budget.reduce((a,b)=>a+(+b.fact||0),0);
    const docs=S.docs.filter(Boolean).length;
    const budgetDocs=S.budget.filter(b=>b.docUrl||b.docAmount).length;
    const strict=quality().score;
    const overall=Math.round((pct(done,12)+pct(S.kpi.people,480)+pct(S.kpi.pubs,57)+pct(S.kpi.views,69000)+pct(docs,DOCS.length)+pct(budgetDocs,BUDGET.length)+strict)/7);
    return{done,spent,docsPct:pct(docs,DOCS.length),budgetDocs,overall,...S.kpi};
  }
  function budgetIssues(){
    const out=[];
    S.budget.forEach((b,i)=>{
      if((+b.fact||0)>BUDGET[i].plan)out.push(BUDGET[i].name+': факт выше плана');
      if((+b.fact||0)&&!b.docUrl&&!b.docAmount)out.push(BUDGET[i].name+': нет ссылки или суммы по документам');
      if((+b.docAmount||0)&&(+b.fact||0)!==(+b.docAmount||0))out.push(BUDGET[i].name+': факт и документы не совпадают');
      if((+b.fact||0)&&!+b.taskId)out.push(BUDGET[i].name+': нет связи с мероприятием');
    });
    return out;
  }
  function quality(){
    const checks=[];
    const add=(ok,text)=>checks.push({ok,text});
    const d={...S.kpi};
    add(d.people>=480,'Участников не меньше 480');
    add(d.pubs>=57,'Публикаций не меньше 57');
    add(d.views>=69000,'Просмотров не меньше 69 000');
    add((+S.meta.masterClassesHeld||0)>=10,'Проведено не менее 10 мастер-классов');
    add(S.people.filter(p=>+p.taskId===5).reduce((a,p)=>a+(+p.unique||0),0)>=80,'По мастер-классам внесено не менее 80 участников');
    TASKS.forEach(t=>{
      add(S.tasks[t.id].status==='completed',t.id+'. статус выполнено');
      add(!!S.tasks[t.id].date,t.id+'. есть фактическая дата');
      add(!!S.tasks[t.id].result,t.id+'. заполнен результат');
      t.required.forEach(r=>add(hasProof(t.id,r),t.id+'. есть подтверждение: '+(PROOF_TYPES[r]||r)));
      if(t.views)add(hasVerifiedStats(t.id),t.id+'. подтверждена статистика');
      if(t.people)add(S.people.some(p=>+p.taskId===t.id&&(+p.unique||0)>0),t.id+'. внесены участники');
    });
    add(S.docs.every(Boolean),'Отмечен полный комплект документов');
    add(!budgetIssues().length,'Нет замечаний по бюджету');
    add(!!S.cloud.driveUrl,'Указана общая папка Google Drive');
    add(!!S.cloud.sheetUrl,'Указана Google Таблица учета');
    const ok=checks.filter(x=>x.ok).length;
    return{checks,score:pct(ok,checks.length)};
  }
  function issues(){
    const d=totals(),out=[];
    if(d.people<480)out.push('Не хватает участников: '+(480-d.people));
    if(d.pubs<57)out.push('Не хватает публикаций: '+(57-d.pubs));
    if(d.views<69000)out.push('Не хватает просмотров: '+num(69000-d.views));
    if((+S.meta.masterClassesHeld||0)<10)out.push('Не хватает мастер-классов: '+(10-(+S.meta.masterClassesHeld||0)));
    const mc=S.people.filter(p=>+p.taskId===5).reduce((a,p)=>a+(+p.unique||0),0);
    if(mc<80)out.push('По мастер-классам не хватает участников: '+(80-mc));
    TASKS.forEach(t=>{
      if(S.tasks[t.id].status!=='completed')out.push(t.id+'. не закрыт статус мероприятия');
      if(!S.tasks[t.id].date)out.push(t.id+'. нет фактической даты');
      if(!S.tasks[t.id].result)out.push(t.id+'. нет краткого результата');
      t.required.forEach(r=>{if(!hasProof(t.id,r))out.push(t.id+'. нет подтверждения: '+(PROOF_TYPES[r]||r));});
      if(t.views&&!hasVerifiedStats(t.id))out.push(t.id+'. нет подтвержденной статистики просмотров/охвата');
      if(t.people&&!S.people.some(p=>+p.taskId===t.id&&(+p.unique||0)>0))out.push(t.id+'. нет строки участников');
    });
    budgetIssues().forEach(x=>out.push(x));
    if(d.docsPct<100)out.push('Комплект документов отмечен на '+d.docsPct+'%');
    if(!S.cloud.driveUrl)out.push('Не указана общая папка Google Drive');
    if(!S.cloud.sheetUrl)out.push('Не указана Google Таблица учета');
    return out;
  }
  function kpiCard(x){return'<div class="card"><div class="label">'+x[0]+'</div><div class="value">'+x[1]+'</div><div class="small">'+x[2]+'</div><div class="bar"><i style="width:'+x[3]+'%"></i></div></div>';}
  function renderDashboard(){
    const d=totals(),start=new Date('2025-12-01'),end=new Date(PLAN.deadline),today=new Date();
    ring.style.setProperty('--pct',d.overall+'%');
    overallPct.textContent=d.overall+'%';
    daysLeft.textContent=Math.max(0,left(PLAN.deadline));
    timeBar.style.width=Math.round(Math.max(0,Math.min(end-start,today-start))/(end-start)*100)+'%';
    const near=TASKS.filter(t=>S.tasks[t.id].status!=='completed').sort((a,b)=>a.deadline.localeCompare(b.deadline))[0];
    nearest.innerHTML=near?'<b>'+near.id+'. '+esc(near.title)+'</b><br>Срок: '+fd(near.deadline)+' · '+risk(near):'Все мероприятия закрыты.';
    kpis.innerHTML=[
      ['Мероприятия',d.done+'/12','выполнено',pct(d.done,12)],['Участники',d.people+'/480','уникальные',pct(d.people,480)],
      ['Публикации',d.pubs+'/57','из доказательств',pct(d.pubs,57)],['Просмотры',num(d.views)+'/69 000','из доказательств',pct(d.views,69000)],
      ['Мастер-классы',(S.meta.masterClassesHeld||0)+'/10','проведено',pct(S.meta.masterClassesHeld,10)],['Качество',quality().score+'%','строгая проверка',quality().score]
    ].map(kpiCard).join('');
    chart.innerHTML=[['Мероприятия',d.done,12],['Участники',d.people,480],['Публикации',d.pubs,57],['Просмотры',d.views,69000],['Документы',d.docsPct,100],['Бюджет',d.spent,891000],['Качество',quality().score,100]].map(r=>'<div class="chartRow"><b>'+r[0]+'</b><div><div class="bar"><i style="width:'+pct(r[1],r[2])+'%"></i></div><div class="small">'+num(r[1])+' из '+num(r[2])+'</div></div><strong>'+pct(r[1],r[2])+'%</strong></div>').join('');
  }
  function renderPlan(){
    const q=(taskSearch.value||'').toLowerCase(),f=taskFilter.value;
    taskList.innerHTML=TASKS.filter(t=>t.title.toLowerCase().includes(q)&&(f==='all'||(f==='open'&&S.tasks[t.id].status!=='completed')||(f==='risk'&&S.tasks[t.id].status!=='completed'&&left(t.deadline)<=14))).map(t=>{
      const s=S.tasks[t.id],missing=t.required.filter(r=>!hasProof(t.id,r));
      return `<div class="card"><h3>${t.id}. ${esc(t.title)}</h3><span class="pill">Срок: ${fd(t.deadline)}</span><span class="pill">${risk(t)}</span><span class="pill">Доказательств: ${proofs(t.id).length}</span><div class="form"><div class="field"><label>Статус</label><select onchange="setTask(${t.id},'status',this.value)"><option value="planned" ${s.status==='planned'?'selected':''}>Не начато</option><option value="progressing" ${s.status==='progressing'?'selected':''}>В работе</option><option value="completed" ${s.status==='completed'?'selected':''}>Выполнено</option></select></div><div class="field"><label>Фактическая дата</label><input type="date" value="${esc(s.date)}" onchange="setTask(${t.id},'date',this.value)"></div><div class="field full"><label>Краткий результат</label><textarea onchange="setTask(${t.id},'result',this.value)">${esc(s.result)}</textarea></div></div><div class="small">План: участников ${t.people}, публикаций ${t.pubs}, просмотров ${num(t.views)}. Обязательные подтверждения: ${t.required.map(x=>PROOF_TYPES[x]||x).join(', ')}.</div>${missing.length?`<div class="note">Не хватает: ${missing.map(x=>PROOF_TYPES[x]||x).join(', ')}</div>`:''}<button class="btn light" onclick="addProof('folder',${t.id})">Добавить доказательство</button></div>`;
    }).join('');
  }
  function renderProofs(){
    const d=totals(),ok=S.proofs.filter(p=>p.verified).length;
    proofKpis.innerHTML=[
      ['Доказательства',S.proofs.length,'в реестре',pct(S.proofs.length,40)],['Публикации',d.pubs+'/57','автоматически',pct(d.pubs,57)],
      ['Просмотры',num(d.views)+'/69 000','сумма строк',pct(d.views,69000)],['Охват',num(d.reach),'отдельно',pct(d.reach,69000)],
      ['Подтверждено',ok+'/'+S.proofs.length,'скрин/проверка',S.proofs.length?pct(ok,S.proofs.length):0],['Скрины',S.proofs.filter(p=>p.type==='stats').length,'статистика',pct(S.proofs.filter(p=>p.type==='stats').length,12)]
    ].map(kpiCard).join('');
    proofRows.innerHTML=S.proofs.map((r,i)=>`<tr><td><select onchange="proofSet(${i},'type',this.value)">${Object.entries(PROOF_TYPES).map(([k,v])=>`<option value="${k}" ${r.type===k?'selected':''}>${v}</option>`).join('')}</select></td><td><select onchange="proofSet(${i},'taskId',this.value)">${TASKS.map(t=>`<option value="${t.id}" ${+r.taskId===t.id?'selected':''}>${t.id}. ${esc(t.title)}</option>`).join('')}</select></td><td><input type="date" value="${esc(r.date)}" onchange="proofSet(${i},'date',this.value)"></td><td><input value="${esc(r.platform)}" onchange="proofSet(${i},'platform',this.value)"></td><td><textarea class="wide" onchange="proofSet(${i},'title',this.value)">${esc(r.title)}</textarea></td><td><input class="wide" value="${esc(r.url)}" onchange="proofSet(${i},'url',this.value)"></td><td><input class="mini" type="number" min="0" value="${+r.views||0}" onchange="proofSet(${i},'views',this.value)"></td><td><input class="mini" type="number" min="0" value="${+r.reach||0}" onchange="proofSet(${i},'reach',this.value)"></td><td><input type="checkbox" ${r.verified?'checked':''} onchange="proofSet(${i},'verified',this.checked)"></td><td><button class="btn danger" onclick="deleteProof(${i})">Удалить</button></td></tr>`).join('')||'<tr><td colspan="10" class="small">Реестр пуст.</td></tr>';
  }
  function renderPeople(){
    const d=totals(),age=S.people.filter(p=>p.age).reduce((a,p)=>a+(+p.unique||0),0),mc=S.people.filter(p=>+p.taskId===5).reduce((a,p)=>a+(+p.unique||0),0);
    peopleKpis.innerHTML=[
      ['Уникальные',d.people+'/480','из реестра',pct(d.people,480)],['14-25 лет',age,'отмечено',pct(age,480)],
      ['Мастер-классы',mc+'/80','участники этапа',pct(mc,80)],['Проведено',`<input class="mini" type="number" min="0" value="${+S.meta.masterClassesHeld||0}" onchange="setMeta('masterClassesHeld',this.value)">`,'мастер-классов из 10',pct(S.meta.masterClassesHeld,10)],
      ['Списки',S.people.filter(p=>p.listLink).length,'ссылки',pct(S.people.filter(p=>p.listLink).length,S.people.length||1)],['Повторные',S.people.reduce((a,p)=>a+(+p.repeat||0),0),'не входят в план',100]
    ].map(kpiCard).join('');
    peopleRows.innerHTML=S.people.map((r,i)=>`<tr><td><input type="date" value="${esc(r.date)}" onchange="personSet(${i},'date',this.value)"></td><td><select onchange="personSet(${i},'taskId',this.value)">${TASKS.map(t=>`<option value="${t.id}" ${+r.taskId===t.id?'selected':''}>${t.id}. ${esc(t.title)}</option>`).join('')}</select></td><td><input class="mini" type="number" min="0" value="${+r.unique||0}" onchange="personSet(${i},'unique',this.value)"></td><td><input class="mini" type="number" min="0" value="${+r.repeat||0}" onchange="personSet(${i},'repeat',this.value)"></td><td><input type="checkbox" ${r.age?'checked':''} onchange="personSet(${i},'age',this.checked)"></td><td><input class="wide" value="${esc(r.listLink)}" onchange="personSet(${i},'listLink',this.value)"></td><td><button class="btn danger" onclick="deletePerson(${i})">Удалить</button></td></tr>`).join('')||'<tr><td colspan="7" class="small">Добавьте участников.</td></tr>';
  }
  function renderBudget(){
    const d=totals(),acc=S.budget.filter(b=>b.checkStatus==='accepted').length,withDocs=S.budget.filter(b=>b.docUrl||b.docAmount).length,bi=budgetIssues();
    budgetKpis.innerHTML=[
      ['Факт',money(d.spent),'из 891 000 руб.',pct(d.spent,891000)],['Документы',withDocs+'/'+BUDGET.length,'ссылка или сумма',pct(withDocs,BUDGET.length)],
      ['Принято',acc+'/'+BUDGET.length,'проверено',pct(acc,BUDGET.length)],['Замечания',bi.length,'по бюджету',bi.length?100:0],
      ['Без связи',S.budget.filter(b=>(+b.fact||0)&&!+b.taskId).length,'с мероприятием',100],['Превышения',S.budget.filter((b,i)=>(+b.fact||0)>BUDGET[i].plan).length,'по статьям',100]
    ].map(kpiCard).join('');
    budgetRows.innerHTML=BUDGET.map((r,i)=>{const b=S.budget[i];return`<tr><td><b>${esc(r.name)}</b></td><td>${money(r.plan)}</td><td><input class="mini" type="number" min="0" value="${+b.fact||0}" onchange="budgetSet(${i},'fact',this.value)"></td><td><select onchange="budgetSet(${i},'docType',this.value)">${Object.entries(FIN_TYPES).map(([k,v])=>`<option value="${k}" ${b.docType===k?'selected':''}>${v}</option>`).join('')}</select></td><td><input class="wide" value="${esc(b.docUrl)}" onchange="budgetSet(${i},'docUrl',this.value)"></td><td><input class="mini" type="number" min="0" value="${+b.docAmount||0}" onchange="budgetSet(${i},'docAmount',this.value)"></td><td><select onchange="budgetSet(${i},'taskId',this.value)"><option value="0">Не указано</option>${TASKS.map(t=>`<option value="${t.id}" ${+b.taskId===t.id?'selected':''}>${t.id}. ${esc(t.title)}</option>`).join('')}</select></td><td><select onchange="budgetSet(${i},'checkStatus',this.value)">${Object.entries(FIN_STATUSES).map(([k,v])=>`<option value="${k}" ${b.checkStatus===k?'selected':''}>${v}</option>`).join('')}</select></td></tr>`;}).join('');
  }
  function renderDocs(){
    docList.innerHTML=DOCS.map((d,i)=>'<label class="doc"><input type="checkbox" '+(S.docs[i]?'checked':'')+' onchange="docSet('+i+',this.checked)"><span>'+esc(d)+'</span></label>').join('');
  }
  function renderCloud(){
    const fields=[['driveUrl','Общая папка Google Drive'],['sheetUrl','Google Таблица учета'],['statsFolderUrl','Папка скриншотов статистики'],['financeFolderUrl','Папка финансовых документов'],['appsScriptUrl','Apps Script Web App URL']];
    cloudForm.innerHTML=fields.map(([k,label])=>`<div class="field full"><label>${label}</label><input value="${esc(S.cloud[k]||'')}" onchange="cloudSet('${k}',this.value)" placeholder="https://..."></div>`).join('');
  }
  function renderHistory(){
    historyRows.innerHTML=(S.history||[]).map(h=>'<tr><td>'+new Date(h.at).toLocaleString('ru-RU')+'</td><td>'+esc(h.action)+'</td><td>'+esc(h.details)+'</td></tr>').join('')||'<tr><td colspan="3" class="small">История пока пуста.</td></tr>';
  }
  function renderCheck(){
    const d=totals(),q=quality(),fix=issues();
    checkCards.innerHTML=[
      ['Готовность',d.overall+'%','общая оценка',d.overall>=90?'':d.overall>=70?'warn':'bad'],['Качество',q.score+'%','строгая матрица',q.score>=90?'':q.score>=70?'warn':'bad'],
      ['Публикации',d.pubs+'/57','из реестра',d.pubs>=57?'':'bad'],['Просмотры',num(d.views)+'/69 000','из реестра',d.views>=69000?'':'bad'],
      ['Участники',d.people+'/480','из участников',d.people>=480?'':'bad'],['Облако',(S.cloud.driveUrl&&S.cloud.sheetUrl)?'готово':'не готово','Drive + таблица',(S.cloud.driveUrl&&S.cloud.sheetUrl)?'':'warn']
    ].map(x=>'<div class="card checkcard '+x[3]+'"><div class="label">'+x[0]+'</div><div class="value">'+x[1]+'</div><div class="small">'+x[2]+'</div></div>').join('');
    fixList.innerHTML=(fix.length?fix:['Критичных пробелов не найдено. Проверьте смысл отчета вручную.']).slice(0,80).map((x,i)=>'<div class="card checkcard '+(fix.length?'bad':'')+'"><b>'+(i+1)+'. '+esc(x)+'</b></div>').join('');
  }
  function buildReport(){
    const d=totals(),fix=issues();
    const lines=['ОТЧЕТ О РЕАЛИЗАЦИИ ПРОЕКТА ДЛЯ РОСМОЛОДЕЖЬ.ГРАНТЫ','Проект: Исторический фестиваль «КемьФест»','Соглашение: № 091-11-2025-2542','Дата формирования: '+new Date().toLocaleDateString('ru-RU'),'Контрольная дата: 30.11.2026','','1. Сводка','Готовность: '+d.overall+'%. Качество проверки: '+quality().score+'%. Мероприятия: '+d.done+' из 12. Участники: '+d.people+' из 480. Публикации: '+d.pubs+' из 57. Просмотры: '+num(d.views)+' из 69 000. Охват: '+num(d.reach)+'. Бюджет: '+money(d.spent)+' из 891 000 руб.','','2. Автопроверка',fix.length?fix.join('\n'):'Критичных замечаний не найдено.','','3. Ключевые результаты',S.report.results||'Раздел требует заполнения.','','4. Отклонения и риски',S.report.risks||'Существенные отклонения не описаны.','','5. Мероприятия'];
    TASKS.forEach(t=>{const st=S.tasks[t.id],ps=proofs(t.id);lines.push(t.id+'. '+t.title+' - '+(st.status==='completed'?'выполнено':st.status==='progressing'?'в работе':'не начато')+', срок '+fd(t.deadline)+'.');if(st.date)lines.push('Фактическая дата: '+fd(st.date));if(st.result)lines.push('Результат: '+st.result);if(ps.length)lines.push('Доказательства: '+ps.map(p=>(PROOF_TYPES[p.type]||p.type)+': '+(p.url||p.title||'без ссылки')).join('; '));lines.push('План: участников '+t.people+', публикаций '+t.pubs+', просмотров '+num(t.views)+'.');});
    lines.push('','6. Публикации и статистика');
    S.proofs.filter(p=>p.type==='publication'||p.views||p.reach).forEach((p,i)=>lines.push((i+1)+'. '+(p.date||'без даты')+' · '+taskName(p.taskId)+' · '+(p.platform||'площадка')+' · '+(p.title||'без названия')+' · '+(p.url||'нет ссылки')+' · просмотры '+num(p.views)+' · охват '+num(p.reach)+' · подтверждено '+(p.verified?'да':'нет')+'.'));
    lines.push('','7. Участники');
    S.people.forEach((p,i)=>lines.push((i+1)+'. '+(p.date||'без даты')+' · '+taskName(p.taskId)+' · уникальные '+(+p.unique||0)+' · повторные '+(+p.repeat||0)+' · 14-25 '+(p.age?'да':'нет')+' · список '+(p.listLink||'нет ссылки')+'.'));
    lines.push('','8. Бюджет');
    S.budget.forEach((b,i)=>lines.push(BUDGET[i].name+': план '+money(BUDGET[i].plan)+', факт '+money(b.fact)+', документ '+(FIN_TYPES[b.docType]||b.docType)+', сумма '+money(b.docAmount)+', статус '+(FIN_STATUSES[b.checkStatus]||b.checkStatus)+', ссылка '+(b.docUrl||'не указана')+', мероприятие '+(b.taskId?taskName(b.taskId):'не указано')+'.'));
    lines.push('','9. Документы');
    DOCS.forEach((x,i)=>lines.push((S.docs[i]?'[x] ':'[ ] ')+x));
    lines.push('','10. Облачные материалы','Google Drive: '+(S.cloud.driveUrl||'не указан'),'Google Таблица: '+(S.cloud.sheetUrl||'не указана'),'Скриншоты статистики: '+(S.cloud.statsFolderUrl||'не указана'),'Финансовые документы: '+(S.cloud.financeFolderUrl||'не указана'));
    return lines.join('\n');
  }
  function renderReport(){
    const d=totals(),fix=issues();
    reportResults.value=S.report.results||'';
    reportRisks.value=S.report.risks||'';
    summary.innerHTML='Мероприятия: <b>'+d.done+'/12</b><br>Участники: <b>'+d.people+'/480</b><br>Публикации: <b>'+d.pubs+'/57</b><br>Просмотры: <b>'+num(d.views)+'/69 000</b><br>Охват: <b>'+num(d.reach)+'</b><br>Доказательств: <b>'+S.proofs.length+'</b><br>Бюджет: <b>'+money(d.spent)+'</b><br>Замечаний: <b>'+fix.length+'</b>';
    reportText.value=buildReport();
  }
  function renderAll(){syncKpi();renderDashboard();renderPlan();renderProofs();renderPeople();renderBudget();renderDocs();renderCloud();renderHistory();renderCheck();renderReport();}

  window.setTask=(id,k,v)=>{S.tasks[id][k]=v;save('Изменено мероприятие',taskName(id));};
  window.addProof=(type,taskId)=>{S.proofs.push({type:type||'publication',taskId:taskId||9,date:new Date().toISOString().slice(0,10),platform:type==='publication'?'VK':'',title:'',url:'',views:0,reach:0,verified:false});save('Добавлено доказательство',PROOF_TYPES[type]||type||'Доказательство');showTab('proofs');};
  window.proofSet=(i,k,v)=>{S.proofs[i][k]=['views','reach','taskId'].includes(k)?+v||0:k==='verified'?!!v:v;save('Изменено доказательство',S.proofs[i].title||S.proofs[i].url||'строка '+(i+1));};
  window.deleteProof=i=>{S.proofs.splice(i,1);save('Удалено доказательство','строка '+(i+1));};
  window.addPerson=()=>{S.people.push({date:new Date().toISOString().slice(0,10),taskId:5,unique:0,repeat:0,age:true,listLink:''});save('Добавлена строка участников','');};
  window.personSet=(i,k,v)=>{S.people[i][k]=['unique','repeat','taskId'].includes(k)?+v||0:k==='age'?!!v:v;save('Изменены участники',taskName(S.people[i].taskId));};
  window.deletePerson=i=>{S.people.splice(i,1);save('Удалена строка участников','строка '+(i+1));};
  window.budgetSet=(i,k,v)=>{S.budget[i][k]=['fact','docAmount','taskId'].includes(k)?+v||0:v;if((S.budget[i].docUrl||S.budget[i].docAmount)&&S.budget[i].checkStatus==='empty')S.budget[i].checkStatus='review';save('Изменен бюджет',BUDGET[i].name);};
  window.docSet=(i,v)=>{S.docs[i]=!!v;save('Изменены документы',DOCS[i]);};
  window.cloudSet=(k,v)=>{S.cloud[k]=v;save('Изменены облачные настройки',k);};
  window.setMeta=(k,v)=>{S.meta[k]=+v||0;save('Изменен показатель',k);};

  function showTab(id){document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));}
  function copyText(text,msg){if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>alert(msg)).catch(()=>downloadText(text));else downloadText(text);}
  function downloadText(t){const b=new Blob([t],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kemfest-report-check.txt';a.click();URL.revokeObjectURL(a.href);}
  function exportData(){const b=new Blob([JSON.stringify({project:'КемьФест 2026',exportedAt:new Date().toISOString(),state:S},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kemfest-progress-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);save('Сохранена резервная копия','JSON');}
  function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);S=migrate(d.state||d);save('Импортированы данные',f.name);}catch(err){alert('Не удалось прочитать файл');}};r.readAsText(f);}
  function printReport(){const w=window.open('','_blank');if(!w){alert('Разрешите всплывающие окна.');return;}w.document.write('<pre style="font-family:Times New Roman,serif;white-space:pre-wrap;font-size:14px">'+esc(buildReport())+'</pre>');w.document.close();w.focus();setTimeout(()=>w.print(),300);}
  function importLinks(){
    (bulkLinks.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).forEach(line=>{
      const m=line.match(/https?:\/\/\S+/),url=m?m[0]:line;
      if(!S.proofs.some(p=>p.url===url))S.proofs.push({type:'publication',taskId:9,date:new Date().toISOString().slice(0,10),platform:/vk\.com/i.test(url)?'VK':/t\.me/i.test(url)?'Telegram':'Сайт / СМИ',title:line.replace(url,'').trim(),url,views:0,reach:0,verified:false});
    });
    bulkLinks.value='';save('Импортированы ссылки','список ссылок');
  }
  function starterLinks(){
    [[1,'https://vk.com/festivalkemfest','Визуальный стиль'],[2,'https://vk.com/wall-172896504_255','Стартовый пресс-релиз'],[3,'https://vk.com/wall-172896504_257','Подготовка'],[4,'https://vk.com/wall-172896504_258','Историческая информация'],[8,'https://vk.com/wall-172896504_309','Пост о фестивале'],[9,'https://vk.com/wall-172896504_318','Видео ролик'],[11,'https://vk.com/wall-172896504_321','Итоговый пост-релиз']].forEach(x=>{if(!S.proofs.some(p=>p.url===x[1]))S.proofs.push({type:'publication',taskId:x[0],date:'2026-06-25',platform:'VK',title:x[2],url:x[1],views:0,reach:0,verified:false});});
    save('Загружены примерные ссылки проекта','7 ссылок');
  }
  async function sendCloud(){
    if(!S.cloud.appsScriptUrl){cloudStatus.textContent='Сначала укажите Apps Script Web App URL.';return;}
    cloudStatus.textContent='Отправка...';
    try{
      const res=await fetch(S.cloud.appsScriptUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({project:'КемьФест 2026',state:S,report:buildReport()})});
      cloudStatus.textContent=res.ok?'Данные отправлены в Apps Script.':'Apps Script ответил ошибкой: '+res.status;
      save('Отправка в Apps Script',cloudStatus.textContent);
    }catch(e){cloudStatus.textContent='Не удалось отправить. Проверьте URL и доступ Apps Script.';}
  }

  const $=id=>document.getElementById(id);
  document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
  document.querySelectorAll('[data-tab-go]').forEach(b=>b.onclick=()=>showTab(b.dataset.tabGo));
  document.querySelectorAll('[data-add-proof]').forEach(b=>b.onclick=()=>window.addProof(b.dataset.addProof));
  $('taskSearch').oninput=renderPlan;$('taskFilter').onchange=renderPlan;
  $('toggleImportLinks').onclick=()=>$('linkImport').classList.toggle('active');
  $('importLinks').onclick=importLinks;$('starterLinks').onclick=starterLinks;
  $('addPerson').onclick=window.addPerson;
  $('reportResults').oninput=()=>{S.report.results=$('reportResults').value;save('Изменен текст отчета','ключевые результаты');};
  $('reportRisks').oninput=()=>{S.report.risks=$('reportRisks').value;save('Изменен текст отчета','риски и отклонения');};
  $('importBtn').onclick=()=>$('importFile').click();$('importFile').onchange=importData;
  $('exportData').onclick=exportData;
  const copyFullHandler=()=>copyText('Проверь, пожалуйста, отчет проекта КемьФест 2026 для Росмолодежь.Гранты:\n\n'+buildReport(),'Полный отчет скопирован.');
  $('copyFull').onclick=copyFullHandler;$('copyFull2').onclick=copyFullHandler;$('copyCheck').onclick=copyFullHandler;
  $('copyReach').onclick=()=>copyText(buildReport().split('6. Публикации и статистика')[1]||buildReport(),'Проверка просмотров скопирована.');
  $('copyFinance').onclick=()=>copyText('ФИНАНСОВАЯ ПРОВЕРКА\n\n'+budgetIssues().map(x=>'[ ] '+x).join('\n')+'\n\n'+buildReport().split('8. Бюджет')[1],'Финансовая проверка скопирована.');
  $('printReport').onclick=printReport;$('printReport2').onclick=printReport;
  $('resetAll').onclick=()=>{if(confirm('Удалить все локальные данные сайта на этом устройстве?')){S=defaults();save('Сброшены данные','локальное хранилище');}};
  $('clearHistory').onclick=()=>{S.history=[];save();};
  $('copyJson').onclick=()=>copyText(JSON.stringify({project:'КемьФест 2026',state:S},null,2),'JSON скопирован.');
  $('sendCloud').onclick=sendCloud;
  $('openDrive').onclick=()=>{if(S.cloud.driveUrl)window.open(S.cloud.driveUrl,'_blank');else $('cloudStatus').textContent='Сначала укажите ссылку на Google Drive.';};

  renderAll();
})();
