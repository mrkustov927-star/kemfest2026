(function(){
  const tasks=[
    [1,'Визуальный стиль проекта','2026-01-31','Подтвердить наличие макетов, логотипа и публикации о стиле.'],
    [2,'Стартовые пресс-релизы','2026-02-28','Собрать ссылки на 5 публикаций и скриншоты статистики.'],
    [3,'Общеорганизационная подготовка','2026-06-30','Закрыть договоры, акты, протоколы и папку организационных материалов.'],
    [4,'Историческая информация','2026-02-28','Зафиксировать источники, тексты и согласования.'],
    [5,'Мастер-классы по костюмам','2026-05-31','Проверить 10+ мастер-классов, 80 участников 14-25 лет, списки, фото и видео.'],
    [6,'Запись и монтаж видеороликов','2026-05-31','Проверить договор, акт, исходники и готовые видеоролики.'],
    [7,'Подготовка фестиваля','2026-06-06','Собрать программу, закупки, анонсы и подтверждающие документы.'],
    [8,'Проведение фестиваля «КемьФест»','2026-06-07','Собрать фото, видео, списки участников, публикации и статистику.'],
    [9,'Размещение и распространение видеороликов','2026-11-30','Продолжать публикации роликов, довести статистику до плановых показателей.'],
    [10,'Итоговое собрание команды','2026-06-15','Оформить протокол, список присутствующих и выводы.'],
    [11,'Итоговые пост-релизы','2026-06-30','Выпустить и подтвердить 5 итоговых публикаций со статистикой.'],
    [12,'Аналитическая и финансовая отчетность','2026-11-30','Собрать аналитический отчет, финансовый отчет и полный реестр документов.']
  ];
  const today=new Date();
  today.setHours(0,0,0,0);
  const fmt=new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'});
  const daysLeft=date=>{
    const d=new Date(date+'T00:00:00');
    return Math.ceil((d-today)/86400000);
  };
  const statusFor=left=>left<0?'Просрочено':left<=14?'Срочно':'В плане';
  const clsFor=left=>left<0?'bad':left<=14?'warn':'';
  const near=tasks.map(t=>({id:t[0],title:t[1],date:t[2],hint:t[3],left:daysLeft(t[2])})).sort((a,b)=>Math.abs(a.left)-Math.abs(b.left));
  const deadline=document.getElementById('teamDeadline');
  if(deadline){
    const finalLeft=daysLeft('2026-11-30');
    deadline.textContent=finalLeft>=0?finalLeft+' дней до финального срока':'финальный срок прошел';
  }
  const urgent=document.getElementById('urgentList');
  if(urgent){
    urgent.innerHTML=near.slice(0,4).map(t=>`<div class="teamItem ${clsFor(t.left)}"><div><b>${t.id}. ${t.title}</b><span>${fmt.format(new Date(t.date+'T00:00:00'))} · ${statusFor(t.left)}</span></div><p>${t.hint}</p></div>`).join('');
  }
  const plan=document.getElementById('teamPlan');
  if(plan){
    plan.innerHTML=tasks.map(t=>{
      const left=daysLeft(t[2]);
      return `<article class="teamTask ${clsFor(left)}"><div class="teamTaskTop"><span>${t[0]}</span><b>${fmt.format(new Date(t[2]+'T00:00:00'))}</b></div><h3>${t[1]}</h3><p>${t[3]}</p><small>${statusFor(left)}${left>=0?' · осталось '+left+' дн.':' · просрочено '+Math.abs(left)+' дн.'}</small></article>`;
    }).join('');
  }
})();
