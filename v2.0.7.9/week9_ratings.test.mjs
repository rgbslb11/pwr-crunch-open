import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import * as E from './engine_r1.mjs';
import * as W7 from './history-v206/engine_r1.mjs';
import * as W6 from './history-v205/engine_r1.mjs';
import * as Q from './history-v2042/engine_quarterfix1.mjs';
import * as L from './history-v2042/engine_r1_legacy.mjs';
import {replayArchived} from './replay_router.mjs';

const read=f=>readFileSync(new URL(f,import.meta.url),'utf8');
const sha=s=>createHash('sha256').update(s).digest('hex');
const rows=JSON.parse(read('./ratings.json'));
const w7Rows=JSON.parse(read('./history-v206/ratings.json'));
const w6Rows=JSON.parse(read('./history-v205/ratings.json'));
const oldRows=JSON.parse(read('./history-v2042/ratings.json'));
const meta=JSON.parse(read('./ratings-update.json'));
const input={away:'TEX',home:'UGA',seed:3119422330,neutral:false,temperature:70,precipitation:'none',evenTeams:false,manualLevel:0,prototype:'A',comebackEnabled:false};
function finish(module,s){for(let i=0;!s.final&&i<100;i++)module.advancePossession(s);assert.ok(s.final);return s;}

test('approved source exactly supplies 121 codes and 363 values; 13 synthetic FCS stay fixed',()=>{
 assert.equal(meta.sourceSha256,'f14bac8d253d2a79695fa9f56b085f70e9880a67286851758030ad1b2fa1c0ea');
 assert.equal(sha(read('./source/approved-ratings.json')),'4821e1ab69d1d53f569e346536d9cb4953677e9cb4d40691d8180cfc225583fa');
 const approvedRows=JSON.parse(read('./source/approved-ratings.json'));
 assert.equal(approvedRows.length,121);
 const codes=new Set();
 for(let i=0;i<approvedRows.length;i++){
  const code=approvedRows[i].code,approved=['TEAM','OFF','DEF'].map(k=>approvedRows[i][k]);
  assert.equal(code,meta.changes[i].code);assert.deepEqual(approved,meta.changes[i].week9);
  assert.ok(!codes.has(code));codes.add(code);
  assert.equal(rows[i][0],i+1);assert.equal(rows[i][1],code);
  assert.deepEqual(rows[i].slice(4),approved);
  assert.deepEqual(meta.changes[i].previous,w7Rows.find(r=>r[1]===code).slice(4));
  assert.deepEqual(meta.changes[i].delta,approved.map((n,j)=>n-meta.changes[i].previous[j]));
 }
 assert.equal(codes.size,121);assert.deepEqual(codes,new Set(w7Rows.slice(0,121).map(r=>r[1])));
 assert.equal(rows.length,134);assert.equal(new Set(rows.map(r=>r[1])).size,134);
 assert.deepEqual(rows.slice(121),w7Rows.slice(121));
 assert.ok(rows.slice(121).every(r=>r[3]==='FCS'&&r.slice(4).every(n=>n===60)));
 assert.equal(rows.reduce((n,r)=>n+r.slice(4).length,0),402);
 assert.equal(sha(read('./ratings.json')),meta.ratingsSha256);
 assert.equal(meta.changedCanonicalTeams,121);assert.equal(meta.changedCanonicalValues,346);
});

test('engine mechanics, parameters, and original stylesheet are preserved byte-for-byte',()=>{
 const restored=read('./engine_r1.mjs').replace('POWER CRUNCH v2.0.7.9 Week 9 possession-engine build.','POWER CRUNCH v2.0.6 Week 7 possession-engine build.').replaceAll('PC-MOBILE-v2.0.7.9','PC-MOBILE-v2.0.6').replaceAll('2026-W09-approved-ratings-v1','2026-W07-approved-ratings-v1');
 assert.equal(restored,read('./history-v206/engine_r1.mjs'));
 assert.deepEqual(E.PARAMS,W7.PARAMS);assert.deepEqual(E.PARAMS,W6.PARAMS);assert.deepEqual(E.PARAMS,Q.PARAMS);
 const css=read('./style.css');assert.equal(createHash('sha1').update('blob '+Buffer.byteLength(css)+'\0').update(css).digest('hex'),'b01a15c613c3f6ccff5de9dd6d3c8c4f1a1768a1');
 assert.equal(E.ENGINE_ID,'PC-MOBILE-v2.0.7.9');assert.equal(E.DATA_ID,'2026-W09-approved-ratings-v1');
});

