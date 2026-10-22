/* Size the actual source canvas to the available pane; no platform imitation. */
(()=>{
 if(!window.TitanWorkspace)return;
 const frame=$('previewFrame'),surface=$('previewSurface'),aside=$('persistentPreview');
 const controls=document.createElement('div');controls.id='previewSelectors';$('previewMode').after(controls);controls.append($('previewMode'));
 const enlarge=document.createElement('button');enlarge.id='previewEnlarge';enlarge.className='button secondary';enlarge.textContent='Увеличить';controls.append(enlarge);enlarge.onclick=()=>{const on=aside.classList.toggle('preview-expanded');enlarge.textContent=on?'Закрыть увеличенный вид':'Увеличить';enlarge.setAttribute('aria-expanded',String(on));fit()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&aside.classList.contains('preview-expanded'))enlarge.click()});
 const notice=document.createElement('div');notice.id='previewSourceNotice';notice.innerHTML='<span></span><button class="button secondary">Выбрать фото</button>';notice.hidden=true;$('previewHint').before(notice);
 notice.lastElementChild.onclick=()=>{const m=TitanWorkspace.snapshot().material;TitanWorkspace.step('materials');TitanEditorTabs.select('photo');TitanWorkspace.mobileView('settings');if(m==='cover')$('coverPrimaryPhoto').focus();else{const panel=$('formatPhotoSelection').closest('details');panel.open=true;panel.scrollIntoView({block:'nearest'});panel.querySelector('input')?.focus()}};
 function sourceNotice(){const m=TitanWorkspace.snapshot().material,missing=state.photos.length&&(m==='cover'?TitanCoverProject.index()<0:['formats','avito'].includes(m)?!TitanFormats.selectedIndices().length:false);notice.hidden=!missing;if(missing)notice.firstElementChild.textContent='Фото в проекте есть. Выберите снимок для этого материала.'}
 let fitting=false;
 function fit(){if(fitting||!frame.getBoundingClientRect().width)return;fitting=true;try{const ui=TitanWorkspace.snapshot(),m=ui.material,c=[...surface.querySelectorAll('canvas')].find(c=>c.getBoundingClientRect().width>0),square=m==='square';if(!c)return;const ratio=square?1:c.width/c.height,phone=false,desktop=innerWidth>900;
  const a=aside.getBoundingClientRect();let height=desktop?a.height:Math.min(innerHeight*.64,680),width=a.width-4;
  if(desktop){const siblings=[...aside.children].filter(n=>n!==frame&&!n.hidden&&getComputedStyle(n).display!=='none'),used=siblings.reduce((sum,n)=>sum+n.getBoundingClientRect().height,0)+(siblings.length+1)*6;height=Math.max(90,height-used-8)}
  if(aside.classList.contains('preview-expanded')&&!desktop)height=Math.max(150,innerHeight-230);
  const border=phone?16:0;let w=Math.min(width,Math.max(40,height-border)*ratio+border),h=(w-border)/ratio+border;frame.style.width=Math.max(80,w)+'px';frame.style.height=Math.max(80,h)+'px';frame.style.aspectRatio=String(ratio);frame.classList.toggle('wide-preview',ratio>1);
  if(phone){frame.style.width=Math.max(80,w)+'px';frame.style.height=Math.max(80,h)+'px'}sourceNotice();
 }finally{fitting=false}}
 const oldMode=TitanWorkspace.previewMode,oldRefresh=TitanWorkspace.refresh;TitanWorkspace.previewMode=value=>{oldMode(value);fit()};TitanWorkspace.refresh=()=>{oldRefresh();requestAnimationFrame(fit)};
 $('previewMode').addEventListener('click',()=>{TitanSafety.storage.set('titan-preview-device',TitanWorkspace.snapshot().previewMode);fit()});
 const previous=draw;draw=function(){previous();requestAnimationFrame(fit)};new ResizeObserver(()=>requestAnimationFrame(fit)).observe(aside);window.addEventListener('resize',fit);window.addEventListener('titan-material-selected',()=>requestAnimationFrame(fit));window.addEventListener('titan-media-change',()=>requestAnimationFrame(fit));
 $('previewMode').hidden=true;TitanWorkspace.previewMode('pc');
 window.TitanSimplePreview={fit};fit();
})();
