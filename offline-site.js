/* Hosted offline use after the first successful cache; file:// needs no server. */
if(location.protocol!=='file:'&&'serviceWorker'in navigator){
 window.TitanOfflineReady=navigator.serviceWorker.register('./service-worker.js').then(()=>navigator.serviceWorker.ready).catch(e=>console.warn('Offline cache:',e.message));
}
