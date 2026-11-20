/**
 * POWER CRUNCH v2.0.4.2 R1 possession-engine prototype.
 * Assumption-governed prototype: playable mechanics, not empirical calibration.
 * Pure module: no DOM, storage, network, service worker, or production fallback.
 */

export const ENGINE_ID = 'PC-MOBILE-v2.0.4.2-R1-PROTOTYPE';
export const DATA_ID = '2026-through-W04-for-W05-operator-ratings-v1';
export const CONFIG_ID = 'PC-2042-R1-PROVISIONAL-2026-09-23';
export const RNG_ID = 'PC-SHA256-EVENT-v1';
export const AUDIT_ID = 'PC-AUDIT-v2042-R1';

export const PARAMS = Object.freeze({
  teamMarginPointsPerRating: 0.75,
  homeFieldPoints: 2.5,
  unitResidualWeight: 0.50,
  scoreLogitPerDriveStrength: 0.0252,
  fieldLogitPerYard: 0.032,
  baseDriveSeconds: 150,
  driveSecondsSd: 60,
  driveSecondsMin: 30,
  driveSecondsMax: 330,
  patMake: 0.955,
  twoPointMake: 0.458,
  fieldGoalMake: 0.756,
  precipLogit: Object.freeze({ none: 0, light: -0.05, moderate: -0.12, heavy: -0.25 }),
  temperatureNeutralLow: 45,
  temperatureNeutralHigh: 85,
  temperatureLogitPerDegreeOutside: -0.005,
  temperatureLogitFloor: -0.20,
  baselineOwn25: Object.freeze({
    TD: 0.239,
    FGA: 0.113,
    PUNT: 0.449,
    DOWNS: 0.061,
    FUMBLE: 0.047,
    INT: 0.079,
    SAFETY: 0.001,
    END_HALF_SOURCE_ONLY: 0.011
  }),
  nextField: Object.freeze({
    PUNT: Object.freeze({ meanYardsToGoal: 73, sd: 10, min: 50, max: 95 }),
    INT: Object.freeze({ meanYardsToGoal: 60, sd: 15, min: 20, max: 95 }),
    FUMBLE: Object.freeze({ meanYardsToGoal: 60, sd: 15, min: 20, max: 95 }),
    DOWNS: Object.freeze({ meanYardsToGoal: 58, sd: 12, min: 15, max: 90 }),
    FG_MISS: Object.freeze({ meanYardsToGoal: 65, sd: 8, min: 45, max: 90 }),
    SAFETY: Object.freeze({ meanYardsToGoal: 70, sd: 8, min: 50, max: 90 })
  })
});

const A_ALPHA = 0.006249633846986093;
const B_ALPHA = Math.log(1.0189258);
const B_BETA = 0.5;
const LIVE_KEYS = new Set(['manualLevel', 'prototype', 'comebackEnabled']);
const PRECIP = new Set(['none', 'light', 'moderate', 'heavy']);
const UINT32_MAX = 0xffffffff;

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const otherSide = side => side === 'away' ? 'home' : 'away';
const logistic = x => 1 / (1 + Math.exp(-x));
const logit = p => Math.log(p / (1 - p));
const round6 = x => Math.round(x * 1e6) / 1e6;
const finite = x => typeof x === 'number' && Number.isFinite(x);

export class Blocked extends Error {
  constructor(message) { super(`BLOCKED: ${message}`); this.name = 'Blocked'; }
}
function demand(ok, message) { if (!ok) throw new Blocked(message); }

function canonicalize(x) {
  if (x === null || typeof x === 'string' || typeof x === 'boolean') return x;
  if (typeof x === 'number') { demand(Number.isFinite(x), 'nonfinite canonical value'); return x; }
  if (Array.isArray(x)) return x.map(canonicalize);
  demand(x && typeof x === 'object', 'unsupported canonical value');
  return Object.fromEntries(Object.keys(x).sort().map(k => [k, canonicalize(x[k])]));
}
export function canonicalJSON(x) { return JSON.stringify(canonicalize(x)); }

