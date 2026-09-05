// POWER CRUNCH v2.0.2.3 temporal admission governor.
// Governance decision: admit only 1/9 of Week-1 movement from preseason Board I-K to raw post-W1 state.
(function(){
const PRODUCT_VERSION='PC-MOBILE-v2.0.2.3';
const DATA_VERSION='2026-week2-eloK70-pscore04-env2022-w1gov111';
const WEEK1_WEIGHT=1/9;
const DEFAULT_LATER_WEEK_WEIGHT=1/6;
const P=window.PC_PROFILE_MAP;
if(!P) throw new Error('v2.0.2.3 governor requires PC_PROFILE_MAP');
const PRE={USC:0.7168186668100102,UVA:0.6781795285792172,VAN:0.6617590140832512,UNC:0.4502719249889766,TCU:0.5941094204328974,FSU:0.4718778582376864,NCSU:0.5176188159181938,MEM:0.4361337635676524,ARK:0.4361530366318503,STAN:0.4171287165857034,UK:0.4701186364549718,WVU:0.32117282529108,COR:0.3297598488645677,HAW:0.3364228697193304,NMSU:0.3270540540540541,SJSU:0.2894404497472096,YALE:0.2897780105451401,UNLV:0.3078965485905528};
const affected=[],missing=[];
for(const [code,v] of Object.entries(P)){
 v.pPostW1Raw=v.p;v.pEffective=v.p;
 if(v.w1===1){if(PRE[code]===undefined){missing.push(code);continue;}const pre=PRE[code],raw=v.p,delta=raw-pre,effective=pre+WEEK1_WEIGHT*delta;v.pPreseason=pre;v.pWeek1DeltaRaw=delta;v.pWeek1DeltaAdmitted=WEEK1_WEIGHT*delta;v.pEffective=effective;v.p=effective;affected.push(code);}
}
if(missing.length) throw new Error('v2.0.2.3 governor missing preseason powers for: '+missing.join(','));
try{const ranked=Object.entries(P).filter(([,v])=>v.r!==null&&Number.isFinite(v.p)).sort((a,b)=>b[1].p-a[1].p);ranked.forEach(([code,v],i)=>{v.rEffective=i+1;if(typeof R!=='undefined'&&R.overall)R.overall[code]=i+1;});}catch(e){console.warn('v2.0.2.3 rank refresh skipped',e);}
window.PC_ENGINE_VERSION=PRODUCT_VERSION;window.PC_DATA_VERSION=DATA_VERSION;window.PC_TEMPORAL_CONTROLS={week1AdmissionWeight:WEEK1_WEIGHT,defaultLaterWeekWeight:DEFAULT_LATER_WEEK_WEIGHT,affectedTeams:[...affected]};window.PC_MODEL_NAME='EloK70 + Week1 1/9 admission governor + calibrated margin + PSCORE shape + environmental state';
const priorAudit=audit;audit=function(){const x=priorAudit(),a=P[S.a.short],h=P[S.h.short];x.engineVersion=PRODUCT_VERSION;x.dataVersion=DATA_VERSION;x.week1AdmissionWeight=WEEK1_WEIGHT;x.defaultLaterWeekWeight=DEFAULT_LATER_WEEK_WEIGHT;x.temporalPolicy='Week-1 movement admitted at 1/9 of raw preseason-to-post-W1 Power delta; later weekly default 1/6 unless separately governed';x.awayEffectivePower=a?.p;x.homeEffectivePower=h?.p;x.awayRawPostW1Power=a?.pPostW1Raw;x.homeRawPostW1Power=h?.pPostW1Raw;x.awayPreseasonPower=a?.pPreseason??a?.pPostW1Raw;x.homePreseasonPower=h?.pPreseason??h?.pPostW1Raw;x.awayWeek1DeltaAdmitted=a?.pWeek1DeltaAdmitted??0;x.homeWeek1DeltaAdmitted=h?.pWeek1DeltaAdmitted??0;return x;};
if(typeof renderRatings==='function')renderRatings();
})();