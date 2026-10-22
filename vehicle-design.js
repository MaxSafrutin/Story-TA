/* Shared layout for vehicle previews and exports. */
window.TitanVehicleDesign=(()=>{
const paths={mileage:'M3 18 A9 9 0 1 1 21 18 M12 12 L17 6',year:'M3 5 H21 V21 H3 Z M3 10 H21 M7 2 V7 M17 2 V7',volume:'M5 7 H17 V10 H21 V19 H5 L2 15 V10 H5 Z M8 3 H15 M12 3 V7',fuel:'M3 3 H14 V21 H3 Z M5 6 H12 V11 H5 Z M14 8 L20 12 V18 Q20 22 17 18 V13',drive:'M5 5 H19 M5 19 H19 M12 5 V19 M3 2 H7 V8 H3 Z M17 2 H21 V8 H17 Z M3 16 H7 V22 H3 Z M17 16 H21 V22 H17 Z',gearbox:'M5 3 V12 H19 V3 M12 3 V21 M5 12 V21',power:'M13 2 L5 13 H11 L9 22 L20 9 H13 Z'};
const ids=['mileage','year','volume','fuel','drive','gearbox','power'],value=id=>$(id).value.trim();
function vehicleName(name=value('model')){const brand=name.match(/^(Land Rover|Great Wall|Mercedes[- ]Benz|Alfa Romeo|Aston Martin)\b/i)?.[0]||name.split(/\s+/)[0]||'';return{brand,model:name.slice(brand.length).trim()}}
function money(raw){const text=String(raw||'').trim();if(!text)return '';const digits=text.replace(/[\s\u00a0₽]/g,'').replace(/(?:руб(?:лей|ля)?\.?|р\.)$/i,'');return /^\d+$/.test(digits)?digits.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' ₽':/₽|руб/i.test(text)?text:text+' ₽'}
function driveText(raw){const text=String(raw||'').trim();if(/^(?:FWD|передн(?:ий|ий привод)?)$/i.test(text))return 'Передний привод';if(/^(?:RWD|задн(?:ий|ий привод)?)$/i.test(text))return 'Задний привод';if(/^(?:AWD|4WD|4x4|полный(?: привод)?)$/i.test(text))return 'Полный привод';return /привод/i.test(text)?text:'Привод '+text}
function values(visibility={}){return ids.filter(id=>(visibility[id]??isOn(id))&&value(id)).map(id=>{let text=value(id);if(id==='mileage'){text=text.replace(/^пробег\s*[:—-]?\s*/i,'');if(/^[\d\s]+$/.test(text))text=text.replace(/\s/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' км';text=text.trim()}if(id==='drive')text=driveText(text);if(id==='year'&&!/г/i.test(text))text+=' г.в.';if(id==='volume')text=text.replace(',','.');if(id==='power'&&!/л|hp/i.test(text))text+=' л.с.';return{id,text}})}
function font(g,size,weight=600){g.font=`${weight} ${size}px ${weight>=800?'Montserrat':'Inter'},Arial`}
function fit(g,text,size,width,weight=600,min=12){font(g,size,weight);while(g.measureText(text).width>width&&size>min)font(g,--size,weight);return size}
function ellipsis(g,text,width){if(g.measureText(text).width<=width)return text;while(text&&g.measureText(text+'…').width>width)text=text.slice(0,-1);return text+'…'}
function lines(g,text,width,max=2){const tokens=String(text||'').trim().split(/\s+/).filter(Boolean),rows=[];let line='';for(let i=0;i<tokens.length;i++){const next=line?line+' '+tokens[i]:tokens[i];if(line&&g.measureText(next).width>width){rows.push(ellipsis(g,line,width));line=tokens[i];if(rows.length===max-1){line=tokens.slice(i).join(' ');break}}else line=next}if(line&&rows.length<max)rows.push(ellipsis(g,line,width));return rows}
function facts(g,x,y,width,size,visibility={}){const vals=values(visibility),icons=$('specIcons').checked;g.save();g.textAlign='left';g.fillStyle='#A0A0A0';let total=0;do{font(g,size);total=vals.reduce((n,v)=>n+g.measureText(v.text).width+(icons?size*1.15:0),0)+Math.max(0,vals.length-1)*(icons?size*.45:g.measureText(' | ').width);if(total<=width||size<=16)break;size--}while(true);g.translate(x,y);if(total>width)g.scale(width/total,1);let cursor=0;vals.forEach((v,i)=>{if(i){if(icons)cursor+=size*.45;else{g.fillText(' | ',cursor,0);cursor+=g.measureText(' | ').width}}if(icons){g.save();g.translate(cursor,-size*.85);g.scale(size/24,size/24);g.strokeStyle=$('specIconLegacy').checked?(v.id==='power'?$('accentColor').value:'#F5F5F5'):$('specIconColor').value;g.lineWidth=3.2;g.lineCap='round';g.lineJoin='round';g.stroke(new Path2D(paths[v.id]));g.restore();cursor+=size*1.15}g.fillText(v.text,cursor,0);cursor+=g.measureText(v.text).width});g.restore();return size}
// A common bounding box based on the short canvas side keeps the mark comparable.
function logoBounds(w,h){const side=Math.min(w,h);return{x:w*.067,y:h*.04,width:side*.16,height:side*.16*1450/1800}}
function logo(g,w,h,options={}){const showMark=options.showLogo!==false&&$('showLogo').checked;if(!showMark&&!options.captionWithoutLogo)return;
 const b=logoBounds(w,h),custom=options.logo;let dark=true;
 try{const probe=document.createElement('canvas');probe.width=probe.height=8;const sample=probe.getContext('2d',{willReadFrequently:true});sample.drawImage(g.canvas,b.x,b.y,b.width,b.height,0,0,8,8);const pixels=sample.getImageData(0,0,8,8).data;let sum=0,n=0;for(let i=0;i<pixels.length;i+=4){sum+=pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722;n++}dark=!n||sum/n<150}catch{}
 const brand=dark?state.logos.light:state.logos.dark;g.save();g.shadowColor=custom?(dark?'rgba(255,255,255,.7)':'rgba(0,0,0,.8)'):(dark?'rgba(0,0,0,.85)':'rgba(255,255,255,.8)');g.shadowBlur=Math.min(w,h)*.012;
 if(showMark&&custom){const k=Math.min(b.width/custom.width,b.height/custom.height);g.drawImage(custom,b.x,b.y,custom.width*k,custom.height*k)}else if(showMark&&brand)g.drawImage(brand,120,280,1800,1450,b.x,b.y,b.width,b.height);
 if($('showLogoCaption').checked){g.fillStyle=dark?'#F5F5F5':'#0A0A0A';fit(g,value('logoCaption'),20*Math.min(w,h)/1080,w*.42,700,14);g.fillText(ellipsis(g,value('logoCaption'),w*.42),b.x,b.y+b.height+24*Math.min(w,h)/1080)}g.restore()
}
function panel(g,w,h,options={}){
g.canvas.titanLayoutReport=null;g.canvas.titanHolidayTextRects=[];g.canvas.titanHolidayLeftPanel=false;
const visibility=window.TitanProject?.materialOptions?.[options.material||'story']||{},visible=id=>visibility[id]??isOn(id);
g.save();g.textAlign='left';g.textBaseline='alphabetic';g.shadowBlur=0;g.letterSpacing='0px';
const portrait=h/w>1.5,unit=portrait?w/1080:h/1080,p=w*.067,width=w-2*p,top=portrait?h*.619:h*.50,accent=$('accentColor').value||'#E53935',bg=$('backgroundColor').value||'#0A0A0A';
const gradient=g.createLinearGradient(0,h*.34,0,top+110*unit);gradient.addColorStop(0,'rgba(10,10,10,0)');gradient.addColorStop(1,bg);g.fillStyle=gradient;g.fillRect(0,h*.34,w,h*.66);g.fillStyle=bg;g.fillRect(0,top+110*unit,w,h-top-110*unit);
const text=(raw,y,size,color='#F5F5F5',weight=600,maxWidth=width,x=p,min=16*unit)=>{if(!raw)return;g.fillStyle=color;fit(g,raw,size,maxWidth,weight,min);const rendered=ellipsis(g,raw,maxWidth);g.fillText(rendered,x,y);g.canvas.titanHolidayTextRects.push({x:x-5*unit,y:y-Number(g.font.match(/([0-9.]+)px/)?.[1]||24)*1.15,w:g.measureText(rendered).width+10*unit,h:Number(g.font.match(/([0-9.]+)px/)?.[1]||24)*1.5})};
const titleTop=top+(portrait?82:70)*unit,titleSize=options.titleSize||((portrait?78:w/h>1.6?88:64)*unit),factY=titleTop+(portrait?58:40)*unit,featureY=factY+(portrait?48:40)*unit+((visible('trim')&&value('trim'))?32*unit:0),featureStep=(portrait?42:32)*unit,sold=$('soldMode').checked;
if($('showArrivalLabel').checked){const raw=(sold?value('soldStatus'):value('arrivalLabel')),size=(portrait?24:22)*unit;if(!window.TitanPublication?.status(g,raw,p,top,size,accent,width,!sold))text(raw.toUpperCase(),top,size,accent,700)}
if(visible('model')){const name=(value('model')||'МОДЕЛЬ АВТО').toUpperCase(),min=(portrait?54:40)*unit;fit(g,name,titleSize,width,900,min);if(g.measureText(name).width<=width)text(name,titleTop,titleSize,'#F5F5F5',900,width,p,min);else{g.fillStyle='#F5F5F5';font(g,min,900);lines(g,name,width,2).forEach((v,i)=>g.fillText(v,p,titleTop-min*.7+i*min*.95))}}
facts(g,p,factY,width,(portrait?31:28)*unit,visibility);g.canvas.titanHolidayTextRects.push({x:p-5*unit,y:factY-35*unit,w:width+10*unit,h:45*unit});
if(visible('trim')&&value('trim'))text(value('trim'),factY+32*unit,25*unit,'#C5C5C5');
const feats=(visible('features')?value('features'):'').split('\n').map(v=>v.trim()).filter(Boolean).slice(0,6);feats.forEach((v,i)=>{const perCol=Math.ceil(feats.length/2),col=i>=perCol?1:0,row=i%perCol,x=p+col*width/2,y=featureY+row*featureStep;g.fillStyle=accent;g.beginPath();g.arc(x+6*unit,y-7*unit,5*unit,0,Math.PI*2);g.fill();text(v.toUpperCase(),y,(portrait?24:23)*unit,'#F5F5F5',600,width/2-32*unit,x+24*unit,18*unit)});
const labelY=portrait?1550*unit:top+250*unit,priceY=portrait?1618*unit:top+300*unit,old=visible('price')?money(value('price')):'',sale=visible('salePrice')?money(value('salePrice')):'';
if(!sold&&(old||sale)){text('ЦЕНА',labelY,20*unit,'#A0A0A0');if(old&&sale){const oldMax=width*.36,gap=36*unit;fit(g,old,30*unit,oldMax,700,20*unit);const oldText=ellipsis(g,old,oldMax),oldWidth=g.measureText(oldText).width;g.fillStyle='#A0A0A0';g.fillText(oldText,p,priceY);g.strokeStyle=accent;g.lineWidth=3*unit;g.beginPath();g.moveTo(p,priceY-10*unit);g.lineTo(p+oldWidth,priceY-10*unit);g.stroke();text(sale,priceY,(portrait?49:48)*unit,'#F5F5F5',900,width-oldWidth-gap,p+oldWidth+gap,28*unit)}else text(sale||old,priceY,(portrait?59:52)*unit,'#F5F5F5',900,width,p,32*unit)}
if(sold){text(value('soldSubtitle'),labelY,24*unit,'#A0A0A0');text(!window.TitanWorkspace&&typeof soldDuration==='function'?soldDuration():'',priceY,34*unit,'#F5F5F5',800)}
const purchaseY=portrait?1665*unit:priceY+36*unit,ctaY=portrait?1708*unit:priceY+70*unit;
if(!sold&&visible('purchaseOption'))text(value('purchaseOption'),purchaseY,23*unit);
if(visible('cta')){g.canvas.titanHolidayTextRects.push({x:p-5*unit,y:ctaY-30*unit,w:width+10*unit,h:66*unit});g.fillStyle=accent;font(g,23*unit,700);const copy=sold?value('soldCta'):value('cta');if(window.TitanPublication)TitanPublication.text(g,copy,p,ctaY,width,28*unit,2);else lines(g,copy,width,2).forEach((v,i)=>g.fillText(v,p,ctaY+i*28*unit))}
const footerY=portrait?1772*unit:h-72*unit,phone=visible('phone')?value('phone'):'',address=visible('location')?value('location'):'';fit(g,phone,23*unit,width*.42,600,18*unit);const phoneText=ellipsis(g,phone,width*.42),phoneWidth=phone?g.measureText(phoneText).width:0;text(address,footerY,23*unit,'#F5F5F5',600,width-phoneWidth-(phone?24*unit:0));if(phone)text(phoneText,footerY,23*unit,'#F5F5F5',600,phoneWidth+1,w-p-phoneWidth,18*unit);
logo(g,w,h,options);window.TitanPublication?.draw(g,w,h);g.restore();
}
// Optional 4:3 cover composition. The existing bottom panel stays untouched.
function leftPanel(g,w,h,options={}){g.canvas.titanHolidayTextRects=[];g.canvas.titanHolidayLeftPanel=true;
 const visibility=window.TitanProject?.materialOptions?.cover||{},visible=id=>visibility[id]??isOn(id),u=h/1200,p=w*.055,width=w*.37,accent=value('accentColor'),bg=value('backgroundColor'),sold=$('soldMode').checked;
 g.save();g.textAlign='left';g.textBaseline='alphabetic';g.shadowBlur=0;g.letterSpacing='0px';
 const shade=g.createLinearGradient(w*.43,0,w*.64,0);shade.addColorStop(0,bg);shade.addColorStop(1,'rgba(10,10,10,0)');g.fillStyle=shade;g.fillRect(0,0,w*.64,h);logo(g,w,h,options);
 function wrap(copy,size,weight,maxWidth=width){font(g,size,weight);const rows=[];for(const paragraph of String(copy).split('\n')){let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){if(g.measureText(word).width>maxWidth){if(line){rows.push(line);line=''}let part='';for(const ch of word){if(part&&g.measureText(part+ch).width>maxWidth){rows.push(part);part=''}part+=ch}line=part;continue}const next=line?line+' '+word:word;if(line&&g.measureText(next).width>maxWidth){rows.push(line);line=word}else line=next}if(line)rows.push(line)}return rows}
 function layout(scale){const blocks=[],gap=14*u*scale;let y=logoBounds(w,h).y+logoBounds(w,h).height+32*u;
  function block(id,copy,size,weight=600,color='#F5F5F5',indent=0){if(!copy)return;size*=u*scale;const rows=wrap(copy,size,weight,width-indent),start=y;rows.forEach((t,i)=>{y+=size*1.23;blocks.push({id,firstRow:i===0,text:t,x:p+indent,y,size,weight,color})});y+=gap;return{start,end:y}}
  if($('showArrivalLabel').checked)block('status',sold?value('soldStatus'):value('arrivalLabel'),26,700,accent);
  if(visible('model'))block('model',(value('model')||'МОДЕЛЬ АВТО').toUpperCase(),60,900);
  if(!sold&&visible('trim'))block('trim',value('trim'),30,700,'#C5C5C5');
  if(!sold){const vals=values(visibility),size=27*u*scale,colWidth=(width-18*u)/2;for(let i=0;i<vals.length;i+=2){const pair=vals.slice(i,i+2),rows=pair.map(v=>wrap(v.text,size,600,colWidth-($('specIcons').checked?size*1.2:0))),height=Math.max(...rows.map(r=>r.length))*size*1.26;pair.forEach((v,c)=>rows[c].forEach((t,j)=>blocks.push({id:v.id,text:t,x:p+c*(colWidth+18*u)+($('specIcons').checked?size*1.2:0),y:y+size*1.26*(j+1),size,weight:600,color:'#A0A0A0',icon:j===0&&$('specIcons').checked?v.id:null})));y+=height+8*u*scale}if(vals.length)y+=gap;
   const feats=(visible('features')?value('features'):'').split('\n').map(s=>s.trim()).filter(Boolean);feats.forEach(t=>block('feature',t.toUpperCase(),27,600,'#F5F5F5',24*u));
   const old=visible('price')?money(value('price')):'',sale=visible('salePrice')?money(value('salePrice')):'';if(old||sale){block('price-label','ЦЕНА',22,600,'#A0A0A0');if(old&&sale)block('old-price',old,30,700,'#A0A0A0');block('price',sale||old,52,900)}
   if(visible('purchaseOption'))block('purchase',value('purchaseOption'),25);
  }else block('soldSubtitle',value('soldSubtitle'),27,600,'#A0A0A0');
  if(visible('cta'))block('cta',sold?value('soldCta'):value('cta'),26,700,accent);
  if(visible('location'))block('location',value('location'),25);if(visible('phone'))block('phone',value('phone'),26,700);
  return{blocks,bottom:y-gap,scale};
 }
 let plan=layout(1);while(plan.bottom>h-36*u&&plan.scale>.78)plan=layout(Math.max(.78,plan.scale-.02));const overflow=plan.bottom>h-36*u;
 g.canvas.titanLayoutReport={overflow,bottom:plan.bottom,scale:plan.scale,blocks:plan.blocks.map(({id,x,y,size,text})=>({id,x,y,size,text}))};
 for(const b of plan.blocks){font(g,b.size,b.weight);g.canvas.titanHolidayTextRects.push({x:b.x-6*u,y:b.y-b.size*1.15,w:g.measureText(b.text).width+12*u,h:b.size*1.5});g.fillStyle=b.color;if(b.id==='status'&&window.TitanPublication?.status(g,b.text,b.x,b.y,b.size,b.color,width,!sold))continue;
  if(b.icon){g.save();g.translate(b.x-b.size*1.2,b.y-b.size*.86);g.scale(b.size/24,b.size/24);g.strokeStyle=$('specIconLegacy').checked?(b.icon==='power'?value('accentColor'):'#F5F5F5'):value('specIconColor');g.lineWidth=3.2;g.lineCap='round';g.lineJoin='round';g.stroke(new Path2D(paths[b.icon]));g.restore()}
  if(b.id==='feature'&&b.firstRow){g.fillStyle=accent;g.beginPath();g.arc(p+5*u,b.y-b.size*.32,5*u,0,Math.PI*2);g.fill();g.fillStyle=b.color}g.fillText(b.text,b.x,b.y);if(b.id==='old-price'){g.strokeStyle=accent;g.lineWidth=3*u;g.beginPath();g.moveTo(b.x,b.y-b.size*.3);g.lineTo(b.x+g.measureText(b.text).width,b.y-b.size*.3);g.stroke()}
 }
 window.TitanPublication?.draw(g,w,h);g.restore();
}

return{values,facts,logo,logoBounds,panel,leftPanel,vehicleName,money,driveText};
})();
