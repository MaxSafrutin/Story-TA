/* Preview chrome never changes crops; page gestures outside the photo editor scroll. */
(()=>{
 if(!window.TitanWorkspace)return;
 const picker=document.createElement('select');picker.id='materialPicker';picker.setAttribute('aria-label','Материал');for(const [key,label]of [['story','Сторис'],['square','Квадраты · 9 кадров'],['cover','Обложка'],['formats','Другие размеры'],['avito','Авито'],['client','Покупка'],['reviews','Отзывы'],['proof','Пруфы · финальная сторис']])picker.add(new Option(label,key));$('materialCatalogue').prepend(picker);picker.onchange=e=>TitanWorkspace.showMaterial(e.target.value);window.addEventListener('titan-material-selected',()=>picker.value=TitanWorkspace.snapshot().material);
 // The persistent preview is editable from every settings tab.
 let count=0;
 function compact(root=document){for(let field of [...root.querySelectorAll('.field,.control-field')]){
   if(field.classList.contains('compact-field'))continue;const control=field.querySelector(':scope>input:not([type=checkbox]):not([type=file]),:scope>textarea,:scope>select'),title=field.querySelector(':scope>span');if(!control||!title)continue;
   const toggle=title.querySelector('input[type=checkbox]'),text=[...title.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()||title.textContent.trim();title.querySelector('.field-toggle')?.remove();title.className='compact-label';title.id='compact-label-'+(++count);control.setAttribute('aria-labelledby',title.id);control.setAttribute('aria-label',text);control.title=text;if(!['range','color'].includes(control.type))control.placeholder=text;if(!control.id)control.id='compact-control-'+count;field.classList.add('field','compact-field');
   if(toggle){const l=document.createElement('label');l.className='visibility-toggle';toggle.setAttribute('aria-label','Показывать '+text);l.append(toggle);field.append(l)}else field.classList.add('no-visibility');
  }}
 compact();window.TitanCompactFields={refresh:compact};for(const type of ['input','change'])document.addEventListener(type,()=>TitanWorkspace.refresh());
})();
