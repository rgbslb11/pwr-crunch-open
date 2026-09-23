// POWER CRUNCH v2.0.4.1 candidate — Q3/Q4 Comeback Assist overlay.
(function(){
const PRODUCT_VERSION='PC-MOBILE-v2.0.4.1-CANDIDATE';
const DATA_VERSION='2026-week4-v204-comeback-q3q4';
const E=id=>document.getElementById(id);
const CFG={
  q3Divisor:10.0,q3Cap:2.0,
  q4Divisor:7.0,q4Cap:3.0,
  combinedCap:3.0
};
window.PC_ENGINE_VERSION=PRODUCT_VERSION;
window.PC_DATA_VERSION=DATA_VERSION;
window.PC_COMEBACK_CONTROLS={
  quarters:[3,4],
  q3:'k=min(2.0, deficit/10)',
  q4:'k=min(3.0, deficit/7)',
  combination:'manual slider signed level + comeback signed level, clamped to +/-3',
  semantics:'trailing team receives model-native reciprocal strength assistance; completed quarters are never rewritten'
};

function controlEnabled(){return !!E('comebackToggle')?.checked;}
function enabled(){return (typeof S!=='undefined'&&S&&typeof S.comebackEnabled==='boolean')?S.comebackEnabled:controlEnabled();}
function baseManual(){
  if(typeof S!=='undefined'&&S&&Number.isFinite(S.manualAdvantage))return S.manualAdvantage;
  return Number(E('advantageSlider')?.value)||0;
}
function clampCombined(v){return Math.max(-CFG.combinedCap,Math.min(CFG.combinedCap,v));}
function stateFor(q,as,hs){
  if(!enabled()||(q!==3&&q!==4)||as===hs)return{quarter:q,active:false,signed:0,k:0,deficit:Math.abs(as-hs),trailing:null};
  const awayTrails=as<hs,deficit=Math.abs(as-hs);
  const k=q===3?Math.min(CFG.q3Cap,deficit/CFG.q3Divisor):Math.min(CFG.q4Cap,deficit/CFG.q4Divisor);
  return{quarter:q,active:k>0,signed:awayTrails?-k:k,k,deficit,trailing:awayTrails?'away':'home'};
}
function prospectiveState(){
  if(typeof S==='undefined'||!S)return{quarter:0,active:false,signed:0,k:0,deficit:0,trailing:null};
  if(S._comebackSimState)return S._comebackSimState;
  const next=S.q+1;
  return stateFor(next,sum(S.aq),sum(S.hq));
}
function updateUI(){
  const note=E('comebackNote');if(!note)return;
  if(!enabled()){note.textContent='Comeback Assist OFF';return;}
  if(typeof S==='undefined'||!S){note.textContent='Comeback Assist ARMED · dormant until Q3';return;}
  const st=prospectiveState();
  if(S.q<2){note.textContent='Comeback Assist ARMED · activates no earlier than Q3';return;}
  if(S.q>=4){note.textContent='Comeback Assist complete';return;}
  if(!st.active){note.textContent='Comeback Assist ARMED · next quarter has no boost (game tied)';return;}
  const team=st.trailing==='away'?S.a.short:S.h.short;
  note.textContent='Q'+st.quarter+' comeback: '+team+' +'+st.k.toFixed(2)+' equivalent strength · deficit '+st.deficit;
}

const priorMatchup=matchup;
matchup=function(a,h,n){
  const st=prospectiveState(),manual=baseManual();
  if(typeof S==='undefined'||!S||!st.active){
    const p=priorMatchup(a,h,n);
    return{...p,manualAdvantageBase:manual,comebackActive:false,comebackSigned:0,comebackEquivalent:0,combinedAdvantage:manual};
  }
  const original=S.manualAdvantage,combined=clampCombined(manual+st.signed);
  S.manualAdvantage=combined;
  let p;
  try{p=priorMatchup(a,h,n);}finally{S.manualAdvantage=original;}
  return{...p,manualAdvantageBase:manual,comebackActive:true,comebackQuarter:st.quarter,comebackSigned:st.signed,comebackEquivalent:st.k,comebackDeficit:st.deficit,comebackTrailing:st.trailing,combinedAdvantage:combined};
};

const priorRender=render;
render=function(){priorRender();updateUI();};

const priorStart=start;
start=function(){
  const initial=controlEnabled();
  priorStart();
  if(S){
    S.comebackEnabled=initial;
    S.comebackHistory=[{afterQuarter:0,effectiveFromQuarter:1,enabled:initial,at:new Date().toISOString()}];
    updateUI();
  }
};
E('start').onclick=start;

let replayApplying=false;
function recordToggle(){
  const on=controlEnabled();
  if(S&&!finalNow()){
    S.comebackEnabled=on;
    if(!replayApplying){
      S.replayComebackSchedule=null;
      const ev={afterQuarter:S.q,effectiveFromQuarter:Math.min(4,S.q+1),enabled:on,at:new Date().toISOString()};
      const prev=S.comebackHistory?.[S.comebackHistory.length-1];
      if(!prev||prev.enabled!==on)S.comebackHistory=(S.comebackHistory||[]).concat(ev);
    }
    render();
  }else updateUI();
}
E('comebackToggle')?.addEventListener('change',recordToggle);

function applyReplayToggle(next){
  if(!S?.replayComebackSchedule)return;
  const events=S.replayComebackSchedule.filter(x=>Number(x.effectiveFromQuarter)===next);
  if(!events.length)return;
  const ev=events[events.length-1];
  replayApplying=true;S.comebackEnabled=!!ev.enabled;
  if(E('comebackToggle'))E('comebackToggle').checked=!!ev.enabled;
  replayApplying=false;
}
const priorAdvance=advance;
advance=function(){
  if(!S)return priorAdvance();
  const next=S.q+1;
  applyReplayToggle(next);
  S._comebackSimState=stateFor(next,sum(S.aq),sum(S.hq));
  priorAdvance();
  S._comebackSimState=null;
  if(S)render();
};
E('next').onclick=advance;

const priorAudit=audit;
audit=function(){
  const x=priorAudit(),st=prospectiveState();
  x.engineVersion=PRODUCT_VERSION;x.dataVersion=DATA_VERSION;
  x.comebackEnabledFinal=!!S.comebackEnabled;
  x.comebackHistory=(S.comebackHistory||[]).map(v=>({...v}));
  x.comebackPolicy='Q3 k=min(2,deficit/10); Q4 k=min(3,deficit/7); signed toward trailing team; added to manual slider then clamped to +/-3; no retroactive scoring changes';
  x.comebackNextState={...st};
  return x;
};

const priorReplayHistory=replayHistory;
replayHistory=function(id){
  const g=getHistory().find(x=>x.simulationId===id);if(!g)return;
  const schedule=Array.isArray(g.comebackHistory)?g.comebackHistory:[];
  const initial=schedule.length?!!schedule[0].enabled:false;
  if(E('comebackToggle'))E('comebackToggle').checked=initial;
  priorReplayHistory(id);
  if(S){
    S.comebackEnabled=initial;
    S.replayComebackSchedule=schedule.map(v=>({...v}));
    S.comebackHistory=schedule.length?[{...schedule[0]}]:[{afterQuarter:0,effectiveFromQuarter:1,enabled:initial,at:new Date().toISOString()}];
    updateUI();
  }
};

window.PC_MODEL_NAME=(window.PC_MODEL_NAME||'POWER CRUNCH')+' + Q3/Q4 Comeback Assist';
updateUI();
})();