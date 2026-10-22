/* Download the current source canvas, independently of its device/platform shell. */
(()=>{
 if(!window.TitanExport)return;
 const actions=document.createElement('div');actions.id='previewDownloads';actions.className='export-actions';actions.innerHTML='<button id="previewPNG" class="button primary">Скачать PNG</button><button id="previewSquareZIP" class="button secondary" hidden>Все 9 квадратов · ZIP</button>';$('previewHint').before(actions);
 const status=document.createElement('p');status.id='previewDownloadStatus';status.setAttribute('role','status');actions.after(status);
 const toolbar=document.createElement('div');toolbar.id='previewToolbar';$('previewFrame').after(toolbar);toolbar.append($('previewSelectors'),$('previewEditTools'),actions);
 const squareTool=$('previewTools').querySelector('[data-preview-key="square"] button[aria-pressed]');if(squareTool){squareTool.id='squareCleanView';toolbar.append(squareTool);window.addEventListener('titan-material-selected',()=>squareTool.hidden=TitanWorkspace.snapshot().material!=='square');squareTool.hidden=TitanWorkspace.snapshot().material!=='square'}
 $('previewPNG').onclick=()=>TitanExport.single('image/png');$('previewSquareZIP').onclick=()=>$('squareZip').click();
 document.addEventListener('click',e=>{if(e.target.closest('#squareWall,.source-grid,#squareParts'))TitanExport.update()});
 window.TitanPreviewDownload={update(ready,c){$('previewPNG').disabled=!ready;const square=c.key==='square';$('previewPNG').textContent=square?'Кадр '+(c.index+1)+' · PNG':'Скачать PNG';$('previewSquareZIP').hidden=!square;$('previewSquareZIP').disabled=TitanExport.description('square').count<9;status.textContent=ready?'':square?'Для этого кадра нужны дополнительные фото':'Добавьте фото для текущего материала'}};
 const observer=new MutationObserver(()=>{if($('exportProgress').textContent)status.textContent=$('exportProgress').textContent});observer.observe($('exportProgress'),{childList:true,subtree:true,characterData:true});TitanExport.update();
})();
