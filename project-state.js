/* One source of vehicle data. Existing DOM-based generators use bound adapters. */
(()=>{
 const editor={},controls=new Map(),materialOptions={};
 const ids=[...fields,...settingFields,...checkboxFields,...toggleFields.map(toggleId)];
 function changed(){window.dispatchEvent(new Event('titan-project-change'))}
 function bind(id){const input=$(id);if(!input||controls.has(id))return;
  const prop=input.type==='checkbox'?'checked':'value',proto=input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:input instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype,descriptor=Object.getOwnPropertyDescriptor(proto,prop);
  editor[id]=descriptor.get.call(input);controls.set(id,{input,descriptor,prop});
  Object.defineProperty(input,prop,{configurable:true,get(){return editor[id]},set(v){const old=editor[id];descriptor.set.call(this,v);editor[id]=descriptor.get.call(this);if(old!==editor[id])changed()}});
  for(const event of ['input','change'])input.addEventListener(event,()=>{editor[id]=descriptor.get.call(input);changed()},true);
 }
 ids.forEach(bind);TitanSafety.captureEditorRules();
 const previousCollect=collectEditorData;
 collectEditorData=()=>({...editor});
 const originalBuild=buildProjectData;
 function texts(){const result={clientShowModel:$('clientShowModel').checked};for(const id of specialFields)result[id]=$(id).value;return result}
 function specialSnapshot(){return {texts:texts(),photos:Object.fromEntries(Object.entries(state.specialPhotos).map(([m,ps])=>[m,ps.map(photoData)]))}}
 function snapshot(){return {version:4,editor:collectEditorData(),materialOptions:structuredClone(materialOptions),photos:state.photos.map(photoData),storySlots:state.storySlots? [...state.storySlots]:undefined,squareSlots:state.squareSlots?[...state.squareSlots]:undefined,formats:TitanFormats.snapshot(),square:TitanSquareProject.export(),cover:TitanCoverProject.export(),special:specialSnapshot(),page:state.page,slot:state.slot,contentMode:state.contentMode,projectId:state.projectId,workspace:window.TitanWorkspace?.snapshot()}}
 function releaseSpecial(){for(const ps of Object.values(state.specialPhotos))ps.forEach(p=>URL.revokeObjectURL(p.url))}
 function applySpecial(text,photos){$('clientFormat').value=text.clientFormat==='square'?'square':'story';for(const id of specialFields)if(text[id]!=null)$(id).value=TitanSafety.text(text[id],$(id).maxLength>0?$(id).maxLength:2000);if(typeof text.clientShowModel==='boolean')$('clientShowModel').checked=text.clientShowModel;releaseSpecial();state.specialPhotos=photos;for(const m of ['client','reviews','proof'])renderSpecialPhotos(m)}
 buildProjectData=async()=>{const data=await originalBuild();data.version=4;data.special={texts:texts(),photos:{}};
  for(const [m,photos]of Object.entries(state.specialPhotos))data.special.photos[m]=await Promise.all(photos.map(async p=>({name:p.file.name,dataUrl:await fileToDataUrl(p.file),single:{...p.single},collage:{...p.collage}})));
  data.storySlots=state.storySlots?[...state.storySlots]:undefined;data.squareSlots=state.squareSlots?[...state.squareSlots]:undefined;data.workspace=window.TitanWorkspace?.snapshot();data.materialOptions=structuredClone(materialOptions);return data;
 };
 const previousPrepare=TitanFormats.prepareProject,previousCommit=TitanFormats.commitProject;
 TitanFormats.prepareProject=async data=>{
  const extras=await previousPrepare(data),special={client:[],reviews:[],proof:[]};
  try{if(data.special)for(const m of Object.keys(special))for(const p of data.special.photos[m])special[m].push(await photoFromProject(p,null));return {...extras,special}}
  catch(e){Object.values(special).flat().forEach(p=>URL.revokeObjectURL(p.url));throw e}
 };
 function applyOptions(value={}){for(const k of Object.keys(materialOptions))delete materialOptions[k];Object.assign(materialOptions,value)}
 TitanFormats.commitProject=async(data,prepared)=>{state.storySlots=Array.isArray(data.storySlots)?[...data.storySlots]:null;state.squareSlots=Array.isArray(data.squareSlots)?[...data.squareSlots]:null;applyOptions(data.materialOptions);await previousCommit(data,prepared);if(data.special){applySpecial(data.special.texts,prepared.special);saveSpecial()}if(data.workspace)window.TitanWorkspace?.restore(data.workspace);};
 async function restore(record){
  if(!record||!TitanSafety.record(record.editor))throw Error('Повреждённое локальное сохранение');
  const checkedEditor=TitanSafety.editor(record.editor,record.formats?.stamp),extras=await previousPrepare(record),special={client:[],reviews:[],proof:[]};let photos=[];
  try{photos=await hydratePhotos(record.photos);for(const m of Object.keys(special))special[m]=await hydratePhotos(record.special?.photos?.[m]||[])}
  catch(e){photos.forEach(p=>URL.revokeObjectURL(p.url));Object.values(special).flat().forEach(p=>URL.revokeObjectURL(p.url));throw e}
  releaseCurrentPhotos();state.photos=photos;state.storySlots=Array.isArray(record.storySlots)?record.storySlots.slice(0,15):null;state.squareSlots=Array.isArray(record.squareSlots)?record.squareSlots.slice(0,15):null;applyOptions(record.materialOptions);applyEditorData({...state.defaultEditor,...checkedEditor});await previousCommit(record,extras);
  applySpecial(record.special?.texts||texts(),special);state.contentMode=['vehicle','client','reviews','proof'].includes(record.contentMode)?record.contentMode:'vehicle';
  syncContentModeUi();state.page=Math.min(record.page||0,pages()-1);state.slot=Math.min(record.slot||0,Math.max(0,photos.length-1));state.projectId=record.projectId||null;renderThumbs();draw();
  if(record.workspace)window.TitanWorkspace?.restore(record.workspace);
 }
 const previousRecord=currentBatchRecord;currentBatchRecord=(...args)=>({...snapshot(),...previousRecord(...args)});
 const previousLoad=loadBatchRecord;loadBatchRecord=async(record,active=true)=>{if(!record)return;await restore(record);state.projectId=null;state.projectDir=null;if(active){state.batchActiveId=record.id;TitanSafety.storage.set('titan-batch-active',record.id)}state.batchDirty=false;};
 window.TitanProject={editor,materialOptions,snapshot,restore,texts,bind,changed};
})();
