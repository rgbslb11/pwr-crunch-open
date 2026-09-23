import {
  ENGINE_ID,DATA_ID,PARAMS,createGame,setLiveControls,advancePossession,forecast,exportAudit,replayAudit,
  driveProbabilities,pregamePrior,quarterClock,regulationQuarter,gameplayStateHash
} from './engine_r1.mjs?v=bootfix1';

const STORE='powerCrunchAudit_PC2042_R1';
const $=id=>document.getElementById(id);
let rows=[],teams=[],state=null,lastForecast=null,playing=false,pauseRequested=false;

export async function init(){
  rows=await fetch('./ratings.json?v=bootfix1',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('ratings load '+r.status);return r.json();});
  teams=rows.map(r=>({slot:r[0],code:r[1],name:r[2],conference:r[3],overall:r[4],offense:r[5],defense:r[6]}));
  fillTeams();renderRatings();renderHistory();wire();newSeed();updateAdvReadout();
  $('setupControls').disabled=false;
  $('startupStatus').textContent='Ready - 134 teams loaded. Select your matchup.';
  document.documentElement.dataset.ready='true';
}

function fillTeams(){
  const opts=teams.map(t=>`<option value="${esc(t.code)}">#${t.slot} ${esc(t.name)} (${esc(t.code)})</option>`).join('');
  $('away').innerHTML=opts;$('home').innerHTML=opts;$('away').value='TEX';$('home').value='UGA';
}
function newSeed(){const a=new Uint32Array(1);crypto.getRandomValues(a);$('seed').value=String(a[0]||1);}
function getInput(){return{away:$('away').value,home:$('home').value,seed:Number($('seed').value),neutral:$('neutral').checked,temperature:Number($('temperature').value),precipitation:$('precipitation').value,evenTeams:$('evenTeams').checked,manualLevel:Number($('manualLevel').value),prototype:$('prototype').value,comebackEnabled:$('comebackEnabled').checked};}
function locked(on){for(const id of ['away','home','seed','neutral','temperature','precipitation','evenTeams','newSeed','start'])$(id).disabled=on;}
function selectedCodes(){return{a:$('away').value||'A',h:$('home').value||'B'};}
function updateAdvReadout(){const v=Number($('manualLevel').value),{a,h}=selectedCodes();$('advReadout').textContent=v<0?`${a} +${Math.abs(v)} · Prototype ${$('prototype').value}`:v>0?`${h} +${v} · Prototype ${$('prototype').value}`:`EVEN · Prototype ${$('prototype').value}`;}
function applyLiveControl(){updateAdvReadout();if(!state||state.final)return;try{setLiveControls(state,{manualLevel:Number($('manualLevel').value),prototype:$('prototype').value,comebackEnabled:$('comebackEnabled').checked});render();}catch(e){showError(e);}}

async function startGame(){
  if($('away').value===$('home').value)return alert('Choose two different teams.');
  try{state=createGame(rows,getInput());locked(true);$('gameCard').classList.remove('hidden');lastForecast=forecast(state,100);render();$('gameCard').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){showError(e);}
}
function newGame(){playing=false;pauseRequested=true;state=null;lastForecast=null;locked(false);$('gameCard').classList.add('hidden');}

async function stepOne(){
  if(!state||state.final)return;
  try{advancePossession(state);lastForecast=forecast(state,100);render();if(state.final)saveFinal();}catch(e){showError(e);}
}
async function playQuarter(){
  if(!state||state.final||playing)return;playing=true;pauseRequested=false;$('pause').disabled=false;$('playNext').disabled=true;$('playQuarter').disabled=true;
  const startPhase=state.regSecondsRemaining>0?'REG':'OT';const startPeriod=startPhase==='REG'?regulationQuarter(state.regSecondsRemaining):state.ot?.period||1;
  try{
    for(let guard=0;guard<40&&!state.final&&!pauseRequested;guard++){
      advancePossession(state);render(false);await tick(80);
      const nowPeriod=state.regSecondsRemaining>0?regulationQuarter(state.regSecondsRemaining):state.ot?.period||1;
      if(startPhase==='REG'?(state.regSecondsRemaining===0||nowPeriod!==startPeriod):nowPeriod!==startPeriod)break;
    }
    lastForecast=state?forecast(state,100):null;render();if(state?.final)saveFinal();
  }catch(e){showError(e);}finally{playing=false;$('pause').disabled=true;if(state&&!state.final){$('playNext').disabled=false;$('playQuarter').disabled=false;}}
}
function requestPause(){pauseRequested=true;}

