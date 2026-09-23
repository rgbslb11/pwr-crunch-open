// Run: node --test preview-v2.0.4.2/quarter_boundary.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import * as E from './engine_r1.mjs';
import * as Legacy from './engine_r1_legacy.mjs';
const read=f=>readFileSync(new URL(f,import.meta.url),'utf8');
const rows=JSON.parse(read('./ratings.json'));
const input={away:'TEX',home:'UGA',seed:3119422330,neutral:false,temperature:70,precipitation:'none',evenTeams:false,manualLevel:0,prototype:'A',comebackEnabled:false};
const make=(seed=input.seed)=>E.createGame(rows,{...input,seed});
function finish(s,quarter=false){let n=0;while(!s.final&&n++<100)(quarter?E.playToQuarterBoundary:E.advancePossession)(s);assert.ok(s.final);return s;}
const payload=s=>({events:s.events,score:s.score,quarters:s.quarters,overtime:s.overtime,changes:s.changes});
test('exact quarter stops, no future scoring: 100 seeds x four quarters',()=>{
 for(let seed=1;seed<=100;seed++){const s=make(seed);for(let q=1;q<=4;q++){
  E.playToQuarterBoundary(s);assert.equal(s.regSecondsRemaining,(4-q)*900);assert.equal(s.pausedAfterQuarter,q);
  assert.deepEqual(s.periodsStarted,[1,2,3,4].map(x=>x<=q));
  for(const side of ['away','home'])assert.ok(s.quarters[side].slice(q).every(x=>x===0));
 }}
});
test('unfinished drive carries forward without scoring, rerolling or double counting',()=>{
 const s=make();s.regSecondsRemaining=2701;const result=E.advancePossession(s,{stopAtQuarterBoundary:true});
 assert.equal(result.completed,false);assert.deepEqual(s.score,{away:0,home:0});assert.equal(s.events.length,0);
 const d=structuredClone(s.pendingDrive);const e=E.advancePossession(s);assert.equal(e.index,1);assert.equal(e.sampledDurationSeconds,d.duration.seconds);assert.deepEqual(e.rng.duration,d.duration.draws);assert.equal(s.teamPossessions[d.side],1);assert.equal(s.pendingDrive,null);
});
test('edits during an unfinished drive apply to the following possession',()=>{
 const s=make();s.regSecondsRemaining=2701;E.advancePossession(s,{stopAtQuarterBoundary:true});
 E.setLiveControls(s,{manualLevel:-3,prototype:'B'});assert.equal(s.changes[0].effectiveFromPossession,2);
 assert.equal(E.advancePossession(s).controls.manualLevel,0);assert.equal(E.advancePossession(s).controls.manualLevel,-3);
});
test('quarter mode and possession mode agree over 100 seeds',()=>{
 for(let seed=1;seed<=100;seed++)assert.deepEqual(payload(finish(make(seed),true)),payload(finish(make(seed))));
});
test('boundary interventions survive exact replay and replay-of-replay',()=>{
 const s=make();E.playToQuarterBoundary(s);assert.ok(s.pendingDrive);E.setLiveControls(s,{manualLevel:-2,prototype:'B'});E.playToQuarterBoundary(s);E.setLiveControls(s,{comebackEnabled:true});finish(s);
 const a=E.exportAudit(s),r=E.replayAudit(rows,a),a2=E.exportAudit(r);assert.equal(a.gameplayHash,a2.gameplayHash);assert.deepEqual(payload(E.replayAudit(rows,a2)),payload(s));
});
test('scoreboard keeps future dashes and original six-column regulation headers',()=>{
 const src=read('./app.mjs');const render=src.slice(src.indexOf('function renderScore()'),src.indexOf('function renderStatus()'));
 const s=make();const el={innerHTML:'',classList:{toggle(){}}};
 const draw=()=>{runInNewContext(render+'\nrenderScore();',{state:s,$:()=>el,esc:String});return el.innerHTML;};
 assert.equal((draw().match(/>-<\/span>/g)||[]).length,8);
 for(let q=1;q<=3;q++){E.playToQuarterBoundary(s);const html=draw();assert.equal((html.match(/>-<\/span>/g)||[]).length,2*(4-q));assert.ok(!html.includes('<b>OT</b>'));}
});
test('all 134 names per selector are unranked; ratings bytes unchanged',()=>{
 const src=read('./app.mjs');const fn=src.slice(src.indexOf('function fillTeams()'),src.indexOf('function newSeed()'));
 const els={away:{},home:{}};runInNewContext(fn+'\nfillTeams();',{teams:rows.map(r=>({slot:r[0],code:r[1],name:r[2]})),$:x=>els[x],esc:String});
 for(const side of ['away','home']){const opts=[...els[side].innerHTML.matchAll(/<option[^>]*>(.*?)<\/option>/g)];assert.equal(opts.length,134);assert.ok(opts.every(x=>!/^#\d/.test(x[1])));}
 assert.equal(createHash('sha256').update(read('./ratings.json')).digest('hex'),'5598fbc95de623f282aea8c06a206a67acc351f98669c3d01409e75cf684c3e3');
});
test('parameters unchanged; old preview audits use the frozen legacy module',()=>{
 assert.deepEqual(E.PARAMS,Legacy.PARAMS);const old=Legacy.createGame(rows,input);while(!old.final)Legacy.advancePossession(old);
 const a=Legacy.exportAudit(old);assert.deepEqual(Legacy.replayAudit(rows,a).score,old.score);assert.throws(()=>E.replayAudit(rows,a),/identity mismatch/);
});
