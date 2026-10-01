import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import * as E from './engine_r1.mjs';
import * as Q from './history-v2042/engine_quarterfix1.mjs';
import * as L from './history-v2042/engine_r1_legacy.mjs';
import {replayArchived} from './replay_router.mjs';
const read=f=>readFileSync(new URL(f,import.meta.url),'utf8');
const rows=JSON.parse(read('./ratings.json'));
const oldRows=JSON.parse(read('./history-v2042/ratings.json'));
const meta=JSON.parse(read('./ratings-update.json'));
const input={away:'TEX',home:'UGA',seed:3119422330,neutral:false,temperature:70,precipitation:'none',evenTeams:false,manualLevel:0,prototype:'A',comebackEnabled:false};
const sha=s=>createHash('sha256').update(s).digest('hex');
function finish(module,s){for(let i=0;!s.final&&i<100;i++)module.advancePossession(s);assert.ok(s.final);return s;}

test('121 source teams map exactly to 363 canonical values; 13 FCS retain all 39 values',()=>{
 const csv=read('./source/team-ratings-121.csv');assert.equal(sha(csv),'85ed1ccbcb87f2b20228a6667fc2e82e0f62291e560bd85f4dbe844870266cd9');
 const lines=csv.trim().split(/\r?\n/);assert.equal(lines.shift(),'Team,Short,TEAM,OFF,DEF');assert.equal(lines.length,121);
 const source=lines.map(s=>s.split(','));assert.equal(new Set(source.map(r=>r[1])).size,121);
 source.forEach((r,i)=>{assert.equal(rows[i][0],i+1);assert.equal(rows[i][1],r[1]);assert.deepEqual(rows[i].slice(4),r.slice(2).map(Number));});
 assert.equal(rows.length,134);assert.equal(new Set(rows.map(r=>r[1])).size,134);assert.equal(rows.reduce((n,r)=>n+r.slice(4).length,0),402);
 assert.deepEqual(rows.slice(121),oldRows.slice(121));assert.ok(rows.slice(121).every(r=>r.slice(4).every(n=>n===60)));
 assert.equal(sha(read('./ratings.json')),meta.ratingsSha256);
});

test('mechanics and original palette are unchanged; only engine/data identities advance',()=>{
 const restored=read('./engine_r1.mjs').replace('POWER CRUNCH v2.0.5 Week 6 possession-engine build.','POWER CRUNCH v2.0.4.2 R1 possession-engine prototype.').replaceAll('PC-MOBILE-v2.0.5','PC-MOBILE-v2.0.4.2-R1-QUARTERFIX1').replaceAll('2026-through-W05-for-W06-operator-ratings-v1','2026-through-W04-for-W05-operator-ratings-v1');
 assert.equal(restored,read('./history-v2042/engine_quarterfix1.mjs'));assert.deepEqual(E.PARAMS,Q.PARAMS);
 const css=read('./style.css');assert.equal(createHash('sha1').update('blob '+Buffer.byteLength(css)+'\0').update(css).digest('hex'),'b01a15c613c3f6ccff5de9dd6d3c8c4f1a1768a1');
 assert.equal(E.DATA_ID,'2026-through-W05-for-W06-operator-ratings-v1');assert.equal(E.ENGINE_ID,'PC-MOBILE-v2.0.5');
});

test('both selectors remain alphabetical without changing rating order or defaults',()=>{
 const src=read('./app.mjs'),els={away:{},home:{}};const teams=rows.map(r=>({slot:r[0],code:r[1],name:r[2]}));const before=JSON.stringify(teams);
 const fn=src.slice(src.indexOf('function fillTeams()'),src.indexOf('function newSeed()'));
 runInNewContext(fn+'\nfillTeams();',{teams,$:id=>els[id],esc:String});
 for(const side of ['away','home']){const labels=[...els[side].innerHTML.matchAll(/<option[^>]*>(.*?)<\/option>/g)].map(x=>x[1]);assert.equal(labels.length,134);assert.deepEqual(labels,[...labels].sort((a,b)=>a.localeCompare(b,'en')));assert.ok(labels.every(s=>!/^#\d/.test(s)));}
 assert.equal(JSON.stringify(teams),before);assert.equal(els.away.value,'TEX');assert.equal(els.home.value,'UGA');
});

test('current and both historical audit identities replay with their correct rating snapshots',async()=>{
 const originalFetch=globalThis.fetch;let calls=0;
 globalThis.fetch=async url=>{assert.ok(String(url).endsWith('/history-v2042/ratings.json'));calls++;return {ok:true,json:async()=>structuredClone(oldRows)};};
 try{
  for(const [module,data] of [[E,rows],[Q,oldRows],[L,oldRows]]){
   const s=module.createGame(data,input);module.advancePossession(s);module.setLiveControls(s,{manualLevel:-2,prototype:'B'});finish(module,s);
   const audit=module.exportAudit(s),replayed=await replayArchived(rows,audit);
   assert.equal(module.exportAudit(replayed).gameplayHash,audit.gameplayHash);assert.deepEqual(replayed.teams,s.teams);
  }
  assert.equal(calls,2);await assert.rejects(()=>replayArchived(rows,{identity:{engine:'UNKNOWN'}}),/BLOCKED/);
  globalThis.fetch=async()=>({ok:false,status:404});const s=finish(Q,Q.createGame(oldRows,input));await assert.rejects(()=>replayArchived(rows,Q.exportAudit(s)),/historical ratings load 404/);
 }finally{globalThis.fetch=originalFetch;}
});

test('historical QUARTERFIX1 regression fixture remains 7-0 with drive 5 pending',()=>{
 const s=Q.createGame(oldRows,input);Q.playToQuarterBoundary(s);assert.deepEqual(s.score,{away:7,home:0});assert.equal(s.nextPossession,5);assert.ok(s.pendingDrive);assert.deepEqual(s.periodsStarted,[true,false,false,false]);
});

test('all runtime module imports exist and resolve; week labels refer to Week 6',async()=>{
 await import('./app.mjs?v=v205-w06');await import('./replay_router.mjs?v=v205-w06');
 for(const file of ['bootstrap.mjs','app.mjs','replay_router.mjs','engine_r1.mjs','history-v2042/engine_quarterfix1.mjs','history-v2042/engine_r1_legacy.mjs']){
  for(const m of read('./'+file).matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g))if(m[1].startsWith('.'))readFileSync(new URL(m[1].split('?')[0],new URL(file,import.meta.url)));
 }
 const html=read('./index.html');assert.ok(html.includes('Week 6 Ratings'));assert.ok(html.includes('Through Week 5 / Week 6 use'));assert.ok(!html.includes('Week 5 Ratings'));
});
