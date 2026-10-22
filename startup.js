/* Publish only the assembled current interface, including the restored project. */
window.TitanAppReady=(async()=>{
 try{
  if(!window.TitanWorkspace||!window.TitanProjectReady)throw Error('Не удалось загрузить модули приложения');
  await Promise.all([TitanProjectReady,document.fonts.ready,window.TitanHolidayArt?.ready()]);
  document.documentElement.classList.remove('app-loading');
  await new Promise(resolve=>requestAnimationFrame(()=>{TitanWorkspace.refresh();draw();window.TitanSimplePreview?.fit();resolve()}));
  window.dispatchEvent(new Event('titan-app-ready'));return true;
 }catch(error){const panel=document.getElementById('appStartup');panel.querySelector('span').textContent='Не удалось открыть генератор. Обновите страницу. '+error.message;console.error('Startup:',error);return false}
})();
