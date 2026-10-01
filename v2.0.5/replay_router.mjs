import {ENGINE_ID,replayAudit} from './engine_r1.mjs?v=v205-w06';

// Historical replay must use both the archived engine and its rating snapshot.
// Unknown identities fail; this is never a fallback for new gameplay.
export async function replayArchived(currentRows,audit){
  const id=audit?.identity?.engine;
  if(id===ENGINE_ID)return replayAudit(currentRows,audit);
  let historical;
  if(id==='PC-MOBILE-v2.0.4.2-R1-QUARTERFIX1')historical=await import('./history-v2042/engine_quarterfix1.mjs');
  else if(id==='PC-MOBILE-v2.0.4.2-R1-PROTOTYPE')historical=await import('./history-v2042/engine_r1_legacy.mjs');
  else throw new Error('BLOCKED: unsupported archived engine identity');
  const response=await fetch(new URL('./history-v2042/ratings.json',import.meta.url),{cache:'no-store'});
  if(!response.ok)throw new Error('BLOCKED: historical ratings load '+response.status);
  return historical.replayAudit(await response.json(),audit);
}