/* Browser-neutral synchronous SHA-256 over UTF-8 input. */
export function sha256(input) {
  const bytes = new TextEncoder().encode(String(input));
  const K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ]);
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const bitLen = bytes.length * 8;
  const withOne = bytes.length + 1;
  const pad = (64 - ((withOne + 8) % 64)) % 64;
  const msg = new Uint8Array(withOne + pad + 8);
  msg.set(bytes); msg[bytes.length] = 0x80;
  const view = new DataView(msg.buffer);
  const high = Math.floor(bitLen / 0x100000000);
  const low = bitLen >>> 0;
  view.setUint32(msg.length - 8, high, false);
  view.setUint32(msg.length - 4, low, false);
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < msg.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15] >>> 3);
      const s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2] >>> 10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
    }
    let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
    }
    H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
    H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
  }
  return Array.from(H, n => n.toString(16).padStart(8, '0')).join('');
}

export function eventDraw({seed, domain='game', team='GAME', possession=0, event, subIndex=0, replicate=0}) {
  demand(Number.isInteger(seed) && seed >= 0 && seed <= UINT32_MAX, 'seed must be uint32');
  demand(domain === 'game' || domain === 'forecast', 'unknown RNG domain');
  demand(typeof team === 'string' && team.length > 0, 'missing RNG team identity');
  demand(Number.isSafeInteger(possession) && possession >= 0, 'invalid RNG possession');
  demand(typeof event === 'string' && event.length > 0, 'missing RNG event');
  demand(Number.isSafeInteger(subIndex) && subIndex >= 0, 'invalid RNG subIndex');
  demand(Number.isSafeInteger(replicate) && replicate >= 0, 'invalid RNG replicate');
  demand(domain !== 'game' || replicate === 0, 'game RNG cannot use forecast replicate');
  const key = JSON.stringify([RNG_ID, seed, domain, team, possession, event, subIndex, replicate]);
  const hash = sha256(key);
  const bits = BigInt('0x' + hash.slice(0, 14)) >> 3n;
  return { key, hash, u: Number(bits) / 9007199254740992 };
}

function normalDraw(ctx, eventBase) {
  const d1 = eventDraw({...ctx, event: `${eventBase}.u1`, subIndex: 0});
  const d2 = eventDraw({...ctx, event: `${eventBase}.u2`, subIndex: 1});
  const u1 = Math.max(d1.u, Number.EPSILON);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * d2.u);
  return { z, draws: [d1,d2] };
}

export function validateRatings(rows) {
  demand(Array.isArray(rows) && rows.length === 134, 'expected 134 rating rows');
  const codes = new Set();
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    demand(Array.isArray(r) && r.length === 7, 'rating row shape');
    const [slot,code,name,conference,overall,offense,defense] = r;
    demand(slot === i + 1, 'rating slot/rank order changed');
    demand(typeof code === 'string' && code && !codes.has(code), 'invalid/duplicate code');
    demand(typeof name === 'string' && name && typeof conference === 'string' && conference, 'missing team identity');
    for (const x of [overall,offense,defense]) demand(Number.isInteger(x) && x >= 60 && x <= 99, 'invalid base rating');
    codes.add(code);
    out.push(Object.freeze({slot,code,name,conference,overall,offense,defense}));
  }
  return out;
}

export function multiplier(prototype, k) {
  demand(prototype === 'A' || prototype === 'B', 'unknown prototype');
  demand(finite(k) && k >= 0 && k <= 3, 'strength level outside 0..3');
  if (prototype === 'A') return Math.exp(A_ALPHA * k);
  return Math.exp(B_ALPHA * Math.tanh(B_BETA*k) / Math.tanh(3*B_BETA));
}

export function comebackState(enabled, quarter, awayScore, homeScore) {
  demand(typeof enabled === 'boolean', 'invalid comeback enabled');
  demand(Number.isInteger(quarter) && quarter >= 1, 'invalid quarter');
  const deficit = Math.abs(awayScore - homeScore);
  let level = 0;
  if (enabled && (quarter === 3 || quarter === 4) && deficit > 0) {
    level = quarter === 3 ? Math.min(2, deficit / 10) : Math.min(3, deficit / 7);
  }
  return {quarter, deficit, level, signed: level === 0 ? 0 : awayScore < homeScore ? -level : level};
}