function render(withForecast=true){if(!state)return;renderPregame();renderScore();renderStatus();renderTransparency();renderLedger();if(withForecast&&lastForecast){}$('playNext').disabled=state.final||playing;$('playQuarter').disabled=state.final||playing;$('pause').disabled=!playing;}
function renderPregame(){const p=pregamePrior(state);$('pregame').innerHTML=`<div class="metrics"><div class="metric"><span class="small">Pregame TEAM prior</span><b>${p.homeMargin>=0?state.teams.home.code:state.teams.away.code} ${Math.abs(p.homeMargin).toFixed(1)}</b><span class="small">Reference prior only; final is not forced</span></div><div class="metric"><span class="small">Forecast</span><b>${lastForecast?`${state.teams.home.code} ${(lastForecast.homeWinProbability*100).toFixed(1)}%`:'Pending'}</b><span class="small">${lastForecast?`${lastForecast.samples} paths · SE ${(lastForecast.standardError*100).toFixed(1)}%`:''}</span></div></div>`;}
function renderScore(){const otA=state.overtime.away.reduce((a,b)=>a+b,0),otH=state.overtime.home.reduce((a,b)=>a+b,0);$('scoreboard').innerHTML=`<div></div><div>Q1</div><div>Q2</div><div>Q3</div><div>Q4</div><div>OT</div><div>F</div><div class="team">${esc(state.teams.away.code)}</div>${state.quarters.away.map(x=>`<div>${x}</div>`).join('')}<div>${otA}</div><div><b>${state.score.away}</b></div><div class="team">${esc(state.teams.home.code)}</div>${state.quarters.home.map(x=>`<div>${x}</div>`).join('')}<div>${otH}</div><div><b>${state.score.home}</b></div>`;}
function renderStatus(){if(state.final){$('status').innerHTML=`<b>FINAL · ${esc(state.teams[state.winner].code)} ${state.score[state.winner]}-${state.score[state.winner==='away'?'home':'away']}</b><div class="small">${state.events.length} committed possession events · ${state.changes.length} live-control changes</div>`;return;}let txt;if(state.regSecondsRemaining>0){const c=quarterClock(state.regSecondsRemaining);txt=`Q${c.quarter} ${clock(c.seconds)} · ${state.teams[state.currentSide].code} ball · ${fieldLabel(state.yardsToGoal)}`;}else txt=`OT${state.ot?.period||1} · ${state.teams[state.currentSide].code} possession`;const changes=state.changes.at(-1);$('status').innerHTML=`<b>${esc(txt)}</b><div class="small">Next event #${state.nextPossession}${changes&&changes.effectiveFromPossession===state.nextPossession?` · queued change applies now`:''}</div>`;}
function renderTransparency(){let html='';if(!state.final&&state.regSecondsRemaining>0){const q=regulationQuarter(state.regSecondsRemaining),m=driveProbabilities(state,state.currentSide,state.yardsToGoal,q),side=state.currentSide,opp=side==='away'?'home':'away';html+=`<div class="metrics"><div class="metric"><span class="small">${state.teams[side].code} base TEAM / OFF / DEF</span><b>${fmt3(state.teams[side])}</b><span class="small">Effective ${fmt3(m.effective[side])}</span></div><div class="metric"><span class="small">${state.teams[opp].code} base TEAM / OFF / DEF</span><b>${fmt3(state.teams[opp])}</b><span class="small">Effective ${fmt3(m.effective[opp])}</span></div><div class="metric"><span class="small">Drive strength</span><b>${m.strength.total.toFixed(2)}</b><span class="small">TEAM gap ${m.strength.teamGap.toFixed(2)} · unit residual ${m.strength.unitResidual.toFixed(2)} · site ${m.strength.siteStrength.toFixed(2)}</span></div><div class="metric"><span class="small">Scoring opportunity</span><b>${(m.pScore*100).toFixed(1)}%</b><span class="small">Field logit ${m.fieldLogit.toFixed(3)} · weather ${m.weather.total.toFixed(3)}</span></div><div class="metric"><span class="small">Manual / Comeback / Applied</span><b>${m.effective.manual.toFixed(2)} / ${m.effective.comeback.signed.toFixed(2)} / ${m.effective.combined.toFixed(2)}</b><span class="small">Clipped ${m.effective.clipped.toFixed(2)}</span></div><div class="metric"><span class="small">Expected final from forecast</span><b>${lastForecast?`${state.teams.away.code} ${lastForecast.meanFinalAway.toFixed(1)} · ${state.teams.home.code} ${lastForecast.meanFinalHome.toFixed(1)}`:'Pending'}</b></div></div><details><summary>Next-drive probability vector</summary><div class="json">${esc(JSON.stringify(m.probabilities,null,2))}</div></details>`;}else if(state.events.length){html=`<div class="small">Final deterministic gameplay hash</div><div class="json">${esc(gameplayStateHash(state))}</div>`;}$('transparency').innerHTML=html;}
function renderLedger(){const events=[...state.events].reverse();$('ledger').innerHTML=events.map(e=>{const team=state.teams[e.offense]?.code||e.offense;const clockText=e.phase==='REG'?`Q${e.startClock.quarter} ${clock(e.startClock.seconds)}`:`OT${e.otPeriod}`;const prob=e.probabilityModel?` · P(score) ${(e.probabilityModel.pScore*100).toFixed(1)}%`:'';return`<div class="drive"><b>#${e.index} · ${esc(clockText)} · ${esc(team)}</b>${prob}<strong>${esc(e.result)} · ${state.teams.away.code} ${e.scoreAfter.away} - ${state.teams.home.code} ${e.scoreAfter.home}</strong><div class="small">Start ${e.startYardsToGoal?fieldLabel(e.startYardsToGoal):''} · ${e.actualDurationSeconds??0}s · manual ${e.modifier?.manual??e.controls.manualLevel} · ${esc(e.controls.prototype)}</div><details><summary>Audit detail</summary><div class="json">${esc(JSON.stringify(e,null,2))}</div></details></div>`;}).join('');}

