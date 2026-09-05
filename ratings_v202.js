// POWER CRUNCH v2.0.2 runtime adapter: 60–99 UI + PSCORE margin-preserving scoring calibration.
(function(){
const PRODUCT_VERSION='PC-MOBILE-v2.0.2';
const RATING_SCALE='60-99-linear-minmax';
const C=window.PC_PSCORE_CONTROLS;
const P=window.PC_PROFILE_MAP;
const bounds={};
for(const field of ['overall','offense','defense']){const values=T.map(t=>t[field]);bounds[field]={lo:Math.min(...values),hi:Math.max(...values)};}
human=function(field,t){const b=bounds[field];if(!b||b.hi===b.lo)return 80;const score=60+39*((t[field]-b.lo)/(b.hi-b.lo));return Math.max(60,Math.min(99,Math.round(score)));};
label=function(n){return n>=96?'National Elite':n>=92?'Elite':n>=88?'Excellent':n>=84?'Very Good':n>=80?'Strong':n>=76?'Above Average':n>=72?'Average':n>=68?'Below Average':n>=64?'Weak':'Bottom Tier';};

// PSCORE M2-R: overall controls margin; profile-pair tilt shifts both team scores equally.
// Existing tempo remains a symmetric total-only adjustment so it cannot change expected margin.
matchup=function(a,h,n){
  const pa=P[a.short],ph=P[h.short];
  const homeStrength=ph.po*C.equivalentPlays/100;
  const awayStrength=pa.po*C.equivalentPlays/100;
  const site=n?C.neutralOffset:C.homeOffset;
  const m=homeStrength-awayStrength+site;
  const tempoAdj=((a.tempo+h.tempo)-1.04)*14;
  const m1Total=Math.max(C.baseTotal+tempoAdj,Math.abs(m)+2*C.minTeamScore);
  const profileShift=ph.st+pa.st;
  const hp=(m1Total+m)/2+profileShift;
  const ap=(m1Total-m)/2+profileShift;
  return{m,ap:Math.max(C.minTeamScore,ap),hp:Math.max(C.minTeamScore,hp),p:winp(m),profileShift,tempoAdj,m1Total};
};

// Quarter means are anchored to the calibrated full-game team totals. Random scoring remains seeded.
quarterPoints=function(team,opp,r,q){
  const p=matchup(S.a,S.h,S.n);
  const target=team.short===S.a.short?p.ap:p.hp;
  const qWeight=[0.24,0.26,0.24,0.26][q-1]||0.25;
  const mean=Math.max(0.8,target*qWeight);
  const x=Math.max(0,Math.round(mean+norm(r)*4.4));
  const vals=[0,3,6,7,10,13,14,17,20,21,24,27,28];
  let best=vals.reduce((a,b)=>Math.abs(b-x)<Math.abs(a-x)?b:a);
  if(q===4&&r()<.06)best+=3;
  return best;
};

ratingCard=function(t){const v=P[t.short];return`<div class="team-card"><h3>${t.team}</h3><div class="conf">${t.conference} · National #${R.overall[t.short]}</div>${['overall','offense','defense'].map(f=>{let n=human(f,t);return`<div class="rating-line"><span>${f[0].toUpperCase()+f.slice(1)}</span><b>${n}</b><em>${label(n)}</em></div>`}).join('')}<details><summary>Raw model ratings</summary><div class="raw">Overall Elo ${t.overall.toFixed(2)} · PSCORE Offense ${t.offense.toFixed(2)} · PSCORE Defense ${t.defense.toFixed(2)}<br>Power ${v.p.toFixed(4)} · Shrunk profile tilt ${v.st.toFixed(3)} pts</div></details></div>`};

const priorAudit=audit;
audit=function(){const x=priorAudit();const p=matchup(S.a,S.h,S.n);x.engineVersion=PRODUCT_VERSION;x.dataVersion=window.PC_DATA_VERSION;x.ratingScale=RATING_SCALE;x.model=window.PC_MODEL_NAME;x.overallSource=window.PC_OVERALL_SOURCE;x.unitSource=window.PC_UNIT_SOURCE;x.pscoreProfileShift=p.profileShift;x.pscoreM1Total=p.m1Total;x.tempoTotalAdjustment=p.tempoAdj;x.projectionPolicy='M1 overall margin + symmetric PSCORE M2-R profile shift';return x;};

const priorReplayHistory=replayHistory;
replayHistory=function(id){const g=getHistory().find(x=>x.simulationId===id);if(!g)return;if(g.dataVersion&&g.dataVersion!==window.PC_DATA_VERSION){const ok=confirm('This audit was created with '+g.dataVersion+'. Re-simulating now uses '+window.PC_DATA_VERSION+' and may not reproduce the archived score. Continue with the saved teams and seed?');if(!ok)return;}priorReplayHistory(id);};

renderRatings();
})();
