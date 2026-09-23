/** v2.0.4.2 specification reference functions. NOT a playable game engine.
 * No DOM, legacy runtime import, final-score draw, or probability defaults.
 */
import { createHash } from 'node:crypto';

export const FCS = Object.freeze(['ARST','CHAR','CP','DUQ','EMU','IDHO','SAC','SUU','TOL','ULL','ULM','WKU','WMU']);
export const FIELDS = Object.freeze(['overall','offense','defense']);
export const LIVE = Object.freeze(['manualLevel','prototype','comebackEnabled']);
export const LOCKED = Object.freeze(['away','home','seed','neutral','temperature','precipitation','evenTeams']);
export const CONSTANTS = Object.freeze({ hfa:2.5, neutralHfa:0, alphaA:0.006249633846986093, alphaB:Math.log(1.0189258), betaB:0.5, combinedCap:3 });

export class Blocked extends Error {
  constructor(reason) { super(`BLOCKED: ${reason}`); this.name='Blocked'; }
}
const demand=(condition,reason)=>{if(!condition)throw new Blocked(reason);};
const finite=v=>typeof v==='number' && Number.isFinite(v);
const canonical=x=>{
  if(x===null || typeof x==='string' || typeof x==='boolean')return x;
  if(typeof x==='number'){demand(finite(x),'nonfinite audit value');return x;}
  if(Array.isArray(x))return x.map(canonical);
  demand(x && typeof x==='object' && Object.getPrototypeOf(x)===Object.prototype,'non-JSON audit value');
  return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])]));
};
export const canonicalJSON=x=>JSON.stringify(canonical(x));
export const sha256=s=>createHash('sha256').update(s,'utf8').digest('hex');
export const digest=x=>sha256(canonicalJSON(x));

export function validateRows(rows) {
  demand(Array.isArray(rows) && rows.length===134,'expected 134 rows');
  const codes=new Set(), slots=new Set(); let canonicalCount=0,fcsCount=0;
  const residuals={};
  for(const r of rows){
    demand(Array.isArray(r) && r.length===7,'expected slot/code/name/conference/TEAM/OFF/DEF');
    const [slot,code,name,conference,...ratings]=r;
    demand(Number.isInteger(slot) && slot>=1 && slot<=134 && !slots.has(slot),'invalid/duplicate slot');
    demand(typeof code==='string' && code.length>0 && !codes.has(code),'invalid/duplicate code');
    demand(typeof name==='string' && name.length>0 && typeof conference==='string' && conference.length>0,'missing identity');
    demand(ratings.every(x=>Number.isInteger(x)&&x>=60&&x<=99),'invalid base rating');
    codes.add(code);slots.add(slot);
    if(FCS.includes(code)){
      fcsCount++;
      demand(slot===122+FCS.indexOf(code) && conference==='FCS' && ratings.every(x=>x===60),'FCS slot/value violation');
    }else{
      canonicalCount++; demand(slot<=121 && conference!=='FCS','canonical membership violation');
      const residual=ratings[1]+ratings[2]-2*ratings[0];
      residuals[residual]=(residuals[residual]||0)+1;
    }
  }
  demand(canonicalCount===121 && fcsCount===13,'population mismatch');
  demand(rows.every((r,i)=>r[0]===i+1),'rank/slot order changed');
  return {canonical:canonicalCount,fcs:fcsCount,total:rows.length,ratingValues:rows.length*3,residuals};
}

export function validateControls(c) {
  demand(c && Number.isInteger(c.manualLevel) && Math.abs(c.manualLevel)<=3,'manual level must be integer -3..3');
  demand(c.prototype==='A'||c.prototype==='B','unknown prototype');
  for(const k of ['neutral','evenTeams','comebackEnabled']) demand(typeof c[k]==='boolean',`missing boolean ${k}`);
}
export function multiplier(prototype,level) {
  demand(prototype==='A'||prototype==='B','unknown prototype');
  demand(finite(level)&&level>=0&&level<=3,'strength level outside 0..3');
  return prototype==='A' ? Math.exp(CONSTANTS.alphaA*level)
    : Math.exp(CONSTANTS.alphaB*Math.tanh(CONSTANTS.betaB*level)/Math.tanh(3*CONSTANTS.betaB));
}
export function comeback({enabled,period,awayScore,homeScore}) {
  demand(typeof enabled==='boolean','missing comeback enabled');
  demand(Number.isInteger(period)&&period>=1,'invalid period');
  demand([awayScore,homeScore].every(x=>Number.isInteger(x)&&x>=0),'invalid score');
  const deficit=Math.abs(awayScore-homeScore);
  const level=!enabled || ![3,4].includes(period) || deficit===0 ? 0
    : period===3 ? Math.min(2,deficit/10) : Math.min(3,deficit/7);
  return {period,deficit,level,signed:level===0?0:awayScore<homeScore?-level:level};
}
export function effectiveRatings(away,home,controls,state) {
  validateControls(controls);
  for(const t of [away,home])for(const f of FIELDS)demand(finite(t[f])&&t[f]>0,'missing/nonpositive base rating');
  const a={...away},h={...home};
  if(controls.evenTeams){
    for(const f of FIELDS)a[f]=h[f]=(away[f]+home[f])/2;
    // Style is equalized only when explicitly supplied, never invented.
    for(const f of ['tempo','run']){
      demand((away[f]===undefined)===(home[f]===undefined),'one-sided missing style');
      if(away[f]!==undefined){demand(finite(away[f])&&finite(home[f]),'invalid style');a[f]=h[f]=(away[f]+home[f])/2;}
    }
  }
  const cb=comeback({enabled:controls.comebackEnabled,...state});
  const requested=controls.manualLevel+cb.signed;
  const combined=Math.max(-3,Math.min(3,requested));
  const m=multiplier(controls.prototype,Math.abs(combined));
  const af=combined<0?m:combined>0?1/m:1, hf=1/af;
  for(const f of FIELDS){a[f]*=af;h[f]*=hf;}
  return {away:a,home:h,manual:controls.manualLevel,prototype:controls.prototype,
    comeback:cb,requested,combined,clipped:requested-combined,
    appliedComeback:combined-controls.manualLevel,awayMultiplier:af,homeMultiplier:hf,
    sitePoints:controls.neutral?0:CONSTANTS.hfa};
}

