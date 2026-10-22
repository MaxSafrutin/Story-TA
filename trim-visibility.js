(()=>{
 if(!window.TitanWorkspace)return;
 const field=$('trim').closest('.field'),toggle=$('show-trim');toggle.closest('.visibility-toggle,.field-toggle')?.setAttribute('hidden','');const label=document.createElement('label');label.className='check-control';label.innerHTML='<input id="trimMaterialVisible" type="checkbox">Показать комплектацию в этом материале';field.append(label);
 const hint=document.createElement('small');hint.textContent='Общая комплектация. Видимость включается отдельно в каждом материале.';field.append(hint);
 const key=()=>{const m=TitanWorkspace.snapshot().material;return ['formats','avito'].includes(m)?'format-'+TitanFormats.current:m};
 function sync(){const local=TitanWorkspace.snapshot().stage==='materials';label.hidden=!local;hint.textContent=local?'Видимость комплектации задаётся отдельно для этого материала.':'Общая комплектация автомобиля. Показ настраивается во вкладке «Автомобиль» выбранного материала.';$('trimMaterialVisible').checked=TitanProject.materialOptions[key()]?.trim??isOn('trim')}
 window.addEventListener('titan-workspace-changed',sync);
 $('trimMaterialVisible').onchange=e=>{TitanProject.materialOptions[key()]??={};TitanProject.materialOptions[key()].trim=e.target.checked;draw();TitanMaterialVisibility.sync();TitanAutosave.schedule()};window.addEventListener('titan-material-selected',sync);window.addEventListener('titan-project-change',sync);document.addEventListener('change',sync);sync();
})();