function saveFinal(){if(!state?.final||state._saved)return;const a=exportAudit(state);const h=getHistory();h.unshift(a);try{localStorage.setItem(STORE,JSON.stringify(h));state._saved=true;renderHistory();}catch(e){alert('Prototype history storage is full. Export history, then explicitly clear records before saving more games. No existing history was deleted.');console.error(e);}}
function getHistory(){try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return[]}}
function renderHistory(){const h=getHistory();$('history').innerHTML=h.length?h.map((a,i)=>`<div class="drive"><b>${esc(a.initial.away)} ${a.score.away} - ${esc(a.initial.home)} ${a.score.home}</b><div class="small">Seed ${a.initial.seed} · ${esc(a.completedAt||'')} · ${a.events.length} events</div><div class="actions"><button class="secondary exact" data-i="${i}">Exact Replay</button><button class="secondary rerun" data-i="${i}">Re-run Same Seed</button></div></div>`).join(''):'<p class="muted">No completed R1 prototype games on this device.</p>';document.querySelectorAll('.exact').forEach(b=>b.onclick=()=>exactReplay(Number(b.dataset.i)));document.querySelectorAll('.rerun').forEach(b=>b.onclick=()=>rerunSeed(Number(b.dataset.i)));}
function exactReplay(i){try{const a=getHistory()[i],s=replayAudit(rows,a);state=s;state._saved=true;for(const k of ['away','home'])$(k).value=a.initial[k];$('seed').value=a.initial.seed;$('neutral').checked=a.initial.neutral;$('temperature').value=a.initial.temperature;$('precipitation').value=a.initial.precipitation;$('evenTeams').checked=a.initial.evenTeams;$('manualLevel').value=a.initial.manualLevel;$('prototype').value=a.initial.prototype;$('comebackEnabled').checked=a.initial.comebackEnabled;locked(true);lastForecast=null;$('gameCard').classList.remove('hidden');render();document.querySelector('[data-tab="game"]').click();}catch(e){showError(e);}}
function rerunSeed(i){const a=getHistory()[i];$('away').value=a.initial.away;$('home').value=a.initial.home;$('seed').value=a.initial.seed;newGame();document.querySelector('[data-tab="game"]').click();updateAdvReadout();}
function exportHistory(){const blob=new Blob([JSON.stringify(getHistory(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`power-crunch-v2042-r1-history-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);}

function renderRatings(){$('ratingsTable').innerHTML=`<div class="rating-table">${teams.map(t=>`<div class="rating-row"><span>#${t.slot}</span><span><b>${esc(t.name)}</b><span class="small"> ${esc(t.conference)}</span></span><span>${t.overall}</span><span>${t.offense}</span><span>${t.defense}</span></div>`).join('')}</div>`;}
function wire(){
 document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button,.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(`tab-${b.dataset.tab}`).classList.add('active');if(b.dataset.tab==='history')renderHistory();});
 $('newSeed').onclick=newSeed;$('start').onclick=startGame;$('playNext').onclick=stepOne;$('playQuarter').onclick=playQuarter;$('pause').onclick=requestPause;$('endGame').onclick=newGame;
 $('manualLevel').oninput=applyLiveControl;$('prototype').onchange=applyLiveControl;$('comebackEnabled').onchange=applyLiveControl;$('away').onchange=updateAdvReadout;$('home').onchange=updateAdvReadout;
 $('exportHistory').onclick=exportHistory;$('clearHistory').onclick=()=>{if(confirm('Delete only v2.0.4.2 R1 prototype history on this device?')){localStorage.removeItem(STORE);renderHistory();}};
}
function fmt3(t){return`${t.overall.toFixed(2)} / ${t.offense.toFixed(2)} / ${t.defense.toFixed(2)}`}
function fieldLabel(ytg){if(ytg===50)return'50';if(ytg>50)return`own ${100-ytg}`;return`opp ${ytg}`}
function clock(sec){const m=Math.floor(sec/60),s=Math.floor(sec%60);return`${m}:${String(s).padStart(2,'0')}`}
function tick(ms){return new Promise(r=>setTimeout(r,ms))}
function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function showError(e){console.error(e);alert(e?.message||String(e));}