function effectivePair(state, quarter) {
  const baseAway = state.teams.away;
  const baseHome = state.teams.home;
  const a = {...baseAway}, h = {...baseHome};
  if (state.initial.evenTeams) {
    for (const f of ['overall','offense','defense']) a[f] = h[f] = (baseAway[f] + baseHome[f]) / 2;
  }
  const cb = comebackState(state.controls.comebackEnabled, quarter, state.score.away, state.score.home);
  const requested = state.controls.manualLevel + cb.signed;
  const combined = clamp(requested, -3, 3);
  const m = multiplier(state.controls.prototype, Math.abs(combined));
  const awayFactor = combined < 0 ? m : combined > 0 ? 1/m : 1;
  const homeFactor = 1 / awayFactor;
  for (const f of ['overall','offense','defense']) { a[f] *= awayFactor; h[f] *= homeFactor; }
  return {
    away:a, home:h, manual:state.controls.manualLevel, prototype:state.controls.prototype,
    comeback:cb, requested, combined, clipped:requested-combined,
    appliedComeback:combined-state.controls.manualLevel,
    awayMultiplier:awayFactor, homeMultiplier:homeFactor
  };
}

export function driveStrength(offense, defense, side, neutral=false) {
  const teamGap = offense.overall - defense.overall;
  const unitEdge = offense.offense - defense.defense;
  const unitResidual = unitEdge - teamGap;
  const unitAdjusted = teamGap + PARAMS.unitResidualWeight * unitResidual;
  const hfaEquivalentRating = PARAMS.homeFieldPoints / PARAMS.teamMarginPointsPerRating;
  const siteStrength = neutral ? 0 : side === 'home' ? hfaEquivalentRating : -hfaEquivalentRating;
  return {teamGap, unitEdge, unitResidual, unitAdjusted, siteStrength, total:unitAdjusted+siteStrength};
}

export function weatherLogit(initial) {
  const precip = PARAMS.precipLogit[initial.precipitation];
  demand(finite(precip), 'unknown precipitation');
  const t = initial.temperature;
  demand(finite(t), 'invalid temperature');
  let outside = 0;
  if (t < PARAMS.temperatureNeutralLow) outside = PARAMS.temperatureNeutralLow - t;
  else if (t > PARAMS.temperatureNeutralHigh) outside = t - PARAMS.temperatureNeutralHigh;
  const temp = Math.max(PARAMS.temperatureLogitFloor, outside * PARAMS.temperatureLogitPerDegreeOutside);
  return {precip, temperature:temp, total:precip+temp};
}

export function driveProbabilities(state, side, yardsToGoal, quarter) {
  const eff = effectivePair(state, quarter);
  const offense = eff[side], defense = eff[otherSide(side)];
  const strength = driveStrength(offense, defense, side, state.initial.neutral);
  const weather = weatherLogit(state.initial);
  const baseScore = PARAMS.baselineOwn25.TD + PARAMS.baselineOwn25.FGA;
  const fieldLogit = PARAMS.fieldLogitPerYard * (75 - yardsToGoal);
  const scoreLogit = logit(baseScore) + PARAMS.scoreLogitPerDriveStrength * strength.total + fieldLogit + weather.total;
  const pScore = clamp(logistic(scoreLogit), 0.005, 0.995);
  const tdShare = PARAMS.baselineOwn25.TD / baseScore;
  const fgShare = PARAMS.baselineOwn25.FGA / baseScore;
  const nonScoreKeys = ['PUNT','DOWNS','FUMBLE','INT','SAFETY'];
  const nonScoreRaw = nonScoreKeys.reduce((s,k)=>s+PARAMS.baselineOwn25[k],0);
  const p = {TD:pScore*tdShare, FGA:pScore*fgShare};
  for (const k of nonScoreKeys) p[k] = (1-pScore) * PARAMS.baselineOwn25[k] / nonScoreRaw;
  const sum = Object.values(p).reduce((a,b)=>a+b,0);
  p.PUNT += 1-sum;
  return {probabilities:p, pScore, scoreLogit, fieldLogit, weather, strength, effective:eff};
}

function sampleCategorical(probabilities, draw) {
  let c = 0;
  for (const [k,p] of Object.entries(probabilities)) { c += p; if (draw.u <= c + 1e-15) return k; }
  return Object.keys(probabilities).at(-1);
}

