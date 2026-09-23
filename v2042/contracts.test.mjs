import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FCS,CONSTANTS,validateRows,sha256,digest,multiplier,comeback,effectiveRatings,driveFeatures,eventDraw,queueChange,exactReplayGate,calibrationGate} from './contracts.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const rows=JSON.parse(read('./ratings.json')),manifest=JSON.parse(read('./manifest.json')),config=JSON.parse(read('./configuration.json'));
const copy=x=>structuredClone(x), near=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const blocked=f=>assert.throws(f,/BLOCKED/);
const A={code:'TEX',overall:99,offense:99,defense:99,tempo:.52,run:.50};
const B={code:'UGA',overall:98,offense:99,defense:97,tempo:.67,run:.42};
const controls={manualLevel:0,prototype:'A',neutral:false,evenTeams:false,comebackEnabled:false};
const score={period:1,awayScore:0,homeScore:0};
const state={final:false,nextPossession:7,controls,changes:[]};
const key={seed:3119422330,domain:'game',team:'TEX',possession:1,event:'drive.outcome'};
const identity={engine:'PC-2042-SPEC-R1',data:manifest.data_version,config:'PC-2042-CONTRACT-R1',rng:'PC-SHA256-EVENT-v1',auditSchema:'PC-AUDIT-CONTRACT-v1'};
function archive(){const r={identity,initial:{...controls,away:'TEX',home:'UGA',seed:3119422330,temperature:70,precipitation:'none'},changes:[]};return{...r,deterministicHash:digest(r)};}

