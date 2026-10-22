/* Switch settings without moving or replacing the active preview. */
(()=>{
 if(!window.TitanWorkspace)return;
 const nav=$('materialEditorTabs');nav.innerHTML=[['vehicle','Автомобиль'],['photo','Фото'],['design','Дизайн']].map(([key,label])=>`<button class="button secondary" data-editor-tab="${key}">${label}</button>`).join('');
 let current='vehicle';const groups=[];
 function group(element,kind){if(element){groups.push({element,kind,hidden:element.hidden});element.dataset.editorGroup=kind}}
 for(const child of [...$('vehicleEditor').children])group(child,'photo');
 const cropReset=document.createElement('button');cropReset.id='storyCropReset';cropReset.className='button secondary';cropReset.textContent='Сбросить кадрирование выбранного фото';cropReset.onclick=()=>{const t=state.page>0?state.photos[state.page]?.single:state.photos[state.slot]?.collage;if(t){Object.assign(t,{x:0,y:0,zoom:1});save();draw()}};$('vehicleEditor').append(cropReset);group(cropReset,'photo');
 const photoLink=document.createElement('button');photoLink.id='manageProjectPhotos';photoLink.className='button secondary';photoLink.textContent='Фотографии проекта';photoLink.onclick=()=>TitanWorkspace.projectTab('photo');nav.after(photoLink);
 const localHeading=document.createElement('h2');localHeading.textContent='Оформление текущего материала';$('materialEditorHost').before(localHeading);
 const noPhoto=document.createElement('p');noPhoto.textContent='Финальная сторис создаётся без фотографии. Тексты и пять вариантов оформления находятся во вкладке «Дизайн».';$('materialEditorHost').prepend(noPhoto);
 for(const child of [...document.querySelector('.square-controls').children]){
  const title=child.querySelector('summary')?.textContent||'';
  if(child.matches('.eyebrow,h2,.square-help')){child.hidden=true;continue}
  if(child.contains($('squareZip'))||child.contains($('squareSave'))){child.dataset.projectOperation='square';child.hidden=true;continue}
  group(child,child.classList.contains('shared-photo-section')||child.id==='squareParts'||child.contains($('squareZoom'))||title.startsWith('Фото')?'photo':'design');
 }
 // Keep custom logos accessible although the old duplicate vehicle panel is hidden.
 const logo=$('squareLogoEnabled').parentElement.parentElement;document.querySelector('.square-controls').append(logo);group(logo,'design');
 const cover=$('coverEditor');cover.querySelector('.eyebrow').hidden=true;cover.querySelector('h2').hidden=true;
 cover.querySelector('[data-cover-section="1"]').hidden=false;cover.querySelector('[data-cover-section="2"]').hidden=false;group(cover.querySelector('[data-cover-section="1"]'),'photo');group(cover.querySelector('[data-cover-section="2"]'),'design');cover.querySelector('[data-cover-section="0"]').hidden=true;cover.querySelector('[data-cover-section="3"]').hidden=true;
 const formats=$('formatsEditor');for(const child of [...formats.querySelector('.cover-controls').children]){
  if(child.matches('.eyebrow,h2')||child.id==='sharedFields'||child.contains($('formatZIP'))){child.hidden=true;continue}
  if(child.id==='formatChoices'){group(child,'both');continue}
  if(child.contains($('formatText'))){group(child,'design');continue}
  if(child.contains($('allPrice'))||child.contains($('stampSale'))||child.contains($('stampReserved'))){child.hidden=true;continue}
  group(child,'photo');
 }
 for(const intro of document.querySelectorAll('.editor-intro'))intro.hidden=true;
 for(const mode of ['client','reviews','proof']){
  const editor=document.querySelector(`[data-story-editor="${mode}"]`),body=mode==='proof'?$('proofServiceSettings'):editor;
  for(const child of [...body.children]){
   if(child.classList.contains('editor-intro')){child.hidden=true;continue}
   group(child,child.id==='clientFormatField'?'both':child.querySelector('input[type=file]')||child.matches('.special-photo-list')?'photo':'design');
  }
 }
 group($('finalStorySettings'),'design');
 const holiday=$('holidaySettings');$('materialEditorTabs').after(holiday);group(holiday,'design');
 const proofPicker=$('proofFinalTab').parentElement;nav.before(proofPicker);
 function sync(){const m=TitanWorkspace.snapshot().material;const inMaterials=TitanWorkspace.snapshot().stage==='materials';
  const special=['client','reviews','proof'].includes(m),final=m==='proof'&&state.proofDesign==='final';
  if(special&&current==='vehicle'||final&&current==='photo')current='design';
  nav.querySelector('[data-editor-tab="vehicle"]').hidden=special;
  nav.querySelector('[data-editor-tab="photo"]').hidden=final;
  $('globalMaterialStyle').hidden=current!=='design'||!['story','cover','formats','avito'].includes(m);localHeading.hidden=current!=='design';$('materialVehicleSettings').hidden=current!=='vehicle';$('materialEditorHost').hidden=current==='vehicle';photoLink.hidden=current!=='photo'||special;proofPicker.hidden=m!=='proof';noPhoto.hidden=!(final&&current==='photo');
  for(const g of groups){if(g.element.closest('#projectManagement,#stepExport'))continue;if(g.element.id==='squareParts')g.element.hidden=current!=='photo'||[...$('squareWall').children].findIndex(b=>b.classList.contains('active'))<7;
   else if(g.element.id==='formatChoices')g.element.hidden=m==='avito'||current==='vehicle';
   else if(g.element.id==='finalStorySettings')g.element.hidden=current!=='design'||state.proofDesign!=='final';
   else g.element.hidden=g.hidden||(g.kind!=='both'&&g.kind!==current)||(g.kind==='both'&&current==='vehicle');}
  if(m==='proof')$('proofServiceSettings').hidden=state.proofDesign==='final';
  for(const b of nav.children){const on=b.dataset.editorTab===current;b.className='button '+(on?'primary':'secondary');b.setAttribute('aria-selected',String(on))}
  document.body.classList.toggle('editing-photo',inMaterials);
  localHeading.hidden=current!=='design'||m==='story';
  cropReset.disabled=!state.photos.length;
  window.TitanMaterialVisibility?.sync();
 }
 function select(value){$('settingsColumn').scrollTop=0;current=value==='content'?'vehicle':['vehicle','photo','design'].includes(value)?value:'vehicle';sync();TitanAutosave.schedule()}
 for(const b of nav.children)b.onclick=()=>select(b.dataset.editorTab);
 window.addEventListener('titan-material-selected',sync);const old=draw;draw=function(){old();sync()};
 window.TitanEditorTabs={select,sync,snapshot:()=>current};sync();
})();