export function strategyDurationMultiplier(state, side) {
  const q = regulationQuarter(state.regSecondsRemaining);
  if (q !== 4) return 1;
  const offenseScore = state.score[side], defenseScore = state.score[otherSide(side)];
  const diff = offenseScore - defenseScore;
  const qSec = quarterClock(state.regSecondsRemaining).seconds;
  if (qSec <= 120) {
    if (diff <= -1) return 0.65;
    if (diff >= 1) return 1.25;
  }
  if (diff <= -8) return 0.80;
  if (diff >= 8) return 1.20;
  return 1;
}

export function regulationQuarter(regSecondsRemaining) {
  if (regSecondsRemaining <= 0) return 4;
  return 5 - Math.ceil(regSecondsRemaining / 900);
}
export function quarterClock(regSecondsRemaining) {
  if (regSecondsRemaining <= 0) return {quarter:4, seconds:0};
  const quarter = regulationQuarter(regSecondsRemaining);
  const seconds = regSecondsRemaining - (4-quarter)*900;
  return {quarter, seconds};
}
function scoringQuarter(afterSeconds, beforeSeconds) {
  if (afterSeconds === 0) return 4;
  const elapsed = 3600 - afterSeconds;
  const q = Math.ceil(elapsed / 900);
  return clamp(q || regulationQuarter(beforeSeconds), 1, 4);
}
function secondsUntilHalfOrGame(regSecondsRemaining) {
  if (regSecondsRemaining > 1800) return regSecondsRemaining - 1800;
  return regSecondsRemaining;
}

function drawDuration(state, side, teamPossession, ctx) {
  const n = normalDraw({...ctx, team:state.teams[side].code, possession:teamPossession}, 'drive.duration');
  const multiplier = strategyDurationMultiplier(state, side);
  const raw = PARAMS.baseDriveSeconds + PARAMS.driveSecondsSd*n.z;
  const sampled = clamp(Math.round(raw * multiplier), PARAMS.driveSecondsMin, PARAMS.driveSecondsMax);
  return {seconds:sampled, rawSeconds:raw, multiplier, draws:n.draws};
}

function drawNextYardsToGoal(state, nextSide, teamPossession, result, ctx) {
  if (result === 'TD' || result === 'FG_MADE') return {yardsToGoal:75, draws:[]};
  const spec = PARAMS.nextField[result];
  if (!spec) return {yardsToGoal:75, draws:[]};
  const n = normalDraw({...ctx, team:state.teams[nextSide].code, possession:teamPossession}, `field.${result}`);
  return {yardsToGoal:clamp(Math.round(spec.meanYardsToGoal + spec.sd*n.z), spec.min, spec.max), draws:n.draws};
}

function addRegulationPoints(state, side, points, quarter) {
  state.score[side] += points;
  state.quarters[side][quarter-1] += points;
}
function addOtPoints(state, side, points, period) {
  state.score[side] += points;
  while (state.overtime[side].length < period) state.overtime[side].push(0);
  state.overtime[side][period-1] += points;
}

function conversionAfterTd(state, side, teamPossession, ctx, period='REG') {
  if (period === 'REG' || period === 1) {
    const d = eventDraw({...ctx, team:state.teams[side].code, possession:teamPossession, event:'try.pat'});
    return {kind:'PAT', probability:PARAMS.patMake, made:d.u<PARAMS.patMake, points:d.u<PARAMS.patMake?1:0, draw:d};
  }
  const base = PARAMS.twoPointMake;
  const eff = effectivePair(state, 5);
  const str = driveStrength(eff[side], eff[otherSide(side)], side, state.initial.neutral);
  const w = weatherLogit(state.initial);
  const p = clamp(logistic(logit(base)+PARAMS.scoreLogitPerDriveStrength*str.total+w.total),0.05,0.95);
  const d = eventDraw({...ctx, team:state.teams[side].code, possession:teamPossession, event:'try.2pt'});
  return {kind:'TWO_POINT', probability:p, made:d.u<p, points:d.u<p?2:0, draw:d, strength:str, weather:w};
}

function identityBlock() {
  return {engine:ENGINE_ID,data:DATA_ID,config:CONFIG_ID,rng:RNG_ID,auditSchema:AUDIT_ID};
}