test('C01 population: 121 canonical + 13 FCS = 134 / 402 values',()=>{
 const r=validateRows(rows);assert.equal(r.canonical,121);assert.equal(r.fcs,13);assert.equal(r.total,134);assert.equal(r.ratingValues,402);
});
test('C02 exact match of all 363 canonical rating fields and 121 ranks to frozen Git blob',()=>{
 const source=read('../week4_power_v204.js');
 const blob=createHash('sha1').update(`blob ${Buffer.byteLength(source)}\0`).update(source).digest('hex');
 assert.equal(blob,manifest.sources.rating_blob_sha1);
 const D=JSON.parse(source.match(/const D=(\{[\s\S]*?\n\});/)[1]);
 assert.equal(Object.keys(D).length,121);
 for(const r of rows.slice(0,121))assert.deepEqual([r[4],r[5],r[6],r[0]],D[r[1]],r[1]);
});
test('C03 all 13 FCS individually match 60/60/60 and operator slots',()=>{
 FCS.forEach((code,i)=>{const r=rows[121+i];assert.equal(r[0],122+i);assert.equal(r[1],code);assert.deepEqual(r.slice(4),[60,60,60]);});
});
test('C04 exact-file SHA256 and rating-tuple SHA256 match manifest',()=>{
 assert.equal(sha256(read('./ratings.json')),manifest.rows_file_sha256);
 assert.equal(sha256(JSON.stringify(rows.map(r=>[r[1],r[4],r[5],r[6],r[0]]))),manifest.rating_tuples_sha256);
});
test('C05 identity remains diagnostic: 56 exact / 35 minus-one / 30 plus-one',()=>{
 assert.deepEqual(validateRows(rows).residuals,{'0':56,'-1':35,'1':30});
});
test('C06 duplicate team code rejected',()=>{const r=copy(rows);r[1][1]=r[0][1];blocked(()=>validateRows(r));});
test('C07 missing row rejected',()=>blocked(()=>validateRows(rows.slice(1))));
test('C08 invalid base rating, zero and NaN rejected',()=>{
 for(const v of [59,100,0,NaN,null,60.1]){const r=copy(rows);r[0][4]=v;blocked(()=>validateRows(r));}
});
test('C09 incorrect FCS value rejected',()=>{const r=copy(rows);r[121][5]=61;blocked(()=>validateRows(r));});
test('C10 supplied rank and FCS slot order must be preserved',()=>{const r=copy(rows);[r[0],r[1]]=[r[1],r[0]];blocked(()=>validateRows(r));});
test('C11 Prototype A retains frozen three multiplier values',()=>{
 [1.0062692035551928,1.0125777100236022,1.0189257658031912].forEach((m,i)=>near(multiplier('A',i+1),m));
});
test('C12 Prototype B retains frozen three multiplier values',()=>{
 [1.009618098105068,1.0159004926206658,1.0189258].forEach((m,i)=>near(multiplier('B',i+1),m));
});
test('C13 reciprocal product and sign-reversal symmetry for both prototypes/all six nonzero settings',()=>{
 for(const prototype of ['A','B'])for(const manualLevel of [-3,-2,-1,1,2,3]){
 const x=effectiveRatings(A,B,{...controls,prototype,manualLevel},score);
 const y=effectiveRatings(B,A,{...controls,prototype,manualLevel:-manualLevel},score);
 near(x.awayMultiplier*x.homeMultiplier,1);
 for(const f of ['overall','offense','defense']){near(x.away[f],y.home[f]);near(x.home[f],y.away[f]);}
 }
});
test('C14 Even Teams equalizes base units and style BEFORE manual influence',()=>{
 const e=effectiveRatings(A,B,{...controls,evenTeams:true},score);near(e.away.overall,98.5);near(e.away.offense,99);near(e.away.defense,98);near(e.away.tempo,e.home.tempo);near(e.away.run,e.home.run);
 const x=effectiveRatings(A,B,{...controls,evenTeams:true,manualLevel:-2},score);assert.ok(x.away.overall>x.home.overall);
});
test('C15 temporary elite effective ratings may exceed 100',()=>assert.ok(effectiveRatings(A,B,{...controls,manualLevel:-3},score).away.overall>100));
test('C16 reciprocal penalty can take effective FCS below 60 without changing base',()=>{
 const f={overall:60,offense:60,defense:60};const x=effectiveRatings(A,f,{...controls,manualLevel:-3},score);assert.ok(x.home.defense<60);assert.equal(f.defense,60);
});
test('C17 effective-rating calculations never mutate authoritative teams or controls',()=>{
 const a=copy(A),b=copy(B),c=copy(controls);effectiveRatings(a,b,c,score);assert.deepEqual([a,b,c],[A,B,controls]);
});
test('C18 both prototypes at zero produce identical base values',()=>{
 const a=effectiveRatings(A,B,controls,score),b=effectiveRatings(A,B,{...controls,prototype:'B'},score);
 assert.deepEqual(a.away,b.away);assert.deepEqual(a.home,b.home);assert.equal(a.combined,0);
});
test('C19 comeback is dormant Q1/Q2/OT and when tied',()=>{
 for(const period of [1,2,5,6])assert.equal(comeback({enabled:true,period,awayScore:0,homeScore:21}).level,0);
 for(const period of [3,4])assert.equal(comeback({enabled:true,period,awayScore:14,homeScore:14}).level,0);
});
test('C20 Q3 fourteen-point deficit is fractional 1.4, not rounded',()=>near(comeback({enabled:true,period:3,awayScore:10,homeScore:24}).signed,-1.4));
test('C21 Q4 fourteen-point deficit gives 2; twenty-one gives 3',()=>{
 near(comeback({enabled:true,period:4,awayScore:10,homeScore:24}).level,2);
 near(comeback({enabled:true,period:4,awayScore:0,homeScore:21}).level,3);
});
test('C22 comeback decays from updated possession-boundary score',()=>{
 const a=comeback({enabled:true,period:4,awayScore:10,homeScore:24});const b=comeback({enabled:true,period:4,awayScore:21,homeScore:24});near(b.level,3/7);assert.ok(b.level<a.level);
});
test('C23 maxed manual slider reports discarded additional assistance',()=>{
 const e=effectiveRatings(A,B,{...controls,manualLevel:-3,comebackEnabled:true},{period:4,awayScore:0,homeScore:21});assert.equal(e.requested,-6);assert.equal(e.combined,-3);assert.equal(e.clipped,-3);assert.equal(e.appliedComeback,0);
});
test('C24 opposite manual and comeback influences combine in signed levels',()=>{
 const e=effectiveRatings(A,B,{...controls,manualLevel:1,comebackEnabled:true},{period:4,awayScore:10,homeScore:24});assert.equal(e.combined,-1);
});
test('C25 site contract returns HFA 2.5 or exactly zero on neutral',()=>{
 assert.equal(effectiveRatings(A,B,controls,score).sitePoints,2.5);assert.equal(effectiveRatings(A,B,{...controls,neutral:true},score).sitePoints,0);
});
test('C26 drive features retain actual opposing DEF without hidden overall double-count',()=>{
 const f=driveFeatures(A,B),g=driveFeatures(A,{...B,defense:B.defense+5});near(f.teamGap,g.teamGap);near(g.unitEdge,f.unitEdge-5);near(g.unitResidual,f.unitResidual-5);
});
test('C27 stable seed event-key golden vector (NOT a legacy final-score assertion)',()=>{
 const r=eventDraw(key);assert.equal(r.hash,'631a6851a7d16300b8b5d79de6ddf33d76bb55214844a93bc5bf6d90a8b9db4e');near(r.u,.38712169641059324);assert.deepEqual(r,eventDraw(key));
});
test('C28 forecast calls do not consume or alter game randomness',()=>{
 const before=eventDraw(key);for(let replicate=0;replicate<100;replicate++)eventDraw({...key,domain:'forecast',replicate});assert.deepEqual(eventDraw(key),before);
 assert.notEqual(eventDraw({...key,domain:'forecast'}).hash,before.hash);
});
test('C29 extra unrelated events cannot shift a later addressed event',()=>{
 const target={...key,possession:7,event:'field.transition'};const first=eventDraw(target);eventDraw({...key,possession:2});eventDraw({...key,team:'UGA',possession:4,event:'duration'});assert.deepEqual(eventDraw(target),first);
});
test('C30 RNG rejects invalid keys and preserves uint32 endpoints',()=>{
 for(const seed of [-1,2**32,2.5])blocked(()=>eventDraw({...key,seed}));
 for(const seed of [0,2**32-1]){const x=eventDraw({...key,seed});assert.ok(x.u>=0&&x.u<1);}
 blocked(()=>eventDraw({...key,domain:'anything'}));blocked(()=>eventDraw({...key,replicate:1}));
});
test('C31 settings changes have chronological sequence and next-possession boundary',()=>{
 const a=queueChange(state,{manualLevel:-1}),b=queueChange({...a,nextPossession:8},{prototype:'B'});
 assert.equal(a.changes[0].effectiveFromPossession,7);assert.equal(b.changes[1].effectiveFromPossession,8);assert.equal(b.changes[1].sequence,2);assert.equal(state.changes.length,0);assert.equal(a.changes.length,1);
});
test('C32 locked pregame changes and unknown controls rejected',()=>{
 for(const patch of [{neutral:true},{temperature:90},{evenTeams:true},{home:'OSU'},{newMagic:1}])blocked(()=>queueChange(state,patch));
});
test('C33 finalized game refuses intervention',()=>blocked(()=>queueChange({...state,final:true},{manualLevel:1})));
test('C34 exact replay requires all archived settings and matching five-part identity',()=>{
 assert.equal(exactReplayGate(archive(),identity),true);
 const missing=archive();delete missing.initial.temperature;blocked(()=>exactReplayGate(missing,identity));
 for(const k of Object.keys(identity))blocked(()=>exactReplayGate(archive(),{...identity,[k]:'different'}));
});
test('C35 changed archive content is not an exact replay',()=>{
 const r=archive();r.initial.neutral=true;blocked(()=>exactReplayGate(r,identity));
});
test('C36 missing empirical parameters explicitly block a playable simulation',()=>blocked(()=>calibrationGate(config)));