/** Independent OFF-vs-DEF signal separated from TEAM gap; no fitted weights here. */
export function driveFeatures(offense,defense) {
  for(const [t,fields] of [[offense,['overall','offense']],[defense,['overall','defense']]])
    for(const f of fields)demand(finite(t[f]),'invalid drive feature');
  const teamGap=offense.overall-defense.overall;
  const unitEdge=offense.offense-defense.defense;
  return {teamGap,unitEdge,unitResidual:unitEdge-teamGap};
}

/** Event-addressed RNG contract. Forecast and game domains cannot share a key.
 * Not a legacy LCG continuation; identified by a new RNG version.
 */
export function eventDraw({seed,domain,team,possession,event,subIndex=0,replicate=0}) {
  demand(Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff,'seed must be uint32');
  demand(domain==='game'||domain==='forecast','unknown RNG domain');
  demand(typeof team==='string'&&team.length>0&&typeof event==='string'&&event.length>0,'missing RNG identity');
  for(const n of [possession,subIndex,replicate])demand(Number.isSafeInteger(n)&&n>=0,'invalid RNG ordinal');
  demand(domain!=='game'||replicate===0,'forecast replicate in game domain');
  const key=JSON.stringify(['PC-SHA256-EVENT-v1',seed,domain,team,possession,event,subIndex,replicate]);
  const hash=sha256(key), bits=BigInt('0x'+hash.slice(0,14))>>3n;
  return {key,hash,u:Number(bits)/9007199254740992};
}

/** Store changes only at explicit next-possession boundaries; never mutate state. */
export function queueChange(state,patch) {
  demand(state && !state.final,'game finalized');
  demand(Number.isSafeInteger(state.nextPossession)&&state.nextPossession>=1,'invalid next possession');
  demand(patch && Object.keys(patch).length>0 && Object.keys(patch).every(k=>LIVE.includes(k)),'pregame-only/unknown control change');
  const controls={...state.controls,...patch};validateControls(controls);
  const event={sequence:state.changes.length+1,effectiveFromPossession:state.nextPossession,patch:{...patch},controls:{...controls}};
  return {...state,controls,changes:[...state.changes,event]};
}

export function exactReplayGate(record,identity) {
  demand(record && record.initial && Array.isArray(record.changes),'incomplete archive');
  for(const k of ['engine','data','config','rng','auditSchema']){
    demand(typeof identity[k]==='string'&&identity[k].length>0,'missing target identity');
    demand(record.identity?.[k]===identity[k],`replay mismatch ${k}`);
  }
  for(const k of [...LOCKED,...LIVE])demand(Object.hasOwn(record.initial,k),`missing archived ${k}`);
  validateControls(record.initial);
  demand(typeof record.initial.temperature==='number'&&finite(record.initial.temperature),'invalid archived temperature');
  demand(['none','light','moderate','heavy'].includes(record.initial.precipitation),'invalid archived precipitation');
  demand(typeof record.initial.away==='string'&&typeof record.initial.home==='string'&&record.initial.away!==record.initial.home,'invalid archived teams');
  demand(Number.isInteger(record.initial.seed)&&record.initial.seed>=0&&record.initial.seed<=0xffffffff,'invalid archived seed');
  demand(record.deterministicHash===digest({identity:record.identity,initial:record.initial,changes:record.changes}),'archive checksum mismatch');
  return true;
}

export function calibrationGate(config) {
  const required=['overall_prior_bridge','unit_logit_coefficients','prior_penalty_strength','drive_outcome_baselines','drive_duration_field_transition_joint_model','special_teams_and_conversion_probabilities','weather_and_strategy_coefficients'];
  const missing=required.filter(k=>config.calibration?.[k]==null);
  demand(missing.length===0,`unresolved calibration: ${missing.join(', ')}`);
  demand(config.status==='CALIBRATED_AND_APPROVED','parameter artifact not approved');
  return true;
}
