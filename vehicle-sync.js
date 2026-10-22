/* All vehicle editors write to the story form, the project's canonical data. */
(()=>{
const hero=$('squareHeroEditor'),mapping={year:'year',mileage:'mileage',fuel:'fuel',transmission:'gearbox',displacement:'volume',power:'power',drive:'drive'};
const hosts=[hero.querySelector('.editor-settings-body'),$('coverVehicleFields'),$('sharedFields')];
function write(id,text){$(id).value=text.slice(0,$(id).maxLength>0?$(id).maxLength:2000);$(id).dispatchEvent(new Event('input',{bubbles:true}))}
function sharedField(host,id,title){const existing=host.querySelector(`[data-shared="${id}"],#cover-${id}`);if(existing)return;const l=document.createElement('label');l.className='field';const t=document.createElement('span');t.textContent=title;const main=$(id),input=document.createElement(main.tagName==='TEXTAREA'?'textarea':'input');input.dataset.shared=id;input.maxLength=main.maxLength>0?main.maxLength:2000;input.value=main.value;if(input.tagName==='TEXTAREA')input.rows=2;input.oninput=()=>write(id,input.value);l.append(t,input);host.append(l)}
for(const host of hosts){
for(const [id,title]of Object.entries({arrivalLabel:'Статус публикации',price:'Цена',salePrice:'Цена со скидкой',features:'Преимущества — до 6 строк',purchaseOption:'Вариант приобретения',cta:'Призыв',soldCta:'Призыв для проданного автомобиля',location:'Адрес',phone:'Телефон'}))sharedField(host,id,title);
for(const [key,title]of [['prices','Показывать цену'],['specIcons','Микроиконки вместо |'],['soldMode','Автомобиль продан']]){const l=document.createElement('label');l.className='check-control';const c=document.createElement('input');c.type='checkbox';c.dataset.vehicleOption=key;const t=document.createElement('span');t.textContent=title;c.oninput=c.onchange=()=>{const on=c.checked;if(key==='prices'){for(const id of ['price','salePrice'])$('show-'+id).checked=on;for(const id of ['price','salePrice'])$('show-'+id).dispatchEvent(new Event('change',{bubbles:true}))}else{$(key).checked=on;$(key).dispatchEvent(new Event('change',{bubbles:true}))}};l.append(c,t);host.append(l)}
}
const drive=document.createElement('label');drive.className='field';drive.innerHTML='<span>Привод</span><input data-hero="drive" maxlength="40">';hero.querySelector('.grid').append(drive);
hero.querySelectorAll('[data-hero]').forEach(input=>{const key=input.dataset.hero,id=mapping[key];input.maxLength=id?($(id).maxLength>0?$(id).maxLength:60):100;input.oninput=()=>{if(id)write(id,input.value);else write('model',[hero.querySelector('[data-hero="brand"]').value,hero.querySelector('[data-hero="model"]').value].filter(Boolean).join(' '))}});
// Match the per-field visibility switches everywhere, without discarding values.
for(const host of hosts)for(const input of host.querySelectorAll('input:not([type=checkbox]),textarea')){
const key=input.dataset.shared||mapping[input.dataset.hero]||(input.id.startsWith('cover-')?input.id.slice(6):'');if(!$('show-'+key))continue;
const l=input.closest('.field'),title=l?.querySelector('span');if(!title)continue;const span=document.createElement('span');span.className='field-toggle';const c=document.createElement('input');c.type='checkbox';c.dataset.sharedVisible=key;c.setAttribute('aria-label','Показывать '+title.textContent);c.oninput=c.onchange=()=>{$('show-'+key).checked=c.checked;$('show-'+key).dispatchEvent(new Event('change',{bubbles:true}))};span.append(c,document.createTextNode(' вкл.'));title.append(span);
}
function sync(){
const identity=TitanVehicleDesign.vehicleName();
document.querySelectorAll('[data-vehicle-option]').forEach(c=>c.checked=c.dataset.vehicleOption==='prices'?isOn('price')||isOn('salePrice'):$(c.dataset.vehicleOption).checked);
document.querySelectorAll('[data-shared]').forEach(i=>{if(document.activeElement!==i)i.value=$(i.dataset.shared).value});
document.querySelectorAll('[data-shared-visible]').forEach(c=>{c.checked=isOn(c.dataset.sharedVisible);c.closest('.field')?.classList.toggle('is-off',!c.checked)});
hero.querySelectorAll('[data-hero]').forEach(i=>{if(document.activeElement!==i)i.value=mapping[i.dataset.hero]?$(mapping[i.dataset.hero]).value:identity[i.dataset.hero]||''});
window.TitanCoverProject?.refresh();window.TitanSquareProject?.refresh();
}
$('squareHeroSync').hidden=true;const oldParse=parseAd;
parseAd=function(){
oldParse();const raw=$('sourceText').value,patterns={volume:/\b([1-9][.,]\d)\s*(?:л\b|л(?=\s|[,;|])|бенз|диз|AT\b|MT\b|CVT\b)|(?:объ[её]м|двигатель)\s*[:—-]?\s*([1-9][.,]\d)/i,fuel:/(бензин|дизель|гибрид|электро\S*)/i,drive:/(4WD|AWD|FWD|RWD|передний|задний|полный)(?:\s+привод)?/i,gearbox:/(автомат|АКПП|вариатор|CVT|механика|МКПП|робот|DSG|\bAT\b|\bMT\b)/i,power:/(\d{2,4})\s*(?:л\.?\s*с\.?|hp\b)/i};
for(const [id,re]of Object.entries(patterns)){const m=raw.match(re);$(id).value=m?.[1]||m?.[2]||''}
const rows=raw.split(/\n+/).map(clean).filter(Boolean),nameLine=rows.find(v=>!/^в\s+продаже|^новое\s+поступление|^продано|^забронировано|^снижение|^цена|^телефон|^пробег|^год|^двигатель|^объ[её]м|^коробка|^привод|^мощность/i.test(v)&&/^[A-Za-zА-Яа-яЁё]/.test(v)&&!/[₽]|\+7|\bкм\b/i.test(v));
if(nameLine)$('model').value=nameLine.replace(/\b(?:19|20)\d{2}\b.*$/,'').replace(/[\s,·|—-]+$/,'').toUpperCase().slice(0,100);
const mileage=raw.match(/пробег\s*[:—-]?\s*([\d\s.,]+)\s*(км|тыс(?:\.?\s*км)?|т\.?\s*км)/i);if(mileage){let n=mileage[1].trim().replace(/\s/g,'').replace(',','.');if(/тыс|т\./i.test(mileage[2]))n=String(Math.round(Number(n)*1000));else n=n.replace(/[.,]/g,'');$('mileage').value=n.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' км'}
const specOnly=/^(?:пробег|год|двигатель|объ[её]м|коробка|привод|мощность|тип топлива|топливо)(?:\s|[:—-]|$)/i;
$('features').value=$('features').value.split('\n').filter(v=>v!==nameLine?.toUpperCase()&&!specOnly.test(v)&&!((/л\.?\s*с|бензин|дизель|АКПП|4WD|AWD/i.test(v))&&v.length<70)).join('\n');save();draw();
};$('parseBtn').onclick=parseAd;
const prior=draw;draw=function(){prior();sync()};
document.addEventListener('input',sync);document.addEventListener('change',sync);
window.TitanInitialized.then(()=>{sync();draw()});
window.TitanVehicleSync={sync};
})();


