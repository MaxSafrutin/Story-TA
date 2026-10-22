/* Consolidated project operations; legacy readers stay available on demand. */
(()=>{
 if(!window.TitanWorkspace)return;
 const bin=$('legacyUiBin');
 for(const id of ['coverJPG','formatJPG'])if($(id))bin.append($(id));
 if($('coverQuality'))bin.append($('coverQuality').closest('label'));
 // The full project contains the cover and all photos; its former cover-only save is redundant.
 if($('coverProject'))bin.append($('coverProject'));
 $('coverTemplate').textContent='Сохранить шаблон обложки';$('coverOpenTemplate').closest('label').firstChild.textContent='Открыть шаблон обложки';
 bin.append($('coverProjectFiles'));
 const coverHelp=$('coverProjectFiles').querySelector('.square-help');if(coverHelp)coverHelp.textContent='Шаблон переносит оформление без фотографий. Для сохранения всех фотографий используйте «Сохранить проект».';
 for(const id of ['materialProjectFiles','archiveManagement','projectResetActions'])$(id).hidden=true;
 $('projectManagement').querySelector('strong').textContent='Открыть автомобиль из старого архива';
 const actions=$('projectFileActions').querySelector('.square-actions');actions.classList.add('project-icon-actions');
 const icons={save:'<path d="M4 3h13l4 4v14H3V3h1Zm3 0v6h10V3M7 21v-8h10v8"/>',open:'<path d="M3 7V4h7l3 3h8v4M3 7h7l3 3h9l-3 11H3V7Z"/>',clear:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>'};
 function icon(node,name,title){node.title=title;node.setAttribute('aria-label',title);node.classList.add('project-icon');const input=node.querySelector('input');node.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';if(input)node.append(input)}
 icon($('exportFullJSON'),'save','Сохранить проект');icon($('exportOpenJSON').closest('label'),'open','Открыть проект');icon($('resetBtn'),'clear','Очистить текущий проект');
 const empty=TitanProject.snapshot();let saved=null;
 const signature=()=>JSON.stringify(TitanProject.snapshot(),(k,v)=>['workspace','page','slot','projectId'].includes(k)?undefined:k==='file'?{name:v.name,size:v.size,lastModified:v.lastModified}:v);
 const oldTrigger=triggerDownload;triggerDownload=function(blob,name){oldTrigger(blob,name);if(blob.type==='application/json'){const fingerprint=signature();blob.text().then(text=>{try{if(JSON.parse(text).schema==='titan-auto-story-project')saved=fingerprint}catch{}})}};
 const oldLoad=loadProjectData;loadProjectData=async function(...args){await oldLoad(...args);saved=signature()};
 $('resetBtn').onclick=async()=>{if(state.photoBusy||state.archiveBusy||state.exporting)return toast('Дождитесь завершения текущей операции');if(signature()!==saved&&!confirm('Очистить текущий проект? Несохранённые данные и фотографии будут потеряны. Сохранённые файлы останутся.'))return;
  const previous=TitanProject.snapshot();try{const next=structuredClone(empty);next.editor={...collectEditorData()};for(const id of ['sourceText','model','trim','year','mileage','volume','fuel','drive','gearbox','power','price','salePrice','features'])next.editor[id]=state.defaultEditor[id]||'';
   for(const id of ['soldMode','statusTextCustom','reservedStatusCustom','soldStatusCustom'])next.editor[id]=false;
   next.editor.saleStatus='available';next.editor.holidayDecor=false;next.editor.holidayChoice='auto';next.photos=[];next.storySlots=null;next.squareSlots=null;next.projectId=null;next.materialOptions={};next.contentMode='vehicle';next.page=next.slot=0;next.special.photos={client:[],reviews:[],proof:[]};delete next.workspace;
   await TitanProject.restore(next);state.projectDir=null;state.projectId=null;state.workMode='single';state.batchActiveId=null;save();saveSpecial();TitanWorkspace.step('project');await TitanAutosave.flush();saved=signature();toast('Текущий проект очищен');
  }catch(e){await TitanProject.restore(previous);toast('Очистка не выполнена: '+e.message)}};
 window.TitanProjectFiles={markSaved(){saved=signature()}};
 TitanProjectReady.then(()=>{if(!state.photos.length&&!$('model').value)saved=signature()});
})();
