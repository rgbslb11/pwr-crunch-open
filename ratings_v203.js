// POWER CRUNCH v2.0.3 runtime: direct Week-4 deployment ratings through Week 3.
(function(){
const PRODUCT_VERSION='PC-MOBILE-v2.0.3';
const DATA_VERSION='2026-postW3-gamecast-power-v1.1-fcs60';
const FCS=new Set(window.PC_FCS_CODES||[]);
const CFG={
  marginPerTeamRating:0.75,
  homeField:2.2,neutralField:0.0,
  baseTotal:54.0,unitTotalPerRating:1.0,
  baseSigma:4.4,qWeights:[0.24,0.26,0.24,0.26],
  scoreValues:[0,3,6,7,10,13,14,17,20,21,24,27,28,31,34,35],
  precip:{none:{score:1,var:1,label:'None'},light:{score:.97,var:1.05,label:'Light'},moderate:{score:.93,var:1.12,label:'Moderate'},heavy:{score:.88,var:1.20,label:'Heavy'}}
};
window.PC_ENGINE_VERSION=PRODUCT_VERSION;window.PC_DATA_VERSION=DATA_VERSION;window.PC_MARGIN_CONTROLS=CFG;
window.PC_MODEL_NAME='Post-W3 direct TEAM/OFF/DEF ratings + centered unit-total adjustment + environmental state';
const E=id=>document.getElementById(id);
human=function(field,t){return Math.max(60,Math.min(99,Math.round(t[field])));};
label=function(n){return n>=96?'National Elite':n>=92?'Elite':n>=88?'Excellent':n>=84?'Very Good':n>=80?'Strong':n>=76?'Above Average':n>=72?'Average':n>=68?'Below Average':n>=64?'Weak':'Bottom Tier';};
function controlState(){let temp=Number(E('temperature')?.value);if(!Number.isFinite(temp))temp=70;temp=Math.max(-20,Math.min(130,temp));const precip=CFG.precip[E('precipitation')?.value]?E('precipitation').value:'none';return{temp,precip,even:!!E('evenTeams')?.checked};}
function tempFactors(temp){let common=1,road=1,variance=1;if(temp>85){const x=Math.min(30,temp-85);common*=1-x*.0020;variance*=1+x*.0040;}if(temp>95){const x=Math.min(20,temp-95);road*=1-x*.0030;}if(temp<40){const x=Math.min(40,40-temp);common*=1-x*.0025;variance*=1+x*.0030;}if(temp<20){const x=Math.min(20,20-temp);common*=1-x*.0025;}return{common,road,variance};}
function buildEnvironment(s){const t=tempFactors(s.temp),p=CFG.precip[s.precip];return{...s,awayEfficiency:t.common*t.road*p.score,homeEfficiency:t.common*p.score,variance:t.variance*p.var,precipLabel:p.label};}
function controlEnvironment(){return buildEnvironment(controlState());}
function environment(){return (typeof S!=='undefined'&&S&&S.environment)?S.environment:controlEnvironment();}
function baseMatchup(a,h,n){
  const e=environment(),site=n?CFG.neutralField:CFG.homeField;
  const ratingGap=e.even?0:(h.overall-a.overall);
  const staticMargin=ratingGap*CFG.marginPerTeamRating+site;
  const unitSignal=e.even?0:(((h.offense-a.defense)+(a.offense-h.defense))/2);
  const unitTotalAdj=unitSignal*CFG.unitTotalPerRating;
  const tempoAdj=((a.tempo+h.tempo)-1.04)*14;
  let total=Math.max(2,CFG.baseTotal+tempoAdj+unitTotalAdj);
  total=Math.max(total,Math.abs(staticMargin)+2);
  let hp=(total+staticMargin)/2,ap=(total-staticMargin)/2;
  ap=Math.max(1,ap*e.awayEfficiency);hp=Math.max(1,hp*e.homeEfficiency);
  return{m:hp-ap,ap,hp,staticMargin,ratingGap,unitSignal,unitTotalAdj,tempoAdj,baseTotal:CFG.baseTotal,site,environment:e};
}
const pmfCache=new Map(),remCache=new Map();
function footballPMF(target,sigma){const maxV=CFG.scoreValues[CFG.scoreValues.length-1],t=Math.max(0,Math.min(maxV,target)),key=t.toFixed(5)+'|'+sigma.toFixed(4);if(pmfCache.has(key))return pmfCache.get(key);if(t<=1e-10){const p=[[0,1]];pmfCache.set(key,p);return p;}if(t>=maxV-1e-10){const p=[[maxV,1]];pmfCache.set(key,p);return p;}let lo=-100,hi=140;for(let i=0;i<64;i++){const c=(lo+hi)/2;let z=0,mean=0;for(const v of CFG.scoreValues){const w=Math.exp(-.5*Math.pow((v-c)/sigma,2));z+=w;mean+=v*w;}mean/=z;if(mean<t)lo=c;else hi=c;}const center=(lo+hi)/2;let z=0,raw=[];for(const v of CFG.scoreValues){const w=Math.exp(-.5*Math.pow((v-center)/sigma,2));raw.push([v,w]);z+=w;}const out=raw.map(([v,w])=>[v,w/z]);pmfCache.set(key,out);return out;}
function samplePMF(pmf,r){let u=r(),cum=0;for(const [v,p] of pmf){cum+=p;if(u<=cum)return v;}return pmf[pmf.length-1][0];}
function convolve(a,b){const out=new Map();for(const [sa,pa] of a)for(const [sb,pb] of b)out.set(sa+sb,(out.get(sa+sb)||0)+pa*pb);return out;}
function remainingPMF(teamTarget,qDone,sigma){const key=teamTarget.toFixed(5)+'|'+qDone+'|'+sigma.toFixed(4);if(remCache.has(key))return remCache.get(key);let out=new Map([[0,1]]);for(let q=qDone;q<4;q++)out=convolve(out,new Map(footballPMF(teamTarget*CFG.qWeights[q],sigma)));remCache.set(key,out);return out;}
function homeWinProbability(ap,hp,qDone=0,as=0,hs=0,sigma=CFG.baseSigma){const A=remainingPMF(ap,qDone,sigma),H=remainingPMF(hp,qDone,sigma);let home=0,tie=0;for(const [a,pa] of A)for(const [h,ph] of H){const af=as+a,hf=hs+h,p=pa*ph;if(hf>af)home+=p;else if(hf===af)tie+=p;}return Math.max(0,Math.min(1,home+.5*tie));}
matchup=function(a,h,n){const b=baseMatchup(a,h,n),sigma=CFG.baseSigma*b.environment.variance;return{...b,p:homeWinProbability(b.ap,b.hp,0,0,0,sigma),sigma};};
quarterPoints=function(team,opp,r,q){const p=matchup(S.a,S.h,S.n),target=team.short===S.a.short?p.ap:p.hp,mean=Math.max(0,target*(CFG.qWeights[q-1]||.25));return samplePMF(footballPMF(mean,p.sigma),r);};
addQuarter=function(q){let teams=S.r()<.5?[S.a,S.h]:[S.h,S.a];for(const team of teams){const opp=team===S.a?S.h:S.a,pts=quarterPoints(team,opp,S.r,q),labelRoll=S.r();if(team===S.a)S.aq[q-1]+=pts;else S.hq[q-1]+=pts;const as=sum(S.aq),hs=sum(S.hq),result=pts===0?(labelRoll<.6?'Punt':'Turnover'):pts===3?'Field Goal':pts%7===0?'Touchdown':`${pts} points`;S.possessions.push({quarter:q,offense:team.team,short:team.short,result,points:pts,awayScore:as,homeScore:hs,score:scoreLabel(as,hs)});E('log').insertAdjacentHTML('afterbegin',`<div class="drive"><b>Q${q} · ${team.short}</b> · ${result} · <strong>${scoreLabel(as,hs)}</strong></div>`);}};
live=function(){const p=matchup(S.a,S.h,S.n),as=sum(S.aq),hs=sum(S.hq),qDone=S.q,remA=p.ap*CFG.qWeights.slice(qDone).reduce((x,y)=>x+y,0),remH=p.hp*CFG.qWeights.slice(qDone).reduce((x,y)=>x+y,0);return{...p,m:(hs-as)+(remH-remA),ap:as+remA,hp:hs+remH,p:homeWinProbability(p.ap,p.hp,qDone,as,hs,p.sigma)};};
ratingCard=function(t){const nOverall=human('overall',t),nOff=human('offense',t),nDef=human('defense',t),src=FCS.has(t.short)?'Synthetic FCS floor':'Post-W3 deployment source';return`<div class="team-card"><h3>${t.team}</h3><div class="conf">${t.conference} · National #${R.overall[t.short]}</div><div class="rating-line"><span>Overall</span><b>${nOverall}</b><em>${label(nOverall)}</em></div><div class="rating-line"><span>Offense</span><b>${nOff}</b><em>${label(nOff)}</em></div><div class="rating-line"><span>Defense</span><b>${nDef}</b><em>${label(nDef)}</em></div><details><summary>Deployment details</summary><div class="raw">${src}<br>TEAM ${nOverall} · OFF ${nOff} · DEF ${nDef}<br>Margin bridge ${CFG.marginPerTeamRating.toFixed(2)} pts/rating · HFA ${CFG.homeField.toFixed(1)} pts</div></details></div>`;};
const oldStart=start;start=function(){const frozen=controlEnvironment();oldStart();if(S){S.environment={...frozen};render();}};E('start').onclick=start;
const oldAudit=audit;audit=function(){const x=oldAudit(),p=matchup(S.a,S.h,S.n);x.engineVersion=PRODUCT_VERSION;x.dataVersion=DATA_VERSION;x.ratingSource=window.PC_RATING_SOURCE;x.ratingSourceSha256=window.PC_RATING_SOURCE_SHA256;x.awayOverallRating=S.a.overall;x.homeOverallRating=S.h.overall;x.awayOffenseRating=S.a.offense;x.homeOffenseRating=S.h.offense;x.awayDefenseRating=S.a.defense;x.homeDefenseRating=S.h.defense;x.temperatureF=p.environment.temp;x.precipitation=p.environment.precip;x.evenTeams=p.environment.even;x.ratingGap=p.ratingGap;x.marginPerTeamRating=CFG.marginPerTeamRating;x.staticMarginBeforeEnvironment=p.staticMargin;x.unitTotalSignal=p.unitSignal;x.unitTotalAdjustment=p.unitTotalAdj;x.tempoTotalAdjustment=p.tempoAdj;x.projectionPolicy='TEAM rating controls margin; centered OFF/DEF cross-match signal changes total only; environment changes scoring efficiency/variance';x.fcsPolicy='All 13 synthetic FCS teams fixed at TEAM/OFF/DEF 60/60/60';return x;};
const priorAdvance=advance;advance=function(){if(S.q<4||sum(S.aq)!==sum(S.hq))return priorAdvance();S.ot++;let ap=3+(S.r()<.62?3:0)+(S.r()<.45?1:0),hp=3+(S.r()<.62?3:0)+(S.r()<.45?1:0);if(ap===hp){if(S.r()<.5)ap+=2;else hp+=2;}S.aq[3]+=ap;S.hq[3]+=hp;S.possessions.push({quarter:`OT${S.ot}`,offense:'Both',short:'OT',result:'Overtime',points:ap+hp,awayScore:sum(S.aq),homeScore:sum(S.hq),score:scoreLabel(sum(S.aq),sum(S.hq))});E('log').insertAdjacentHTML('afterbegin',`<div class="drive"><b>OT${S.ot}</b> · ${S.a.short} ${ap}, ${S.h.short} ${hp} · <strong>${scoreLabel(sum(S.aq),sum(S.hq))}</strong></div>`);render();};E('next').onclick=advance;
const priorReplayHistory=replayHistory;replayHistory=function(id){const g=getHistory().find(x=>x.simulationId===id);if(!g)return;if(g.dataVersion&&g.dataVersion!==DATA_VERSION){const ok=confirm('This audit was created with '+g.dataVersion+'. Re-simulating now uses '+DATA_VERSION+' and may not reproduce the archived score. Continue with the saved teams and seed?');if(!ok)return;}priorReplayHistory(id);};
function note(){const e=controlEnvironment(),el=E('environmentNote');if(el)el.textContent=`Environment: ${e.temp} F · ${e.precipLabel} precip · ${e.even?'Even-team ON':'Ratings ON'} · Away eff ${(e.awayEfficiency*100).toFixed(1)}% · Home eff ${(e.homeEfficiency*100).toFixed(1)}% · Variance x${e.variance.toFixed(2)}`;}for(const id of ['temperature','precipitation','evenTeams'])E(id)?.addEventListener('change',note);note();renderRatings();
})();
