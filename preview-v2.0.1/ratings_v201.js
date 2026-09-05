// POWER CRUNCH v2.0.1 display-rating and audit adapter.
(function(){
const PRODUCT_VERSION='PC-MOBILE-v2.0.1';
const RATING_SCALE='60-99-linear-minmax';
const bounds={};
for(const field of ['overall','offense','defense']){const values=T.map(t=>t[field]);bounds[field]={lo:Math.min(...values),hi:Math.max(...values)};}
human=function(field,t){const b=bounds[field];if(!b||b.hi===b.lo)return 80;const score=60+39*((t[field]-b.lo)/(b.hi-b.lo));return Math.max(60,Math.min(99,Math.round(score)));};
label=function(n){return n>=96?'National Elite':n>=92?'Elite':n>=88?'Excellent':n>=84?'Very Good':n>=80?'Strong':n>=76?'Above Average':n>=72?'Average':n>=68?'Below Average':n>=64?'Weak':'Bottom Tier';};
const priorAudit=audit;
audit=function(){const x=priorAudit();x.engineVersion=PRODUCT_VERSION;x.dataVersion=window.PC_DATA_VERSION||x.dataVersion;x.ratingScale=RATING_SCALE;x.board=window.PC_BOARD_NAME||null;return x;};
const priorReplayHistory=replayHistory;
replayHistory=function(id){const g=getHistory().find(x=>x.simulationId===id);if(!g)return;if(g.dataVersion&&g.dataVersion!==(window.PC_DATA_VERSION||g.dataVersion)){const ok=confirm('This audit was created with '+g.dataVersion+'. Re-simulating now uses '+window.PC_DATA_VERSION+' and may not reproduce the archived score. Continue with the saved teams and seed?');if(!ok)return;}priorReplayHistory(id);};
renderRatings();
})();
