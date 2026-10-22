/* Every renderer observes the same source identities and replacement URLs. */
(()=>{
 if(!window.TitanWorkspace)return;let signature='',pending=false;
 function refresh(){const next=state.photos.map(p=>p.id+':'+p.url).join('|');if(next===signature)return;signature=next;if(pending)return;pending=true;queueMicrotask(()=>{pending=false;window.syncSquarePhotos?.();TitanCoverProject.refresh(true);TitanFormats.refreshSources();window.dispatchEvent(new Event('titan-media-change'));TitanWorkspace.refresh()})}
 const previous=renderThumbs;renderThumbs=function(){previous();refresh()};window.addEventListener('titan-operation-end',refresh);window.addEventListener('DOMContentLoaded',refresh);
 window.TitanMediaSync={refresh};
})();
