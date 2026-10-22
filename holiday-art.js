/* Photographic foreground assets and adaptive greeting typography. */
(()=>{
 const assets={},keys=['winter','defender','spring','motorist','victory'];
 const scriptFont=new FontFace('Titan Holiday Script','url('+window.TITAN_HOLIDAY_SCRIPT_FONT+')');const fontReady=scriptFont.load().then(font=>document.fonts.add(font));
 const loaded=Promise.all(keys.map(key=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{assets[key]=image;resolve()};image.onerror=()=>reject(Error('Не удалось загрузить праздничное оформление: '+key));image.src=window.TITAN_HOLIDAY_ART_DATA[key]})));
 function keyFor(holiday){return ['winter','christmas'].includes(holiday.theme)?'winter':['star','flag'].includes(holiday.theme)?'defender':holiday.theme==='victory'?'victory':holiday.theme==='car'?'motorist':'spring'}
 function heading(g,w,h,holiday,layout){const portrait=h/w>1.5,leftPanel=layout.leftPanel,photoWidth=layout.id==='story'&&layout.vehicle?w*.72:w;
  const x=leftPanel?w*.55:photoWidth*.35,y=h*.035,width=leftPanel?w*.40:photoWidth*.60,height=Math.min(h*(portrait?.14:.22),w*.29);
  if(layout.special)return;g.save();g.textAlign='center';g.textBaseline='middle';g.translate(x+width/2,y+height/2);g.rotate(-.045);
  /*const halo=g.createRadialGradient(0,0,0,0,0,width*.62);halo.addColorStop(0,'rgba(255,250,236,.82)');halo.addColorStop(.7,'rgba(255,250,236,.48)');halo.addColorStop(1,'rgba(255,250,236,0)');g.fillStyle=halo;g.fillRect(-width*.65,-height*.70,width*1.30,height*1.4);*/
  let lines=holiday.caption.replace(/!$/,'').split(' '),first='',last='';
  if(holiday.theme==='winter'&&holiday.caption.includes('Новым годом')){first=holiday.caption.includes('наступающим')?'С наступающим':'С наступившим';last='Новым годом!'}
  else if(holiday.theme==='star'){first='С 23';last='Февраля!'}
  else if(holiday.caption==='С 8 Марта!'){first='С 8';last='Марта!'}
  else if(holiday.theme==='victory'){first='С Днём';last='Победы!'}
  else if(holiday.theme==='car'){first='С Днём';last='автомобилиста!'}
  else{const mid=Math.ceil(lines.length/2);first=lines.slice(0,mid).join(' ');last=lines.slice(mid).join(' ')+'!';if(!lines.slice(mid).length){last=first+'!';first=''}}
  const ink=holiday.theme==='victory'?'#9d161b':holiday.theme==='spring'||holiday.theme==='heart'?'#cb2f60':holiday.theme==='car'?'#d31c28':'#b98725';
  function line(copy,yy,size,color,gold=false){if(!copy)return;g.font=size+'px "Titan Holiday Script", cursive';while(g.measureText(copy).width>width&&size>12){size--;g.font=size+'px "Titan Holiday Script", cursive'}
   const grad=g.createLinearGradient(0,yy-size/2,0,yy+size/2);grad.addColorStop(0,'#fff2b5');grad.addColorStop(.35,'#e5b94e');grad.addColorStop(.65,'#b87718');grad.addColorStop(1,'#f4d682');g.fillStyle=gold?grad:color;g.shadowColor='rgba(255,255,255,.9)';g.shadowBlur=5;g.lineWidth=Math.max(1,w/850);g.strokeStyle='rgba(255,248,230,.75)';g.strokeText(copy,0,yy);g.fillText(copy,0,yy);g.shadowBlur=0}
  line(first,-height*.25,height*.52,ink,holiday.theme==='star');line(last,height*.22,height*.79,holiday.theme==='car'?'#18232c':ink,holiday.theme==='winter'||holiday.theme==='christmas');
  g.strokeStyle=ink;g.lineWidth=Math.max(1.5,w*.002);g.beginPath();g.moveTo(-width*.32,height*.54);g.quadraticCurveTo(0,height*.40,width*.32,height*.45);g.stroke();g.restore();
 }
 function paint(g,w,h,holiday,layout={}){const im=assets[keyFor(holiday)];if(!im)return;
  const layer=document.createElement('canvas');layer.width=w;layer.height=h;const c=layer.getContext('2d');
  const sw=im.naturalWidth,sh=im.naturalHeight,portrait=h/w>1.5;
  // Separate edge bands keep decorations visible on both tall stories and wide covers.
  if(portrait)c.drawImage(im,0,0,w,h);
  else{
   function piece(sx,sy,ww,hh,x,y,dw,dh,edges){const p=document.createElement('canvas');p.width=Math.ceil(dw);p.height=Math.ceil(dh);const q=p.getContext('2d');q.drawImage(im,sx,sy,ww,hh,0,0,dw,dh);q.globalCompositeOperation='destination-in';const fx=Math.min(dw*.28,w*.05),fy=Math.min(dh*.25,h*.05);if(edges.includes('l')||edges.includes('r')){const v=q.createLinearGradient(0,0,dw,0);v.addColorStop(0,edges.includes('l')?'transparent':'#000');v.addColorStop(fx/dw,'#000');v.addColorStop(1-fx/dw,'#000');v.addColorStop(1,edges.includes('r')?'transparent':'#000');q.fillStyle=v;q.fillRect(0,0,dw,dh)}if(edges.includes('t')||edges.includes('b')){const v=q.createLinearGradient(0,0,0,dh);v.addColorStop(0,edges.includes('t')?'transparent':'#000');v.addColorStop(fy/dh,'#000');v.addColorStop(1-fy/dh,'#000');v.addColorStop(1,edges.includes('b')?'transparent':'#000');q.fillStyle=v;q.fillRect(0,0,dw,dh)}c.drawImage(p,x,y)}
   const topK=Math.min(w/sw,h*.26/(sh*.30)),bottomK=Math.min(w/sw,h*.30/(sh*.35)),bh=sh*.35*bottomK,bw=sw*.50*bottomK;
   piece(0,0,sw*.56,sh*.32,0,0,sw*.56*topK,sh*.32*topK,'rb');
   piece(sw*.56,0,sw*.44,sh*.12,w-sw*.44*topK,0,sw*.44*topK,sh*.12*topK,'lb');
   piece(0,sh*.65,sw*.50,sh*.35,0,h-bh,bw,bh,'rt');
   piece(sw*.50,sh*.65,sw*.50,sh*.35,w-bw,h-bh,bw,bh,'lt');
   piece(sw*.20,sh*.94,sw*.60,sh*.06,bw*.6,h-sh*.06*bottomK,w-bw*1.20,sh*.06*bottomK,'lrt');
  }
  heading(c,w,h,holiday,layout);
  // Cut soft windows around all text measured by the existing vehicle renderer.
  const mask=document.createElement('canvas');mask.width=w;mask.height=h;const m=mask.getContext('2d');m.fillStyle='#fff';const pad=Math.max(8,w*.012);
  for(const r of layout.rects||[])m.fillRect(r.x-pad,r.y-pad,r.w+pad*2,r.h+pad*2);
  const logo=layout.logo;if(logo)m.fillRect(logo.x-pad,logo.y-pad,logo.width+pad*2,logo.height+pad*2);
  if(layout.special)m.fillRect(w*.06,h*.15,w*.88,h*.78);
  c.save();c.globalCompositeOperation='destination-out';c.filter='blur('+Math.max(8,w*.012)+'px)';c.drawImage(mask,0,0);
  c.restore();g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.drawImage(layer,0,0);g.restore();
 }
 window.TitanHolidayArt={ready:()=>Promise.all([loaded,fontReady]),paint,keyFor};loaded.catch(e=>console.error(e.message));
})();
