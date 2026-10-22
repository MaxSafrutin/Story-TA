/* Preserve the independent print editor through JSON, autosave and batch work. */
(()=>{
 let print=null,common=null;
 function extras(){const c=TitanExchange.fromEditor({...collectEditorData(),...(!window.TitanWorkspace?{saleStatus:$('soldMode').checked?'sold':TitanFormats.config.stamp==='reserved'?'reserved':'available'}:{})},state.projectId||common?.id||'',TitanFormats.config.stamp);if(common?.phone===c.phone)c.managerName=common.managerName;return{sharedVehicle:c,...(print?{priceTag:structuredClone(print)}:{})}}
 function retain(data){print=data.priceTag?{version:1,state:TitanExchange.priceState(data.priceTag.state)}:null;common=data.sharedVehicle?TitanExchange.validateCard(data.sharedVehicle):null}
 const build=buildProjectData;buildProjectData=async()=>({...await build(),...extras()});
 const snap=TitanProject.snapshot;TitanProject.snapshot=()=>({...snap(),...extras()});
 const restore=TitanProject.restore;TitanProject.restore=async data=>{const previous={print,common};retain(data);try{await restore(data)}catch(e){({print,common}=previous);throw e}};
 const commit=TitanFormats.commitProject;TitanFormats.commitProject=async(data,prepared)=>{await commit(data,prepared);retain(data)};
 const record=currentBatchRecord;currentBatchRecord=(...a)=>({...record(...a),...extras()});
 const load=loadBatchRecord;loadBatchRecord=async(...a)=>{await load(...a);retain(a[0]||{})};
})();
