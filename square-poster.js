/* Clean square photographs; only the first frame has brand typography. */
window.TitanSquareDesign={render(canvas,index,tile,o){
const g=canvas.getContext('2d',{willReadFrequently:true}),S=1080,d={panelX:0,panelY:0,panelScale:1,...tile.design};
g.save();g.resetTransform();g.filter='none';g.shadowBlur=0;g.letterSpacing='0px';g.textAlign='left';g.textBaseline='alphabetic';g.fillStyle='#0A0A0A';g.fillRect(0,0,S,S);
function photo(q,x,y,w,h){g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle='#1A1A1A';g.fillRect(x,y,w,h);if(q.image){const a=(+q.rotation||0)*Math.PI/180,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a)),iw=q.image.width,ih=q.image.height,base=q.fit==='contain'?Math.min(w/(iw*c+ih*s),h/(iw*s+ih*c)):Math.max((w*c+h*s)/iw,(w*s+h*c)/ih),z=base*(q.zoom||1),dw=iw*z,dh=ih*z,corr=q.correction||{};g.translate(x+w/2+(q.x||0)*Math.max(0,dw*c+dh*s-w)/2,y+h/2+(q.y||0)*Math.max(0,dw*s+dh*c-h)/2);g.rotate(a);g.filter=`brightness(${corr.brightness??1}) contrast(${corr.contrast??1}) saturate(${corr.saturation??1})`;g.drawImage(q.image,-dw/2,-dh/2,dw,dh);g.filter='none';if(corr.temperature){g.globalCompositeOperation='source-atop';g.fillStyle=corr.temperature>0?`rgba(255,128,40,${corr.temperature*.07})`:`rgba(70,120,210,${-corr.temperature*.07})`;g.fillRect(-dw/2,-dh/2,dw,dh)}}else{g.fillStyle='#A0A0A0';g.font='500 26px Inter,Arial';g.textAlign='center';g.fillText('＋ ФОТО',x+w/2,y+h/2);g.textAlign='left'}g.restore()}

if(tile.parts)tile.parts.forEach((q,j)=>photo(q,j%2*540,Math.floor(j/2)*540,540,540));else photo(tile,0,0,1080,1080);
function block(value,x,y,size,width,max=3,weight=900,color='#F5F5F5'){let rows;do{g.font=`${weight} ${size}px ${weight>=800?'Montserrat':'Inter'},Arial`;rows=[];for(const p of String(value||'').split('\n')){let line='';for(const word of p.split(/\s+/).filter(Boolean)){const next=line?line+' '+word:word;if(g.measureText(next).width>width&&line){rows.push(line);line=word}else line=next}if(line)rows.push(line)}if(rows.length<=max&&rows.every(v=>g.measureText(v).width<=width)||size<=12)break;size--}while(true);g.fillStyle=color;rows.forEach(v=>{g.fillText(v,x,y+size*.83);y+=size*1.06});return y}

if(o.showText)TitanVehicleDesign.panel(g,1080,1080,{material:'square',titleSize:54+(o.font-24)*.55,logo:tile.logoEnabled?tile.logoImage:null});
g.restore();
}};