test('both selectors remain alphabetic and unranked with original defaults',()=>{
 const src=read('./app.mjs'),els={away:{},home:{}};
 const teams=rows.map(r=>({slot:r[0],code:r[1],name:r[2]})),before=JSON.stringify(teams);
 const fn=src.slice(src.indexOf('function fillTeams()'),src.indexOf('function newSeed()'));
 runInNewContext(fn+'\nfillTeams();',{teams,$:id=>els[id],esc:String});
 for(const side of ['away','home']){
  const labels=[...els[side].innerHTML.matchAll(/<option[^>]*>(.*?)<\/option>/g)].map(x=>x[1]);
  assert.equal(labels.length,134);assert.deepEqual(labels,[...labels].sort((a,b)=>a.localeCompare(b,'en')));
  assert.ok(labels.every(s=>!/^#\d/.test(s)));
 }
 assert.equal(JSON.stringify(teams),before);assert.equal(els.away.value,'TEX');assert.equal(els.home.value,'UGA');
});

test('current and all four historical engine identities replay their own data exactly',async()=>{
 const originalFetch=globalThis.fetch;const calls=[];
 globalThis.fetch=async url=>{
  const path=String(url);calls.push(path);
  if(path.endsWith('/history-v206/ratings.json'))return {ok:true,json:async()=>structuredClone(w7Rows)};
  if(path.endsWith('/history-v205/ratings.json'))return {ok:true,json:async()=>structuredClone(w6Rows)};
  if(path.endsWith('/history-v2042/ratings.json'))return {ok:true,json:async()=>structuredClone(oldRows)};
  throw new Error('unexpected ratings path '+path);
 };
 try{
  for(const [module,data] of [[E,rows],[W7,w7Rows],[W6,w6Rows],[Q,oldRows],[L,oldRows]]){
   const s=module.createGame(data,input);module.advancePossession(s);module.setLiveControls(s,{manualLevel:-2,prototype:'B'});finish(module,s);
   const audit=module.exportAudit(s),replayed=await replayArchived(rows,audit);
   assert.equal(module.exportAudit(replayed).gameplayHash,audit.gameplayHash);assert.deepEqual(replayed.teams,s.teams);
  }
  assert.equal(calls.length,4);
  await assert.rejects(()=>replayArchived(rows,{identity:{engine:'UNKNOWN'}}),/BLOCKED/);
  globalThis.fetch=async()=>({ok:false,status:404});
  const s=finish(W6,W6.createGame(w6Rows,input));
  await assert.rejects(()=>replayArchived(rows,W6.exportAudit(s)),/historical ratings load 404/);
 }finally{globalThis.fetch=originalFetch;}
});

test('historical QUARTERFIX1 quarter regression still retains the pending fifth drive',()=>{
 const s=Q.createGame(oldRows,input);Q.playToQuarterBoundary(s);
 assert.deepEqual(s.score,{away:7,home:0});assert.equal(s.nextPossession,5);
 assert.ok(s.pendingDrive);assert.deepEqual(s.periodsStarted,[true,false,false,false]);
});

test('all runtime imports, frozen snapshots, and Week 9 labels resolve',async()=>{
 await import('./app.mjs?v=v2079-w09');await import('./replay_router.mjs?v=v2079-w09');
 for(const file of ['bootstrap.mjs','app.mjs','replay_router.mjs','engine_r1.mjs','history-v206/engine_r1.mjs','history-v205/engine_r1.mjs','history-v2042/engine_quarterfix1.mjs','history-v2042/engine_r1_legacy.mjs']){
  for(const m of read('./'+file).matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g))if(m[1].startsWith('.'))assert.ok(existsSync(new URL(m[1].split('?')[0],new URL(file,import.meta.url))));
 }
 const html=read('./index.html');assert.ok(html.includes('Week 9 Ratings'));assert.ok(html.includes('Week 9 approved ratings'));assert.ok(!html.includes('Week 7 Ratings'));
 assert.equal(sha(read('./history-v205/ratings.json')),'fb3b6ef88bbcd2bd7d33149bac99f10167eff6b6598579d6ffe79426f5d22ac0');
 assert.equal(sha(read('./history-v205/engine_r1.mjs')),'77481420b38cb41609d77993de705e6eda8a68e3c58b048185e12c2c6927fdd2');
});

test('package manifest covers and verifies every file except itself',()=>{
 const manifest=JSON.parse(read('./SHA256SUMS.json'));
 for(const [path,hash] of Object.entries(manifest))assert.equal(sha(readFileSync(new URL('./'+path,import.meta.url))),hash,path);
 assert.equal(Object.keys(manifest).length,21);
});