export function createGame(rows, input) {
  const teams = validateRatings(rows);
  const map = Object.fromEntries(teams.map(t=>[t.code,t]));
  demand(map[input.away] && map[input.home] && input.away !== input.home, 'invalid teams');
  demand(Number.isInteger(input.seed) && input.seed >= 0 && input.seed <= UINT32_MAX, 'seed must be uint32');
  demand(typeof input.neutral === 'boolean' && typeof input.evenTeams === 'boolean' && typeof input.comebackEnabled === 'boolean', 'invalid boolean control');
  demand(finite(input.temperature), 'invalid temperature');
  demand(PRECIP.has(input.precipitation), 'invalid precipitation');
  demand(Number.isInteger(input.manualLevel) && Math.abs(input.manualLevel) <= 3, 'manual level must be integer -3..3');
  demand(input.prototype === 'A' || input.prototype === 'B', 'invalid prototype');
  const openingDraw = eventDraw({seed:input.seed,domain:'game',team:'GAME',possession:0,event:'kickoff.opening'});
  const openingSide = openingDraw.u < 0.5 ? 'away' : 'home';
  const initial = {
    away:input.away, home:input.home, seed:input.seed, neutral:input.neutral,
    temperature:input.temperature, precipitation:input.precipitation, evenTeams:input.evenTeams,
    manualLevel:input.manualLevel, prototype:input.prototype, comebackEnabled:input.comebackEnabled
  };
  return {
    identity:identityBlock(),
    initial,
    teams:{away:map[input.away],home:map[input.home]},
    controls:{manualLevel:input.manualLevel,prototype:input.prototype,comebackEnabled:input.comebackEnabled},
    changes:[],
    events:[],
    opening:{side:openingSide,draw:openingDraw,secondHalfReceiver:otherSide(openingSide)},
    currentSide:openingSide,
    yardsToGoal:75,
    regSecondsRemaining:3600,
    teamPossessions:{away:0,home:0},
    nextPossession:1,
    score:{away:0,home:0},
    quarters:{away:[0,0,0,0],home:[0,0,0,0]},
    overtime:{away:[],home:[]},
    ot:null,
    final:false,
    winner:null,
    createdAt:new Date().toISOString()
  };
}

export function setLiveControls(state, patch) {
  demand(!state.final, 'game already final');
  demand(patch && Object.keys(patch).length > 0 && Object.keys(patch).every(k=>LIVE_KEYS.has(k)), 'pregame-only or unknown control');
  const next = {...state.controls,...patch};
  demand(Number.isInteger(next.manualLevel) && Math.abs(next.manualLevel)<=3, 'manual level must be integer -3..3');
  demand(next.prototype==='A'||next.prototype==='B','invalid prototype');
  demand(typeof next.comebackEnabled==='boolean','invalid comeback toggle');
  if (canonicalJSON(next) === canonicalJSON(state.controls)) return state;
  state.controls = next;
  state.changes.push({sequence:state.changes.length+1,effectiveFromPossession:state.nextPossession,patch:{...patch},controls:{...next}});
  return state;
}

function startOvertime(state, ctx) {
  const coin = eventDraw({...ctx,team:'GAME',possession:0,event:'ot.coin'});
  const winnerSide = coin.u < 0.5 ? 'away' : 'home';
  const first = otherSide(winnerSide); // policy: coin winner chooses defense first
  state.ot = {period:1,order:[first,winnerSide],position:0,coin:{winnerSide,draw:coin},periodStart:{away:0,home:0}};
  state.currentSide = first;
  state.yardsToGoal = 25;
}

function finish(state) {
  if (state.score.away === state.score.home) return;
  state.final = true;
  state.winner = state.score.away > state.score.home ? 'away' : 'home';
}

function eventContext(state, domain, replicate) {
  return {seed:state.initial.seed,domain,replicate};
}

