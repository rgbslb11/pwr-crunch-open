// POWER CRUNCH v2.0.4 candidate overlay — HFA 2.5 + live advantage slider.
(function(){
const PRODUCT_VERSION='PC-MOBILE-v2.0.4-CANDIDATE';
const DATA_VERSION='2026-week4-v204-pending-canonical-ratings-advantage-slider';
const E=id=>document.getElementById(id);
const CFG={homeField:2.5,priorHomeField:2.2,neutralField:0,advMin:-3,advMax:3,advStep:1,qWeights:[0.24,0.26,0.24,0.26],scoreValues:[0,3,6,7,10,13,14,17,20,21,24,27,28,31,34,35],baseSigma:4.4};
window.PC_ENGINE_VERSION=PRODUCT_VERSION;
window.PC_DATA_VERSION=DATA_VERSION;
window.PC_ADVANTAGE_CONTROLS={...CFG,semantics:'negative favors Team A/away; positive favors Team B/home; additive expected-margin points; non-retroactive'};
if(window.PC_MARGIN_CONTROLS) window.PC_MARGIN_CONTROLS.homeField=CFG.homeField;

function clampAdv(v){v=Math.round(Number(v)||0);return Math.max(CFG.advMin,Math.min(CFG.advMax,v));}
function controlAdv(){return clampAdv(E('advantageSlider')?.value);}
function currentAdv(){return (typeof S!=='undefined'&&S&&Number.isFinite(S.manualAdvantage))?S.manualAdvantage:controlAdv();}
function selectedTeams(){
  if(typeof S!=='undefined'&&S)return{a:S.a,h:S.h};
  const av=E('away')?.value,hv=E('home')?.value;
  return{a:(typeof T!=='undefined'?T.find(t=>t.team===av):null),h:(typeof T!=='undefined'?T.find(t=>t.team===hv):null)};
}
function advText(v){
  const {a,h}=selectedTeams(),A=a?.short||'Team A',B=h?.short||'Team B';
  if(v<0)return A+' +'+Math.abs(v)+' pt'+(Math.abs(v)===1?'':'s');
  if(v>0)return B+' +'+v+' pt'+(v===1?'':'s');
  return 'EVEN';
}
function updateAdvUI(){
  const v=currentAdv(),out=E('advantageReadout');
  if(out)out.textContent=advText(v);
  const {a,h}=selectedTeams(),A=a?.short||'A',B=h?.short||'B';
  document.querySelectorAll('[data-adv-tick]').forEach(el=>{
    const x=Number(el.dataset.advTick);
    el.textContent=x<0?A+' +'+Math.abs(x):x>0?B+' +'+x:'0';
  });
}
const pmfCache=new Map(),remCache=new Map();
function footballPMF(target,sigma){
  const maxV=CFG.scoreValues[CFG.scoreValues.length-1],t=Math.max(0,Math.min(maxV,target)),key=t.toFixed(5)+'|'+sigma.toFixed(4);
  if(pmfCache.has(key))return pmfCache.get(key);
  if(t<=1e-10){const p=[[0,1]];pmfCache.set(key,p);return p;}
  if(t>=maxV-1e-10){const p=[[maxV,1]];pmfCache.set(key,p);return p;}
  let lo=-100,hi=140;
  for(let i=0;i<64;i++){const c=(lo+hi)/2;let z=0,mean=0;for(const s of CFG.scoreValues){const w=Math.exp(-.5*Math.pow((s-c)/sigma,2));z+=w;mean+=s*w;}mean/=z;if(mean<t)lo=c;else hi=c;}
  const center=(lo+hi)/2;let z=0,raw=[];
  for(const s of CFG.scoreValues){const w=Math.exp(-.5*Math.pow((s-center)/sigma,2));raw.push([s,w]);z+=w;}
  const out=raw.map(([s,w])=>[s,w/z]);pmfCache.set(key,out);return out;
}
function convolve(a,b){const out=new Map();for(const [sa,pa] of a)for(const [sb,pb] of b)out.set(sa+sb,(out.get(sa+sb)||0)+pa*pb);return out;}
function remainingPMF(teamTarget,qDone,sigma){
  const key=teamTarget.toFixed(5)+'|'+qDone+'|'+sigma.toFixed(4);
  if(remCache.has(key))return remCache.get(key);
  let out=new Map([[0,1]]);
  for(let q=qDone;q<4;q++)out=convolve(out,new Map(footballPMF(teamTarget*CFG.qWeights[q],sigma)));
  remCache.set(key,out);return out;
}
function homeWinProbability(ap,hp,qDone=0,as=0,hs=0,sigma=CFG.baseSigma){
  const A=remainingPMF(ap,qDone,sigma),H=remainingPMF(hp,qDone,sigma);let home=0,tie=0;
  for(const [aa,pa] of A)for(const [hh,ph] of H){const af=as+aa,hf=hs+hh,p=pa*ph;if(hf>af)home+=p;else if(hf===af)tie+=p;}
  return Math.max(0,Math.min(1,home+.5*tie));
}

const priorMatchup=matchup;
matchup=function(a,h,n){
  const b=priorMatchup(a,h,n);
  const adv=currentAdv();
  const hfaDelta=n?0:(CFG.homeField-CFG.priorHomeField);
  const marginShift=hfaDelta+adv;
  const total=Math.max(2,b.ap+b.hp);
  const targetMargin=b.m+marginShift;
  const ap=Math.max(1,(total-targetMargin)/2),hp=Math.max(1,(total+targetMargin)/2);
  const sigma=b.sigma||CFG.baseSigma;
  return{...b,ap,hp,m:hp-ap,p:homeWinProbability(ap,hp,0,0,0,sigma),manualAdvantage:adv,hfa: n?0:CFG.homeField,hfaDelta,baseMarginBeforeV204:b.m,staticMargin:(b.staticMargin??b.m)+marginShift};
};

const priorLive=live;
live=function(){
  const p=matchup(S.a,S.h,S.n),as=sum(S.aq),hs=sum(S.hq),qDone=S.q;
  const remA=p.ap*CFG.qWeights.slice(qDone).reduce((x,y)=>x+y,0),remH=p.hp*CFG.qWeights.slice(qDone).reduce((x,y)=>x+y,0);
  return{...p,m:(hs-as)+(remH-remA),ap:as+remA,hp:hs+remH,p:homeWinProbability(p.ap,p.hp,qDone,as,hs,p.sigma||CFG.baseSigma)};
};

const priorStart=start;
start=function(){
  const initial=controlAdv();
  priorStart();
  if(S){
    S.manualAdvantage=initial;
    S.advantageHistory=[{afterQuarter:0,effectiveFromQuarter:1,value:initial,label:advText(initial),at:new Date().toISOString()}];
    render();updateAdvUI();
  }
};
E('start').onclick=start;

let replayApplying=false;
function applyReplayAdvantageForNextQuarter(){
  if(!S?.replayAdvantageSchedule||S.q>=4)return;
  const next=S.q+1,events=S.replayAdvantageSchedule.filter(x=>Number(x.effectiveFromQuarter)===next);
  if(!events.length)return;
  const ev=events[events.length-1],v=clampAdv(ev.value);
  replayApplying=true;
  S.manualAdvantage=v;
  if(E('advantageSlider'))E('advantageSlider').value=String(v);
  updateAdvUI();
  replayApplying=false;
}

const priorAdvance=advance;
advance=function(){
  applyReplayAdvantageForNextQuarter();
  priorAdvance();
  updateAdvUI();
};
E('next').onclick=advance;

const slider=E('advantageSlider');
if(slider){
  slider.addEventListener('input',()=>{
    const v=controlAdv();
    if(S&&!finalNow()){
      S.manualAdvantage=v;
      if(!replayApplying){
        S.replayAdvantageSchedule=null;
        const event={afterQuarter:S.q,effectiveFromQuarter:Math.min(4,S.q+1),value:v,label:advText(v),at:new Date().toISOString()};
        const prev=S.advantageHistory?.[S.advantageHistory.length-1];
        if(!prev||prev.value!==v)S.advantageHistory=(S.advantageHistory||[]).concat(event);
      }
      render();
    }
    updateAdvUI();
  });
}
for(const id of ['away','home'])E(id)?.addEventListener('change',updateAdvUI);

const priorAudit=audit;
audit=function(){
  const x=priorAudit(),p=matchup(S.a,S.h,S.n);
  x.engineVersion=PRODUCT_VERSION;x.dataVersion=DATA_VERSION;
  x.homeField=CFG.homeField;x.neutralField=CFG.neutralField;
  x.manualAdvantageFinal=S.manualAdvantage??0;
  x.advantageHistory=(S.advantageHistory||[]).map(v=>({...v}));
  x.advantagePolicy='Slider -3..+3 expected-margin points; negative favors Team A/away, positive favors Team B/home; changes affect only future simulation state';
  x.adjustedStaticMargin=p.staticMargin;
  return x;
};

replayHistory=function(id){
  const g=getHistory().find(x=>x.simulationId===id);if(!g)return;
  E('away').value=g.away;E('home').value=g.home;E('seed').value=g.seed;E('neutral').checked=g.neutral;
  const schedule=Array.isArray(g.advantageHistory)?g.advantageHistory:[];
  const initial=schedule.length?clampAdv(schedule[0].value):0;
  if(slider)slider.value=String(initial);
  document.querySelector('[data-tab="game"]').click();
  start();
  if(S){S.replayAdvantageSchedule=schedule.map(v=>({...v}));S.advantageHistory=schedule.length?[{...schedule[0]}]:[];}
  updateAdvUI();
};

const priorRatingCard=ratingCard;
ratingCard=function(t){return priorRatingCard(t).replace(/HFA 2\.2 pts/g,'HFA 2.5 pts');};

window.PC_MODEL_NAME=(window.PC_MODEL_NAME||'POWER CRUNCH')+' + v2.0.4 live advantage slider';
updateAdvUI();
})();