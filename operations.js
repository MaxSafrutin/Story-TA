/* Keep imports, photo processing and exports exclusive, including keyboard edits. */
(() => {
  const overlay=document.createElement('div');overlay.id='operationLock';overlay.hidden=true;
  overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
  const message=document.createElement('strong');overlay.append(message);document.body.append(overlay);
  const warning=document.createElement('div');warning.id='storageWarning';warning.hidden=true;
  warning.textContent='Браузер не сохранил настройки локально. Скачайте JSON проекта перед закрытием.';
  warning.setAttribute('role','status');document.querySelector('.topbar').after(warning);
  const style=document.createElement('style');style.textContent=`
    #operationLock[hidden],#storageWarning[hidden]{display:none!important}
    #operationLock{position:fixed;inset:0;z-index:10000;background:#080a0ddd;display:grid;place-items:center;padding:24px;color:#fff;backdrop-filter:blur(3px);cursor:progress}
    #operationLock strong{font:700 18px Inter,Arial;text-align:center;max-width:500px}
    #storageWarning{position:fixed;bottom:0;left:0;right:0;z-index:1000;background:#482c12;color:#ffe6bd;padding:12px 24px;font:600 13px Inter,Arial}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition:none!important}}
  `;document.head.append(style);
  function update(){
    const busy=state.photoBusy||state.archiveBusy||state.exporting||state.batchBusy;
    overlay.hidden=!busy;document.body.setAttribute('aria-busy',String(busy));
    message.textContent=state.photoBusy?'Обрабатываю фотографии…':state.exporting?'Готовлю изображения и архив…':state.batchBusy?'Сохраняю и открываю подборку…':'Проверяю и сохраняю проект…';
    for(const element of document.querySelectorAll('#workflowShell,.workspace,.square-workspace,.cover-editor,.topbar'))element.inert=busy;
  }
  for(const key of ['photoBusy','archiveBusy','exporting','batchBusy']){
    let value=state[key];Object.defineProperty(state,key,{configurable:true,enumerable:true,get:()=>value,set(next){value=!!next;update();if(!value)window.dispatchEvent(new Event('titan-operation-end'))}});
  }
  window.addEventListener('titan-storage-error',()=>warning.hidden=false);
  // A browser may suspend pointer delivery when an editor becomes inert.
  window.addEventListener('blur',()=>{state.pointers.clear();state.drag=state.pinch=null});
  update();
})();