function advanceRegulation(state, domain='game', replicate=0, record=true) {
  const side = state.currentSide, opp = otherSide(side);
  const beforeSeconds = state.regSecondsRemaining;
  const startClock = quarterClock(beforeSeconds);
  const teamPossession = state.teamPossessions[side] + 1;
  const ctx = eventContext(state,domain,replicate);
  const effective = effectivePair(state,startClock.quarter);
  const duration = drawDuration(state,side,teamPossession,ctx);
  const boundary = secondsUntilHalfOrGame(beforeSeconds);
  const scoreBefore = {...state.score};
  const startYardsToGoal = state.yardsToGoal;
  const rng = {duration:duration.draws};

  state.teamPossessions[side]++;
  let result, pointsOffense=0, pointsDefense=0, conversion=null, probabilityModel=null, outcomeDraw=null, field=null;
  if (duration.seconds >= boundary) {
    const actual = boundary;
    state.regSecondsRemaining -= actual;
    result = beforeSeconds > 1800 ? 'END_HALF' : 'END_GAME';
    duration.actualSeconds = actual;
    if (result === 'END_HALF') {
      state.currentSide = state.opening.secondHalfReceiver;
      state.yardsToGoal = 75;
    } else {
      if (state.score.away === state.score.home) startOvertime(state,ctx); else finish(state);
    }
  } else {
    duration.actualSeconds = duration.seconds;
    state.regSecondsRemaining -= duration.seconds;
    const endQuarter = scoringQuarter(state.regSecondsRemaining,beforeSeconds);
    probabilityModel = driveProbabilities(state,side,startYardsToGoal,startClock.quarter);
    outcomeDraw = eventDraw({...ctx,team:state.teams[side].code,possession:teamPossession,event:'drive.outcome'});
    rng.outcome = outcomeDraw;
    const sampled = sampleCategorical(probabilityModel.probabilities,outcomeDraw);
    result = sampled;
    if (sampled === 'TD') {
      pointsOffense = 6;
      conversion = conversionAfterTd(state,side,teamPossession,ctx,'REG');
      rng.conversion = conversion.draw;
      pointsOffense += conversion.points;
      addRegulationPoints(state,side,pointsOffense,endQuarter);
    } else if (sampled === 'FGA') {
      const d = eventDraw({...ctx,team:state.teams[side].code,possession:teamPossession,event:'fg.make'});
      rng.fieldGoal = d;
      if (d.u < PARAMS.fieldGoalMake) { result='FG_MADE'; pointsOffense=3; addRegulationPoints(state,side,3,endQuarter); }
      else result='FG_MISS';
    } else if (sampled === 'SAFETY') {
      pointsDefense=2; addRegulationPoints(state,opp,2,endQuarter);
    }
    const nextTeamPossession = state.teamPossessions[opp] + 1;
    field = drawNextYardsToGoal(state,opp,nextTeamPossession,result,ctx);
    rng.field = field.draws;
    state.currentSide = opp;
    state.yardsToGoal = field.yardsToGoal;
  }
  const afterClock = state.regSecondsRemaining > 0 ? quarterClock(state.regSecondsRemaining) : {quarter:4,seconds:0};
  const event = {
    index:state.nextPossession, phase:'REG', offense:side, defense:opp, teamPossession,
    startClock, endClock:afterClock, sampledDurationSeconds:duration.seconds, actualDurationSeconds:duration.actualSeconds,
    durationMultiplier:duration.multiplier, startYardsToGoal, nextYardsToGoal:state.yardsToGoal,
    baseRatings:{away:pickRatings(state.teams.away),home:pickRatings(state.teams.home)},
    effectiveRatings:{away:pickRatings(effective.away),home:pickRatings(effective.home)},
    controls:{...state.controls}, modifier:{manual:effective.manual,prototype:effective.prototype,comeback:effective.comeback,requested:effective.requested,combined:effective.combined,clipped:effective.clipped,appliedComeback:effective.appliedComeback,awayMultiplier:effective.awayMultiplier,homeMultiplier:effective.homeMultiplier},
    probabilityModel: probabilityModel ? compactProbabilityModel(probabilityModel) : null,
    result, conversion:conversion ? stripConversion(conversion) : null,
    points:{offense:pointsOffense,defense:pointsDefense}, scoreBefore, scoreAfter:{...state.score}, rng,
    finalAfter:state.final
  };
  state.nextPossession++;
  if (record) state.events.push(event);
  return event;
}

function otDriveProbabilities(state, side, period) {
  const base = driveProbabilities(state,side,25,5);
  const p = {...base.probabilities};
  // Punts/safeties are treated as scoreless possession ends in aggregate OT R1.
  return {...base,probabilities:p,period};
}

