/* Annual publication calendar. Dates are always evaluated in Europe/Samara. */
(()=>{
 const fixed={
 '1-7':['Рождество Христово','С Рождеством Христовым!','christmas'],
 '1-14':['Старый Новый год','Со Старым Новым годом!','winter'],
 '1-25':['Татьянин день, День студента','С Днём студента и Татьяниным днём!','student'],
 '2-14':['День всех влюблённых','С Днём всех влюблённых!','heart'],
 '2-23':['День защитника Отечества','С 23 Февраля!','star'],
 '3-8':['Международный женский день','С 8 Марта!','spring'],
 '5-1':['Праздник Весны и Труда','С Праздником Весны и Труда!','spring'],
 '5-9':['День Победы','С Днём Победы!','victory'],
 '6-1':['День защиты детей','С Днём защиты детей!','children'],
 '6-12':['День России','С Днём России!','flag'],
 '7-8':['День семьи, любви и верности','С Днём семьи, любви и верности!','daisy'],
 '9-1':['День знаний','С Днём знаний!','leaf'],
 '10-5':['День учителя','С Днём учителя!','leaf'],
 '11-4':['День народного единства','С Днём народного единства!','flag']};
 function current(instant=new Date()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Samara',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(instant).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)])),{year:y,month:m,day:d}=parts;
  let value=fixed[m+'-'+d];const weekday=new Date(Date.UTC(y,m-1,d)).getUTCDay(),last=new Date(Date.UTC(y,m,0)).getUTCDate();
  if(!value&&weekday===0){if(m===10&&d>=15&&d<=21)value=['День отца','С Днём отца!','family'];else if(m===10&&d+7>last)value=['День автомобилиста','С Днём автомобилиста!','car'];else if(m===11&&d+7>last)value=['День матери','С Днём матери!','family']}
  if(!value&&m===12&&d>=15)value=['Новый год','С наступающим Новым годом!','winter'];
  if(!value&&m===1&&d<=14)value=['Новый год','С наступившим Новым годом!','winter'];
  return value?{name:value[0],caption:value[1],theme:value[2]}:null;
 }
 const choices={auto:null,'new-year-before':['Новый год · с наступающим','С наступающим Новым годом!','winter'],'new-year-after':['Новый год · с наступившим','С наступившим Новым годом!','winter'],...fixed,'father':['День отца','С Днём отца!','family'],'motorist':['День автомобилиста','С Днём автомобилиста!','car'],'mother':['День матери','С Днём матери!','family']};
 function selected(){const key=document.getElementById('holidayChoice')?.value||'auto',value=choices[key];return value?{name:value[0],caption:value[1],theme:value[2]}:current()}
 const clean=new WeakMap(),originals=new WeakMap(),archives=new WeakMap();
 function decorate(g,w,h){
  const c=g.canvas;c.titanHolidayLayout={id:c.id,vehicle:c.id==='story'&&typeof state!=='undefined'&&state.contentMode==='vehicle',special:c.id==='story'&&typeof state!=='undefined'&&(state.contentMode!=='vehicle'||isPromoPage()),leftPanel:!!c.titanHolidayLeftPanel,rects:c.titanHolidayTextRects||[],logo:window.TitanVehicleDesign&&document.getElementById('showLogo')?.checked?TitanVehicleDesign.logoBounds(w,h):null};const copy=document.createElement('canvas');copy.width=w;copy.height=h;copy.titanHolidayLayout=structuredClone(c.titanHolidayLayout);copy.getContext('2d').drawImage(c,0,0);clean.set(c,copy);
  if(!Object.hasOwn(c,'titanHolidayBlob')){const native=c.toBlob;c.titanHolidayBlob=true;c.toBlob=function(callback,type='image/png',quality){const source=clean.get(c);if(!source)return native.call(c,callback,type,quality);const base=document.createElement('canvas');base.width=source.width;base.height=source.height;base.titanHolidayLayout=source.titanHolidayLayout;base.getContext('2d').drawImage(source,0,0);const output=document.createElement('canvas');output.width=base.width;output.height=base.height;output.titanHolidayLayout=base.titanHolidayLayout;const g=output.getContext('2d');g.drawImage(base,0,0);paint(g,output.width,output.height);native.call(output,blob=>{if(blob)originals.set(blob,base);callback(blob)},type,quality)}}
  paint(g,w,h);
 }
 function paint(g,w,h){const holiday=selected();if(!document.getElementById('holidayDecor')?.checked||!holiday)return;window.TitanHolidayArt?.paint(g,w,h,holiday,g.canvas.titanHolidayLayout||{})}
 window.TitanHoliday={current,selected,choices,decorate,paint,originals,archives,base:c=>clean.get(c),async entry(name,blob){return{name,data:new Uint8Array(await blob.arrayBuffer()),holidayBase:originals.get(blob)}}};
})();
