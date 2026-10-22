/* Local-only input boundaries shared by all editors. */
window.TitanSafety = (() => {
  'use strict';
  const MB = 1024 * 1024;
  const limits = Object.freeze({photos:15, photoBytes:50*MB, jsonBytes:160*MB, pixels:100000000});
  const record = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const text = (value, length=200) => typeof value === 'string' ? value.slice(0,length) : '';
  function number(value, fallback, min, max) {
    const n = typeof value === 'number' || typeof value === 'string' && value.trim() ? Number(value) : NaN;
    return Number.isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback;
  }
  function timeout(promise, ms=30000, message='Обработка заняла слишком много времени') {
    let timer;
    return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms)})]).finally(()=>clearTimeout(timer));
  }
  async function readJSON(file) {
    if (!(file instanceof Blob) || !file.size || file.size > limits.jsonBytes) throw Error('JSON пустой или превышает 160 МБ');
    let value;
    try { value=JSON.parse(await file.text()); } catch { throw Error('Повреждённый JSON: проверьте файл проекта'); }
    if(!record(value)) throw Error('В JSON должен быть объект проекта');
    return value;
  }
  function crop(value={}, normalized=false) {
    return {zoom:number(value?.zoom,1,normalized ? 0.25 : 1,4),x:number(value?.x,0,normalized?-1:-10000,normalized?1:10000),y:number(value?.y,0,normalized?-1:-10000,normalized?1:10000),rotation:number(value?.rotation,0,-180,180),fit:value?.fit==='contain'?'contain':'cover'};
  }
  function formats(value={}, fallbackPrice=true) {
    const result={showPrice:typeof value?.showPrice==='boolean'?value.showPrice:fallbackPrice,stamp:['reserved','sale'].includes(value?.stamp)?value.stamp:'',layouts:{}};
    for(const key of ['square','landscape','story','video','avito']){result.layouts[key]={count:Math.round(number(value?.layouts?.[key]?.count,1,1,15)),text:typeof value?.layouts?.[key]?.text==='boolean'?value.layouts[key].text:key!=='avito'};if(Array.isArray(value?.layouts?.[key]?.photoIndices))result.layouts[key].photoIndices=[...new Set(value.layouts[key].photoIndices.filter(i=>Number.isInteger(i)&&i>=0&&i<15))].slice(0,15);if(typeof value?.layouts?.[key]?.archiveAll==='boolean')result.layouts[key].archiveAll=value.layouts[key].archiveAll;if(Array.isArray(value?.layouts?.[key]?.photoIds))result.layouts[key].photoIds=[...new Set(value.layouts[key].photoIds.filter(i=>typeof i==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(i)))].slice(0,15)}
    return result;
  }
  function photoFormats(value={}) {
    const result={};for(const key of ['square','landscape','story','video','avito'])if(record(value?.[key]))result[key]=crop(value[key],true);return result;
  }
  function svgData(value) {
    const comma=value.indexOf(',');let source;
    try { source=/;base64/i.test(value.slice(0,comma)) ? new TextDecoder().decode(Uint8Array.from(atob(value.slice(comma+1)),c=>c.charCodeAt(0))) : decodeURIComponent(value.slice(comma+1)); } catch {throw Error('Повреждённый SVG');}
    if(source.length>2*MB)throw Error('SVG слишком большой');
    const doc=new DOMParser().parseFromString(source,'image/svg+xml');
    if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Некорректный SVG');
    const properties=new Set('fill stroke stroke-width stroke-linejoin stroke-linecap opacity fill-opacity stroke-opacity font-family font-size font-weight text-anchor'.split(' '));
    const cleanStyle=value=>value.split(';').map(v=>v.split(':')).filter(([key,v])=>properties.has(key?.trim().toLowerCase())&&v&&!/expression|javascript|https?:|\/\/|url\(\s*["']?(?!#)/i.test(v)).map(([key,v])=>`${key.trim()}:${v.trim()}`).join(';');
    for(const style of [...doc.querySelectorAll('style')]){for(const match of style.textContent.matchAll(/([^{}]+)\{([^{}]*)\}/g)){const declaration=cleanStyle(match[2]);try{for(const node of doc.querySelectorAll(match[1].trim()))node.setAttribute('style',declaration+';'+(node.getAttribute('style')||''))}catch{}}style.remove();}
    const allowed=new Set('svg g path rect circle ellipse polygon polyline line text tspan defs linearGradient radialGradient stop clipPath mask pattern use symbol title desc'.split(' '));
    const attributes=new Set('id class d x y x1 y1 x2 y2 dx dy width height viewBox rx ry cx cy r points transform preserveAspectRatio fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity style font-family font-size font-weight text-anchor dominant-baseline gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity clip-path clip-rule clipPathUnits mask maskUnits maskContentUnits patternUnits patternContentUnits patternTransform xmlns href'.toLowerCase().split(' '));
    for(const node of [...doc.querySelectorAll('*')]){
      if(!allowed.has(node.localName)){node.remove();continue;}
      for(const attr of [...node.attributes]){
        const key=attr.localName.toLowerCase(),v=attr.value;
        if(!attributes.has(key)){node.removeAttributeNode(attr);continue;}
        if(key==='style'){node.setAttribute('style',cleanStyle(v));continue;}
        if(key.startsWith('on')||((key==='href'||key==='src')&&!v.startsWith('#'))||/url\(\s*["']?(?!#)/i.test(v))node.removeAttributeNode(attr);
      }
    }
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(doc.documentElement));
  }
  function imageData(value, {svg=false}={}) {
    if(typeof value!=='string'||value.length>Math.ceil(limits.photoBytes*4/3)+1024)throw Error('Некорректные или слишком большие данные изображения');
    if(svg&&/^data:image\/svg\+xml[;,]/i.test(value))return svgData(value);
    if(!/^data:image\/(?:jpeg|png|webp|gif|avif|bmp|heic|heif)(?:;base64),[a-z0-9+/=\r\n]+$/i.test(value))throw Error('Изображение должно быть встроено в JSON; внешние ссылки запрещены');
    return value;
  }
  async function checkFile(file) {
    if(!(file instanceof Blob)||!file.size||file.size>limits.photoBytes)throw Error('Фото пустое или превышает 50 МБ');
    if(!/^image\//i.test(file.type)&&! /\.(?:jpe?g|png|webp|hei[cf]|avif|gif|bmp|svg|tiff?)$/i.test(file.name||''))throw Error('Выберите файл изображения');
    const bytes=new Uint8Array(await file.slice(0,262144).arrayBuffer()),view=new DataView(bytes.buffer);let w=0,h=0;
    if(bytes.length>=24&&view.getUint32(0)===0x89504e47){w=view.getUint32(16);h=view.getUint32(20);}
    else if(bytes.length>=10&&String.fromCharCode(...bytes.slice(0,3))==='GIF'){w=view.getUint16(6,true);h=view.getUint16(8,true);}
    else if(bytes.length>=30&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'){
      const chunk=String.fromCharCode(...bytes.slice(12,16));
      if(chunk==='VP8X'){w=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);h=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);}
      else if(chunk==='VP8L'&&bytes[20]===0x2f){w=1+bytes[21]+((bytes[22]&0x3f)<<8);h=1+(bytes[22]>>6)+(bytes[23]<<2)+((bytes[24]&15)<<10);}
      else if(chunk==='VP8 '&&bytes[23]===0x9d&&bytes[24]===1&&bytes[25]===0x2a){w=view.getUint16(26,true)&0x3fff;h=view.getUint16(28,true)&0x3fff;}
    }
    else if(bytes[0]===255&&bytes[1]===216){for(let offset=2;offset+8<bytes.length;){if(bytes[offset]!==255)break;const marker=bytes[offset+1];if(marker===0xda||marker===0xd9)break;if(marker===0xd8||marker===1||marker>=0xd0&&marker<=0xd7){offset+=2;continue;}const len=view.getUint16(offset+2);if(len<2)break;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){h=view.getUint16(offset+5);w=view.getUint16(offset+7);break;}offset+=2+len;}}
    // HEIC/AVIF dimensions are stored in an ISO BMFF ispe box.
    if(!w&&bytes.length>=12&&String.fromCharCode(...bytes.slice(4,8))==='ftyp')for(let i=4;i+16<bytes.length;i++){if(bytes[i]===105&&bytes[i+1]===115&&bytes[i+2]===112&&bytes[i+3]===101&&view.getUint32(i-4)===20){checkDimensions(view.getUint32(i+8),view.getUint32(i+12));}}
    if(w&&h)checkDimensions(w,h);
    if(file.type==='image/svg+xml'||/\.svg$/i.test(file.name||'')){
      const value='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(await file.text());
      const clean=svgData(value);return new File([decodeURIComponent(clean.slice(clean.indexOf(',')+1))],file.name||'image.svg',{type:'image/svg+xml'});
    }
    return file;
  }
  function checkDimensions(w,h){if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w*h>limits.pixels||w>32768||h>32768)throw Error('Изображение слишком большое: максимум 100 мегапикселей и 32768 пикселей по стороне');}
  let editorRules=null;
  function captureEditorRules(){
    const current=[...document.querySelectorAll('#vehicleEditor input[id],#vehicleEditor textarea[id],#vehicleEditor select[id],#availableStatusLabel')].map(input=>({id:input.id,type:input.type,tag:input.tagName,maxLength:input.maxLength,min:input.min,max:input.max,value:input.value,options:input.options?[...input.options].map(o=>o.value):[]}));
    editorRules=[...new Map([...(editorRules||[]),...current].map(rule=>[rule.id,rule])).values()];
  }
  function editor(value,stamp='') {
    if(!record(value))throw Error('Нет данных автомобиля');value=TitanVehicleStatusPolicy.editor(value,stamp);const result={};
    for(const input of editorRules||document.querySelectorAll('#vehicleEditor input[id],#vehicleEditor textarea[id],#vehicleEditor select[id]')){
      if(!Object.hasOwn(value,input.id))continue;const v=value[input.id];
      if(input.type==='checkbox'){if(typeof v==='boolean')result[input.id]=v;}
      else if((input.tag||input.tagName)==='SELECT'){if([...input.options].some(o=>(typeof o==='string'?o:o.value)===v))result[input.id]=v;}
      else if(input.type==='color'){if(typeof v==='string'&&/^#[a-f0-9]{6}$/i.test(v))result[input.id]=v;}
      else if(input.type==='number'||input.type==='range')result[input.id]=String(number(v,Number(input.value)||1,Number(input.min)||0,Number(input.max)||9999));
      else if(input.type!=='file')result[input.id]=text(v,input.maxLength>0?input.maxLength:input.id==='sourceText'?20000:2000);
    }
    result.holidayDecor=value.holidayDecor===true;result.holidayChoice=Object.hasOwn(window.TitanHoliday?.choices||{},value.holidayChoice)?value.holidayChoice:'auto';
    // Missing color identifies a project made before the shared icon-color setting.
    // Preserve both its toggle and the former white/palette icon treatment.
    if(!Object.hasOwn(value,'specIconColor')){result.specIconColor='#f5f5f5';result.specIconLegacy=true;if(!Object.hasOwn(value,'specIcons'))result.specIcons=false;}
    if(!Object.hasOwn(value,'channelTelegram'))for(const id of ['promoTelegram','stockTelegram']){
      const raw=typeof value[id]==='string'?value[id].replace(/^Telegram:\s*/i,'').trim():'';
      if(!raw||['t.me/perekupshiy','https://t.me/+NwPVN30IthU2MzYy'].includes(raw))continue;
      const candidate=/^https?:\/\//i.test(raw)?raw:/^t\.me\//i.test(raw)?'https://'+raw:'';
      if(candidate){result.channelTelegram=text(candidate,500);result.showTelegramQR=value['show-'+id]!==false;break}
    }
    return result;
  }
  function project(value) {
    if(!record(value)||value.schema!=='titan-auto-story-project'||!Array.isArray(value.photos)||value.photos.length>15)throw Error('Неверный проект: ожидается JSON генератора с максимум 15 фото');
    if(value.version!=null&&(!Number.isInteger(value.version)||value.version>4||value.version<1))throw Error('Версия проекта не поддерживается');
    const result={schema:value.schema,version:4,id:text(value.id),vehicle:text(value.vehicle),editor:editor(value.sharedVehicle?TitanExchange.applyEditor(value.sharedVehicle,value.editor):value.editor,value.formats?.stamp),photos:[],formats:formats(value.formats,value.editor?.['show-price']!==false||value.editor?.['show-salePrice']!==false)};
    if(value.sharedVehicle){const card=TitanExchange.validateCard(value.sharedVehicle),mapped=TitanExchange.applyEditor(card,value.editor);for(const id of ['model','features',...Object.values(TitanExchange.fieldMap)]){const input=document.getElementById(id),max=input?.maxLength>0?input.maxLength:2000;if(String(mapped[id]||'').length>max)throw Error('Поле «'+(input?.getAttribute('aria-label')||id)+'» слишком длинное для публикации (до '+max+' символов). JSON и текущий проект не изменены.')}result.sharedVehicle=card;}if(value.priceTag)result.priceTag={version:1,state:TitanExchange.priceState(value.priceTag.state)};
    result.formats.stamp=result.editor.saleStatus==='reserved'?'reserved':value.formats?.stamp==='sale'?'sale':'';
    for(const p of value.photos){if(!record(p))throw Error('Некорректная запись фото');const fileName=text(p.fileName);if(fileName&&(/[\\/]/.test(fileName)||/^\.{1,2}$/.test(fileName)))throw Error('Недопустимое имя файла фото');result.photos.push({id:text(p.id,100),name:text(p.name),fileName,sourceName:text(p.sourceName),sourceSize:number(p.sourceSize,0,0,limits.photoBytes),...(p.dataUrl?{dataUrl:imageData(p.dataUrl)}:{}),single:crop(p.single),collage:crop(p.collage),formats:photoFormats(p.formats)});}
    if(value.square)result.square=square(value.square);
    if(value.cover){if(!record(value.cover.config))throw Error('Некорректная обложка');result.cover={config:cover(value.cover.config)};}
    result.materialOptions={};if(record(value.materialOptions))for(const key of ['story','square','cover','format-square','format-landscape','format-story','format-video','format-avito'])if(record(value.materialOptions[key])){result.materialOptions[key]={};for(const id of ['model','trim','year','mileage','volume','fuel','drive','gearbox','power','price','salePrice','features','purchaseOption','cta','location','phone'])if(typeof value.materialOptions[key][id]==='boolean')result.materialOptions[key][id]=value.materialOptions[key][id]}
    if(value.special){
      if(!record(value.special))throw Error('Некорректные специальные материалы');
      result.special={texts:{},photos:{}};
      for(const [id,v]of Object.entries(value.special.texts||{})){
        const input=document.getElementById(id);
        if(input?.closest('.special-editor'))result.special.texts[id]=input.type==='checkbox'?!!v:text(v,input.maxLength>0?input.maxLength:2000);
      }
      for(const [mode,limit]of [['client',1],['reviews',3],['proof',1]]){
        const items=value.special.photos?.[mode]||[];
        if(!Array.isArray(items)||items.length>limit)throw Error('Слишком много фото: '+mode);
        result.special.photos[mode]=items.map(p=>({name:text(p.name),dataUrl:imageData(p.dataUrl),single:crop(p.single),collage:crop(p.collage)}));
      }
    }
    if(Array.isArray(value.squareSlots))result.squareSlots=value.squareSlots.slice(0,15).map(id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id)?id:null);
    if(Array.isArray(value.storySlots))result.storySlots=value.storySlots.slice(0,15).map(id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id)?id:null);
    if(record(value.workspace))result.workspace={stage:['project','photos','materials','export'].includes(value.workspace.stage)?value.workspace.stage:'project',material:text(value.workspace.material,40),proofDesign:value.workspace.proofDesign==='final'?'final':'proof',editorTab:['vehicle','photo','content','design'].includes(value.workspace.editorTab)?value.workspace.editorTab:'photo',previewMode:value.workspace.previewMode==='pc'?'pc':'phone',previewPlatform:value.workspace.previewPlatform==='max'?'max':'telegram',previewZoom:number(value.workspace.previewZoom,1,1,2),projectTab:['vehicle','photo','design'].includes(value.workspace.projectTab)?value.workspace.projectTab:'vehicle',exports:record(value.workspace.exports)?{selected:Array.isArray(value.workspace.exports.selected)?value.workspace.exports.selected.filter(k=>['story','square','cover','formats','avito','client','reviews','proof','final'].includes(k)):[],includeFinal:value.workspace.exports.includeFinal!==false}:undefined};
    return result;
  }
  const ranges={weight:[1,8],corner:[0,160],diagonal:[0,180],bar:[0,1],labelSize:[18,50],numberSize:[24,64],panelX:[-40,450],panelY:[-40,300],panelScale:[.6,1.15]};
  function square(value){
    if(!record(value)||!Array.isArray(value.tiles)||value.tiles.length!==9)throw Error('Квадратная серия должна содержать 9 кадров');
    function tile(t,part=false){if(!record(t))throw Error('Некорректный квадрат');const result={...crop(t,true),customCrop:!!t.customCrop,correction:{brightness:number(t.correction?.brightness,1,.5,1.5),contrast:number(t.correction?.contrast,1,.5,1.5),saturation:number(t.correction?.saturation,1,0,2),temperature:number(t.correction?.temperature,0,-1,1)}};
      if(part)return result;
      for(const key of ['text','heading','kicker','frameLabel'])result[key]=t[key]===null?null:text(t[key],key==='text'?500:100);
      result.text??='';result.showText=!!t.showText;result.logoEnabled=!!t.logoEnabled;
      result.design={};for(const [k,[min,max]]of Object.entries(ranges))if(t.design?.[k]!=null)result.design[k]=number(t.design[k],min,min,max);
      for(const k of ['frame','textColor'])if(/^#[a-f0-9]{6}$/i.test(t.design?.[k]||''))result.design[k]=t.design[k];if(typeof t.design?.labels==='boolean')result.design.labels=t.design.labels;
      if(record(t.hero)){result.hero={};for(const k of ['brand','model','year','mileage','fuel','transmission','displacement','power'])if(Object.hasOwn(t.hero,k))result.hero[k]=text(t.hero[k],100);}
      if(t.logoSrc)result.logoSrc=imageData(t.logoSrc,{svg:true});
      if(t.parts){if(!Array.isArray(t.parts)||t.parts.length!==4)throw Error('Коллаж должен содержать 4 части');result.parts=t.parts.map(p=>tile(p,true));}
      if(t.src)result.src=imageData(t.src,{svg:true});return result;
    }
    const settings={};for(const k of ['squareSeries','squareFont','squareShade','squareOrder'])if(value.settings?.[k]!=null){const input=document.getElementById(k);if(input?.tagName==='SELECT'){if([...input.options].some(o=>o.value===value.settings[k]))settings[k]=value.settings[k];}else settings[k]=String(number(value.settings[k],Number(input?.value)||1,Number(input?.min)||0,Number(input?.max)||9999));}
    return {tiles:value.tiles.map(t=>tile(t)),settings};
  }
  function cover(value,defaults={}){
    if(!record(value))throw Error('Некорректные настройки обложки');const result=structuredClone(defaults);
    result.format=['landscape','square','story','video'].includes(value.format)?value.format:defaults.format||'landscape';result.designVersion=4;
    result.vehicle={...defaults.vehicle};for(const k of ['brand','model','generation','year','mileage','volume','gearbox','power','fuel','drive','status'])if(typeof value.vehicle?.[k]==='string')result.vehicle[k]=text(value.vehicle[k],100);
    const fields={brightness:[.5,1.5],contrast:[.5,1.5],saturation:[0,2],tilt:[-10,10],glow:[0,40],fire:[0,1],tracking:[0,5],shade:[0,1],topShade:[0,1],jpgQuality:[.5,1]};
    for(const [k,[min,max]]of Object.entries(fields))if(value[k]!=null)result[k]=number(value[k],defaults[k]??min,min,max);
    for(const k of ['frame','diagonals','showLogo','leftInfo'])if(typeof value[k]==='boolean')result[k]=value[k];
    result.layouts={};for(const k of ['landscape','square','story','video']){result.layouts[k]={...defaults.layouts?.[k]};if(typeof value.layouts?.[k]?.photoId==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(value.layouts[k].photoId))result.layouts[k].photoId=value.layouts[k].photoId;for(const [id,min,max]of [['photoIndex',0,14],['zoom',1,3],['x',-1,1],['y',-1,1],['statusX',0,380],['statusY',40,600],['statusSize',70,200],['nameX',32,160],['nameY',600,k==='story'?2260:k==='square'?1300:970],['nameSize',30,120]])if(value.layouts?.[k]?.[id]!=null)result.layouts[k][id]=number(value.layouts[k][id],defaults.layouts?.[k]?.[id]??min,min,max);}
    if(value.logoSrc)result.logoSrc=imageData(value.logoSrc,{svg:true});return result;
  }
  const storage={get(key){try{return localStorage.getItem(key)}catch{return null}},set(key,value){try{localStorage.setItem(key,value);return true}catch{window.dispatchEvent(new Event('titan-storage-error'));return false}},remove(key){try{localStorage.removeItem(key)}catch{}}};
  return Object.freeze({limits,record,text,number,timeout,readJSON,crop,formats,photoFormats,imageData,checkFile,checkDimensions,editor,project,square,cover,storage,captureEditorRules});
})();