function advanceOvertime(state, domain='game', replicate=0, record=true) {
  demand(state.ot && !state.final,'overtime not active');
  const ctx=eventContext(state,domain,replicate), ot=state.ot, side=ot.order[ot.position], opp=otherSide(side);
  const teamPossession=state.teamPossessions[side]+1; state.teamPossessions[side]++;
  const scoreBefore={...state.score}; const rng={};
  let result,points=0,conversion=null,probabilityModel=null;
  if (ot.period <= 2) {
    probabilityModel=otDriveProbabilities(state,side,ot.period);
    const d=eventDraw({...ctx,team:state.teams[side].code,possession:teamPossession,event:`ot${ot.period}.outcome`});rng.outcome=d;
    const sampled=sampleCategorical(probabilityModel.probabilities,d);
    result=sampled;
    if(sampled==='TD'){
      points=6;conversion=conversionAfterTd(state,side,teamPossession,ctx,ot.period);rng.conversion=conversion.draw;points+=conversion.points;
    }else if(sampled==='FGA'){
      const fg=eventDraw({...ctx,team:state.teams[side].code,possession:teamPossession,event:`ot${ot.period}.fg.make`});rng.fieldGoal=fg;
      if(fg.u<PARAMS.fieldGoalMake){result='FG_MADE';points=3;}else result='FG_MISS';
    }
  } else {
    const conv=conversionAfterTd(state,side,teamPossession,ctx,3);conversion=conv;rng.conversion=conv.draw;points=conv.points;result=conv.made?'TWO_POINT_MADE':'TWO_POINT_MISS';
  }
  addOtPoints(state,side,points,ot.period);
  const event={index:state.nextPossession,phase:'OT',otPeriod:ot.period,otPosition:ot.position,offense:side,defense:opp,teamPossession,startYardsToGoal:ot.period<=2?25:3,
    baseRatings:{away:pickRatings(state.teams.away),home:pickRatings(state.teams.home)},controls:{...state.controls},
    probabilityModel:probabilityModel?compactProbabilityModel(probabilityModel):null,result,conversion:conversion?stripConversion(conversion):null,points:{offense:points,defense:0},scoreBefore,scoreAfter:{...state.score},rng,finalAfter:false};
  state.nextPossession++;
  if(ot.position===0){ot.position=1;state.currentSide=ot.order[1];}
  else{
    if(state.score.away!==state.score.home){finish(state);event.finalAfter=true;}
    else{ot.period++;ot.order=[ot.order[1],ot.order[0]];ot.position=0;ot.periodStart={away:state.score.away,home:state.score.home};state.currentSide=ot.order[0];}
  }
  if(record)state.events.push(event);
  return event;
}

export function advancePossession(state,{domain='game',replicate=0,record=true}={}){
  demand(!state.final,'game already final');
  if(state.regSecondsRemaining>0)return advanceRegulation(state,domain,replicate,record);
  if(!state.ot){
    if(state.score.away!==state.score.home){finish(state);demand(false,'game should already be final');}
    startOvertime(state,eventContext(state,domain,replicate));
  }
  return advanceOvertime(state,domain,replicate,record);
}

export function playToQuarterBoundary(state,{domain='game',replicate=0,record=true,maxPossessions=100}={}){
  demand(!state.final,'game already final');
  const startPhase=state.regSecondsRemaining>0?'REG':'OT';
  const startQuarter=startPhase==='REG'?regulationQuarter(state.regSecondsRemaining):state.ot?.period||1;
  const out=[];
  for(let i=0;i<maxPossessions&&!state.final;i++){
    out.push(advancePossession(state,{domain,replicate,record}));
    if(startPhase==='REG'){
      if(state.regSecondsRemaining===0)break;
      if(regulationQuarter(state.regSecondsRemaining)!==startQuarter)break;
    }else if(state.ot?.period!==startQuarter)break;
  }
  return out;
}

