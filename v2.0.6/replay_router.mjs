import {ENGINE_ID,replayAudit} from './engine_r1.mjs?v=v206-w07';

// Exact archived replay uses the matching frozen engine and its original ratings.
// No missing module or data silently falls back to another engine.
export async function replayArchived(currentRows,audit){
  const id=audit?.identity?.engine;
  if(id===ENGINE_ID)return replayAudit(currentRows,audit);
  let modulePath,ratingsPath;
  if(id==='PC-MOBILE-v2.0.5'){
    modulePath='./history-v205/engine_r1.mjs';ratingsPath='./history-v205/ratings.json';
  }else if(id==='PC-MOBILE-v2.0.4.2-R1-QUARTERFIX1'){
    modulePath='./history-v2042/engine_quarterfix1.mjs';ratingsPath='./history-v2042/ratings.json';
  }else if(id==='PC-MOBILE-v2.0.4.2-R1-PROTOTYPE'){
    modulePath='./history-v2042/engine_r1_legacy.mjs';ratingsPath='./history-v2042/ratings.json';
  }else throw new Error('BLOCKED: unsupported archived engine identity');
  const historical=await import(modulePath);
  const response=await fetch(new URL(ratingsPath,import.meta.url),{cache:'no-store'});
  if(!response.ok)throw new Error('BLOCKED: historical ratings load '+response.status);
  return historical.replayAudit(await response.json(),audit);
}
