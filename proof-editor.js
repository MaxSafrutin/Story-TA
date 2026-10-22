/* Final designs now live with proof/service materials. Renderers remain unchanged. */
(()=>{
 const proof=document.querySelector('[data-story-editor="proof"]'),final=document.createElement('section'),normal=document.createElement('section'),picker=document.createElement('div');
 final.id='finalStorySettings';normal.id='proofServiceSettings';
 while(proof.children.length>1)normal.append(proof.children[1]);
 picker.className='square-actions';picker.innerHTML='<button type="button" class="button primary" id="proofServiceTab">Пруф услуги</button><button type="button" class="button secondary" id="proofFinalTab">Финальная сторис</button>';
 proof.append(picker,normal,final);final.append($('promoStyle').closest('.field'));document.querySelectorAll('.promo-settings').forEach(p=>final.append(p));
 state.proofDesign='proof';
 function select(value){state.proofDesign=value==='final'?'final':'proof';final.hidden=state.proofDesign!=='final';normal.hidden=state.proofDesign==='final';$('proofServiceTab').setAttribute('aria-pressed',String(!normal.hidden));$('proofFinalTab').setAttribute('aria-pressed',String(!final.hidden));$('proofServiceTab').className='button '+(normal.hidden?'secondary':'primary');$('proofFinalTab').className='button '+(final.hidden?'secondary':'primary');draw();TitanAutosave.schedule()}
 $('proofServiceTab').onclick=()=>select('proof');$('proofFinalTab').onclick=()=>select('final');select('proof');
 window.TitanProof={select};
})();