function pickRatings(t){return{overall:round6(t.overall),offense:round6(t.offense),defense:round6(t.defense)};}
function compactProbabilityModel(m){return{probabilities:Object.fromEntries(Object.entries(m.probabilities).map(([k,v])=>[k,round6(v)])),pScore:round6(m.pScore),scoreLogit:round6(m.scoreLogit),fieldLogit:round6(m.fieldLogit),weather:{precip:round6(m.weather.precip),temperature:round6(m.weather.temperature),total:round6(m.weather.total)},strength:Object.fromEntries(Object.entries(m.strength).map(([k,v])=>[k,round6(v)]))};}
function stripConversion(c){return{kind:c.kind,probability:round6(c.probability),made:c.made,points:c.points};}

export function pregamePrior(state){
  const margin=PARAMS.teamMarginPointsPerRating*(state.teams.home.overall-state.teams.away.overall)+(state.initial.neutral?0:PARAMS.homeFieldPoints);
  return{homeMargin:margin,homeField:state.initial.neutral?0:PARAMS.homeFieldPoints,label:'TEAM prior only; runtime result not forced'};
}

export function cloneGame(state){return structuredClone(state);}

export function forecast(state,samples=250){
  demand(Number.isInteger(samples)&&samples>=10&&samples<=5000,'forecast samples 10..5000');
  const originalHash=gameplayStateHash(state);let homeWins=0,awayWins=0,totalHome=0,totalAway=0;
  for(let r=1;r<=samples;r++){
    const s=cloneGame(state);
    // Forecast retains current controls. Future user edits are unknowable and not invented.
    let guard=0;
    while(!s.final && guard++<100){advancePossession(s,{domain:'forecast',replicate:r,record:false});}
    demand(s.final,'forecast path did not terminate');
    if(s.winner==='home')homeWins++;else awayWins++;
    totalHome+=s.score.home;totalAway+=s.score.away;
  }
  demand(gameplayStateHash(state)===originalHash,'forecast mutated game state');
  const p=homeWins/samples,se=Math.sqrt(Math.max(0,p*(1-p)/samples));
  return{samples,homeWinProbability:p,awayWinProbability:awayWins/samples,standardError:se,meanFinalHome:totalHome/samples,meanFinalAway:totalAway/samples,assumption:'current manual controls persist; automatic comeback recalculates each possession'};
}

function gameplayStateForHash(state){
  return{identity:state.identity,initial:state.initial,controls:state.controls,changes:state.changes,currentSide:state.currentSide,yardsToGoal:state.yardsToGoal,regSecondsRemaining:state.regSecondsRemaining,teamPossessions:state.teamPossessions,nextPossession:state.nextPossession,score:state.score,quarters:state.quarters,overtime:state.overtime,ot:state.ot,final:state.final,winner:state.winner,events:state.events};
}
export function gameplayStateHash(state){return sha256(canonicalJSON(gameplayStateForHash(state)));}

export function exportAudit(state){
  demand(state.final,'audit export requires final game');
  const core={identity:state.identity,initial:state.initial,opening:state.opening,changes:state.changes,events:state.events,score:state.score,quarters:state.quarters,overtime:state.overtime,winner:state.winner};
  return{...core,gameplayHash:sha256(canonicalJSON(core)),completedAt:new Date().toISOString()};
}

export function replayAudit(rows,audit){
  demand(audit?.identity && canonicalJSON(audit.identity)===canonicalJSON(identityBlock()),'audit identity mismatch');
  const s=createGame(rows,audit.initial);
  let ci=0,guard=0;
  while(!s.final && guard++<100){
    while(ci<audit.changes.length && audit.changes[ci].effectiveFromPossession===s.nextPossession){
      setLiveControls(s,audit.changes[ci].patch);ci++;
    }
    advancePossession(s);
  }
  demand(s.final,'replay did not terminate');
  const out=exportAudit(s);
  demand(out.gameplayHash===audit.gameplayHash,'exact replay hash mismatch');
  return s;
}

export function summary(state){
  const c=state.regSecondsRemaining>0?quarterClock(state.regSecondsRemaining):null;
  return{final:state.final,winner:state.winner,score:{...state.score},clock:c,phase:state.regSecondsRemaining>0?'REG':'OT',otPeriod:state.ot?.period||null,currentSide:state.currentSide,yardsToGoal:state.yardsToGoal,possessions:{...state.teamPossessions},pregamePrior:pregamePrior(state)};
}
