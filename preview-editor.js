/* Gestures operate on existing crops; overlays and platform chrome never export. */
(()=>{
 if(!window.TitanWorkspace)return;
 const surface=$('previewSurface'),frame=$('previewFrame'),points=new Map(),history=[];
 let gesture=null,timer=null,armed=false;
 const tools=document.createElement('div');tools.id='previewEditTools';tools.innerHTML='<button id="previewSwap" class="button secondary" disabled>↔ Переставить фото</button><button id="previewUndo" class="button secondary" disabled>Отменить</button>';$('previewHint').before(tools);tools.append($('previewEnlarge'));
 const mark=document.createElement('div');mark.className='preview-cell-mark';const targetMark=document.createElement('div');targetMark.className='preview-cell-mark drop';frame.append(mark,targetMark);
 const input=document.createElement('input');input.id='previewPhotoFile';input.type='file';input.accept='image/*,.heic,.heif';input.hidden=true;document.body.append(input);let empty=null;
 function material(){return TitanWorkspace.snapshot().material}
 function cells(c){const m=material();if(m==='story'&&state.contentMode==='vehicle')return collageRects().map((r,i)=>{const source=state.storySlots?state.photos.findIndex(p=>p.id===state.storySlots[i]):i;return{...r,slot:i,source,crop:state.photos[source]?.collage,unit:'pixels',c,select(){state.slot=source},render:draw}});
  if(m==='square')return TitanSquareProject.previewCells(c).map(r=>({...r,c,unit:'overflow'}));
  if(m==='cover')return TitanCoverProject.previewCells().map(r=>({...r,c,unit:'overflow'}));
  if(['formats','avito'].includes(m))return TitanFormats.previewCells().map(r=>({...r,c,unit:'half'}));return null}
 function hit(c,e){const list=cells(c);if(!list)return null;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/r.width,y=(e.clientY-r.top)*c.height/r.height;return list.find(v=>x>=v.x&&x<v.x+v.w&&y>=v.y&&y<v.y+v.h)||null}
 function hitAnywhere(e){for(const c of surface.querySelectorAll('canvas')){const r=c.getBoundingClientRect();if(r.width&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){const cell=hit(c,e);if(cell)return cell}}return null}
 function paint(node,cell){node.hidden=!cell;if(!cell)return;const r=cell.c.getBoundingClientRect(),f=frame.getBoundingClientRect(),k=r.width/cell.c.width;Object.assign(node.style,{left:r.left-f.left+cell.x*k+'px',top:r.top-f.top+cell.y*k+'px',width:cell.w*k+'px',height:cell.h*k+'px'})}
 function clear(){clearTimeout(timer);timer=null;points.clear();gesture=null;armed=false;mark.hidden=targetMark.hidden=true;frame.classList.remove('photo-grabbed');$('previewSwap').classList.remove('primary');$('previewHint').textContent='Фото: двигайте кадр; колесо/pinch — масштаб; ручка ↔ — перестановка.';state.pointers.clear();state.drag=state.pinch=null}
 function notify(){save();renderThumbs();draw();TitanAutosave.schedule();$('previewUndo').disabled=!history.length}
 function remember(action){history.push(action);if(history.length>30)history.shift();$('previewUndo').disabled=false}
 function factors(cell,zoom=cell.crop.zoom){if(cell.unit==='pixels')return {x:1,y:1};if(cell.unit==='half')return{x:cell.w/2,y:cell.h/2};const p=state.photos[cell.source];if(!p)return{x:1,y:1};const k=(cell.crop.fit==='contain'?Math.min(cell.w/p.img.width,cell.h/p.img.height):Math.max(cell.w/p.img.width,cell.h/p.img.height))*zoom;return{x:Math.max(1,(p.img.width*k-cell.w)/2),y:Math.max(1,(p.img.height*k-cell.h)/2)}}
 function clamp(cell,value,axis='x',zoom=cell.crop.zoom){let limit=1;if(cell.unit==='pixels'){const photo=state.photos[cell.source];if(!photo)return value;const k=Math.max(cell.w/photo.img.width,cell.h/photo.img.height)*zoom;limit=Math.max(0,((axis==='x'?photo.img.width:photo.img.height)*k-(axis==='x'?cell.w:cell.h))/2)}return Math.max(-limit,Math.min(limit,value))}
 function coords(cell,e){const r=cell.c.getBoundingClientRect();return{x:(e.clientX-r.left)*cell.c.width/r.width-cell.x-cell.w/2,y:(e.clientY-r.top)*cell.c.height/r.height-cell.y-cell.h/2}}
 function zoomAt(cell,next,e){const t=cell.crop,prev=t.zoom,a=coords(cell,e),f=factors(cell,prev),nf=factors(cell,next),k=next/prev;t.x=clamp(cell,((t.x*f.x-a.x)*k+a.x)/nf.x,'x',next);t.y=clamp(cell,((t.y*f.y-a.y)*k+a.y)/nf.y,'y',next);t.zoom=next}
 function beginSwap(){if(!gesture?.cell||points.size>1)return;gesture.swapping=true;gesture.changed=false;Object.assign(gesture.cell.crop,gesture.before);gesture.cell.render();frame.classList.add('photo-grabbed');paint(mark,gesture.cell);mark.textContent='↔ Перенесите в другую ячейку';$('previewHint').textContent='Фото захвачено. Отпустите над другой ячейкой. Esc — отмена.'}
 function editable(cell){return cell&&state.photos[cell.source]&&cell.crop}
 function canSwap(cell){return ['story','square'].includes(material())&&editable(cell)&&state.photos.length>1}
 $('previewSwap').onclick=()=>{armed=!armed;$('previewSwap').classList.toggle('primary',armed);$('previewHint').textContent=armed?'Нажмите фото и перенесите на другую ячейку.':'Двигайте фото для кадрирования. Удерживайте, чтобы переставить.'};
 $('previewUndo').onclick=()=>{clear();const action=history.pop();action?.();notify()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')clear()});window.addEventListener('titan-material-selected',()=>{clear();$('previewSwap').disabled=true;$('previewSwap').hidden=!['story','square'].includes(material())});
 input.onchange=async()=>{const cell=empty,file=input.files[0];input.value='';empty=null;if(!cell||!file||state.photos.length>=15)return;const m=material(),before=state.photos.length,ids=state.photos.map(p=>p.id);await addPhotos([file]);if(state.photos.length===before||material()!==m)return;const added=state.photos.at(-1);
  if(m==='square'){state.squareSlots??=Array.from({length:15},(_,i)=>ids[i]||null);state.squareSlots=state.squareSlots.map(id=>id===added.id?null:id);state.squareSlots[cell.slot]=added.id}
  else if(m==='story'&&cell.slot>=before||m==='story'&&state.storySlots){state.storySlots??=Array.from({length:15},(_,i)=>ids[i]||null);state.storySlots=state.storySlots.map(id=>id===added.id?null:id);state.storySlots[cell.slot]=added.id}
  else if(cell.source>=0&&cell.source<before)TitanPhotoLibrary.move(added.id,cell.source);
  if(m==='cover'){const cfg=TitanCoverProject.export();cfg.config.layouts[cfg.config.format].photoId=added.id;await TitanCoverProject.restore(cfg)}
  if(['formats','avito'].includes(m)){const cfg=TitanFormats.config.layouts[TitanFormats.current];cfg.photoIds=[added.id];cfg.count=1;TitanFormats.render()}notify();
 };
 for(const c of surface.querySelectorAll('canvas')){
  c.addEventListener('contextmenu',e=>{if(cells(c))e.preventDefault()});
  c.addEventListener('pointerdown',e=>{const cell=hit(c,e);if(cells(c)===null)return;e.stopImmediatePropagation();if(!cell||e.button>0)return;e.preventDefault();
   if(!editable(cell)){empty=cell;input.click();return}cell.select?.();$('previewSwap').disabled=!canSwap(cell);c.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(!gesture){gesture={cell,before:{...cell.crop},original:{...cell.crop},x:e.clientX,y:e.clientY,changed:false,swapping:false};if(armed&&canSwap(cell))beginSwap();else if(canSwap(cell))timer=setTimeout(beginSwap,530)}
   if(points.size===2){clearTimeout(timer);gesture.swapping=false;frame.classList.remove('photo-grabbed');const a=[...points.values()];gesture.pinch={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),zoom:gesture.cell.crop.zoom};gesture.before={...gesture.cell.crop};gesture.x=(a[0].x+a[1].x)/2;gesture.y=(a[0].y+a[1].y)/2}
  },true);
  c.addEventListener('pointermove',e=>{if(cells(c)===null)return;e.stopImmediatePropagation();if(!gesture||!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(gesture.swapping){gesture.target=hitAnywhere(e);paint(targetMark,gesture.target);return}
   const a=[...points.values()],center=a.length===2?{clientX:(a[0].x+a[1].x)/2,clientY:(a[0].y+a[1].y)/2}:{clientX:e.clientX,clientY:e.clientY},distance=Math.hypot(center.clientX-gesture.x,center.clientY-gesture.y);if(a.length===1&&distance<6&&!gesture.changed)return;clearTimeout(timer);const cell=gesture.cell,t=cell.crop,k=c.width/c.getBoundingClientRect().width,f=factors(cell);Object.assign(t,gesture.before);t.x=clamp(cell,t.x+(center.clientX-gesture.x)*k/f.x);t.y=clamp(cell,t.y+(center.clientY-gesture.y)*k/f.y,'y');if(a.length===2&&gesture.pinch){const n=Math.max(cell.unit==='half'?.25:1,Math.min(4,gesture.pinch.zoom*Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)/Math.max(1,gesture.pinch.distance)));zoomAt(cell,n,center)}gesture.changed=true;cell.render();paint(mark,cell);
  },true);
  function end(e){if(cells(c)===null)return;e.stopImmediatePropagation();if(!gesture||!points.has(e.pointerId))return;clearTimeout(timer);points.delete(e.pointerId);if(e.type==='pointercancel'||e.type==='lostpointercapture'){Object.assign(gesture.cell.crop,gesture.original);gesture.cell.render();clear();return}if(points.size){const remaining=[...points.values()][0];gesture.x=remaining.x;gesture.y=remaining.y;gesture.before={...gesture.cell.crop};gesture.pinch=null;return}
   const g=gesture;if(g.swapping&&g.target&&!editable(g.target)&&['story','square'].includes(material())){const key=material()==='story'?'storySlots':'squareSlots',before=state[key]?[...state[key]]:null;state[key]??=Array.from({length:15},(_,i)=>state.photos[i]?.id||null);state[key][g.target.slot]=state.photos[g.cell.source].id;state[key][g.cell.slot]=null;remember(()=>{state[key]=before})}
   else if(g.swapping&&g.target&&g.cell.source!==g.target.source&&editable(g.target)){const from=state.photos[g.cell.source]?.id,to=state.photos[g.target.source]?.id;if(from&&to){const slots=material()==='story'?state.storySlots:state.squareSlots;if(slots){const i=g.cell.slot,j=g.target.slot;[slots[i],slots[j]]=[slots[j],slots[i]];remember(()=>{[slots[i],slots[j]]=[slots[j],slots[i]]})}else{TitanPhotoLibrary.swap(from,to);remember(()=>TitanPhotoLibrary.swap(from,to))}}}
   else if(g.changed){const t=g.cell.crop,before=g.original;remember(()=>Object.assign(t,before))}clear();notify();
  }
  for(const type of ['pointerup','pointercancel','lostpointercapture'])c.addEventListener(type,end,true);
  c.addEventListener('wheel',e=>{if(cells(c)===null)return;e.stopImmediatePropagation();const cell=hit(c,e);if(!editable(cell))return;e.preventDefault();cell.select?.();$('previewSwap').disabled=!canSwap(cell);const before={...cell.crop};zoomAt(cell,Math.max(cell.unit==='half'?.25:1,Math.min(4,cell.crop.zoom+(e.deltaY<0?.08:-.08))),e);cell.render();remember(()=>Object.assign(cell.crop,before));TitanAutosave.schedule();paint(mark,cell)},{capture:true,passive:false});
 }

 const handles=document.createElement('div');handles.id='previewDragHandles';frame.append(handles);
 function updateHandles(){const desired=[];if(['story','square'].includes(material()))for(const c of surface.querySelectorAll('canvas')){const r=c.getBoundingClientRect();if(!r.width)continue;for(const cell of cells(c)||[])if(editable(cell))desired.push(cell)}
  while(handles.children.length>desired.length)handles.lastElementChild.remove();desired.forEach((cell,i)=>{let b=handles.children[i];if(!b){b=document.createElement('button');b.type='button';b.className='preview-drag-handle';b.textContent='↔';b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();const cell=b.cell;cell.select?.();cell.c.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture={cell,before:{...cell.crop},original:{...cell.crop},x:e.clientX,y:e.clientY,changed:false,swapping:false};beginSwap()};handles.append(b)}b.cell=cell;b.title='Переставить фото '+(cell.source+1);b.setAttribute('aria-label',b.title);const r=cell.c.getBoundingClientRect(),f=frame.getBoundingClientRect(),k=r.width/cell.c.width;b.style.left=r.left-f.left+(cell.x+cell.w)*k-34+'px';b.style.top=r.top-f.top+cell.y*k+3+'px'});
 }
 const handleDraw=draw;draw=function(){handleDraw();requestAnimationFrame(updateHandles)};new ResizeObserver(()=>requestAnimationFrame(updateHandles)).observe(frame);window.addEventListener('titan-material-selected',()=>requestAnimationFrame(updateHandles));window.addEventListener('resize',updateHandles);requestAnimationFrame(updateHandles);

 const restore=TitanProject.restore;TitanProject.restore=async(...args)=>{clear();history.length=0;await restore(...args);$('previewUndo').disabled=true};
 const load=loadProjectData;loadProjectData=async(...args)=>{clear();history.length=0;await load(...args);$('previewUndo').disabled=true};
 mark.hidden=targetMark.hidden=true;$('previewHint').textContent='Фото: двигайте кадр; колесо/pinch — масштаб; ручка ↔ — перестановка.';
})();
