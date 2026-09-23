# POWER CRUNCH v2.0.4.2 - numerical specification R1

**Status: REVIEWABLE SPECIFICATION + EXECUTABLE CONTRACT TESTS. NOT A PLAYABLE RELEASE.**

The operator authorized this specification/test stage after approving D1-D13 and confirming that the supplied ratings include games through Week 4 for Week 5 use. No production promotion is authorized by this document. Licensing/notice work is deferred.

## 1. Frozen source and data authority

Branch baseline: `release/v2.0.4`, commit `824148200ef91a22a54fea91a49db1790fe43a66`. The new work is in `v2042/`; no legacy runtime or Pages deployment file is changed. It is NOT based on the comeback preview branch.

`ratings.json` contains one row per team, ordered by the supplied canonical rank, followed by the 13 supplied FCS slots. Columns: slot, code, display name, synthetic conference, TEAM, OFF, DEF. Data version: `2026-through-W04-for-W05-operator-ratings-v1`.

Required and verified: 121 canonical teams, 13 FCS, 134 unique teams, 402 rating values. No rating renormalization, smoothing, or identity repair. The 121 triples and ranks match the frozen GitHub rating blob; its exact Git blob SHA was verified in the local test. FCS codes and slots remain ARST/122, CHAR/123, CP/124, DUQ/125, EMU/126, IDHO/127, SAC/128, SUU/129, TOL/130, ULL/131, ULM/132, WKU/133, WMU/134, all 60/60/60.

Identity residual OFF+DEF-2*TEAM is diagnostic only: 56 zero, 35 minus-one, 30 plus-one. Its origin is not established. It is not a reason to alter supplied ratings. Source cutoff comes from the operator, not legacy filenames. Dataset hashes establish integrity, not upstream statistical validity.

Conference assignments are inherited from the frozen synthetic mapping, not contemporary real-world classifications. Hawaii/Hawai'i map to HAW; Louisiana (UL Lafayette) maps to ULL. Display names do not create new identities.

## 2. Decision register (all 14 items)

| ID | Disposition carried forward |
|---|---|
| D1 | Approved: one authoritative engine interface; UI contains no alternative scoring math. |
| D2 | Supplied integers authoritative; through W4 / W5 use; future weekly ratings engine is separate. |
| D3 | Strong TEAM prior, not forced per-game margin or a predetermined winner. |
| D4 | Play Quarter retained; possession progression and pause; clock-based volume target. |
| D5 | Even Teams equalizes base matchup first, not the resulting live modifiers. |
| D6 | Preserve Prototype A and B names, functions and scale; A is current default. |
| D7 | Retain and expose natural total effects from reciprocal unit scaling. |
| D8 | Keep mild Q3/Q4 comeback, possession-boundary refresh, existing combined cap. |
| D9 | No side-label-only weather penalty at neutral sites. |
| D10 | Evidence-backed calibration; unsupported probabilities remain BLOCKED. |
| D11 | Proper college OT/conversions in scope; rules and probability estimates separately sourced. |
| D12 | Forecast with the same future engine/policies and separate forecast randomness. |
| D13 | Strict exact replay, scenario rerun, complete audit and mobile/release gates. |
| D14 | Deferred: no notice, license, ownership, visibility, or access change. |

## 3. Single pipeline and state ownership

One Engine API owns validated data/configuration, immutable committed state, queued interventions, event sampling, score/clock transitions, forecasts and audit. UI submits commands and renders returned state. No global function reassignment, script-order override or legacy fallback.

Pipeline at a possession boundary:

1. Validate release identity and required inputs; refuse unsupported states.
2. Load immutable base team records and frozen pregame conditions.
3. Apply Even Teams to simulation copies if enabled.
4. Resolve manual setting and current Q3/Q4 deficit-based comeback; expose capping.
5. Apply reciprocal TEAM/OFF/DEF transformations to the copies.
6. Form actual offense-versus-defense features; apply site, environment, strategy, clock and field-position context once.
7. Build validated outcome/duration/field-transition distributions.
8. Draw addressed event random values and commit the event/score/clock transition.
9. Forecast from the resulting state using a separate random domain.
10. Persist inputs, probabilities, keys/draws, effects and after-state; render from that record.

HFA is NOT a bonus applied to TEAM, OFF and DEF and then added again to the spread. Its approved value is 2.5 game points in the pre-environment matchup prior, zero for neutral. The drive-rate/logit mapping must be calibrated; never add 2.5 points to every possession.

## 4. TEAM strong prior with real OFF/DEF interaction

Proposed model family, **not yet fitted or approved as a numerical calibration**:

For offense i against defense j, using effective live values:

    g_ij = TEAM_i - TEAM_j
    x_ij = OFF_i - DEF_j
    u_ij = x_ij - g_ij
         = (OFF_i - TEAM_i) - (DEF_j - TEAM_j)

The unit residual prevents simply feeding the full same strength signal into two additive channels. It does not prove statistical independence; estimate and inspect collinearity. No OFF+DEF identity is imposed.

For outcome category y against reference category punt, a candidate logit is:

    eta_ij,y = baseline_y(field, clock, score state)
             + beta_y*g_ij + gamma_y*u_ij
             + site_y + environment_y + style_y + strategy_y
    p_y = softmax(eta)_y

Possible endpoints include offensive TD, FG attempt, punt, interception, fumble lost, turnover on downs, safety and end-of-half. FG/TD endpoints invoke conversion/kicking submodels; a field-goal attempt is not a made field goal. Defensive/return scoring is a separate point recipient, not offensive scoring. Categories, support and joint transition probabilities require actual evidence.

TEAM provides an aggregate matchup prior M0 = s*(TEAM_home-TEAM_away)+HFA under the reference environment. The old s=0.75 is a **legacy comparison value**, not an approved drive-model coefficient. Fit strength responsiveness and unit residual effects against chronologically valid evidence. A proposed soft regularization penalty can shrink expected neutral reference margins toward M0, with a finite, evidence-selected penalty weight. Report the penalty's effect and unit sensitivity. Do not use exact projection recentering to erase all independent unit effects.

Critically, regularization belongs to offline calibration. Runtime must never compare a late-game score to M0 and manufacture favorable drives to recover M0. A weaker team with a large late lead may be the live favorite. No final score or winner is sampled/reserved at kickoff.

The operator table is synthetic. Do not apply its Week-5 values retroactively as pregame ratings for real 2024 games or synthetic games that helped create the table. Real data can inform mechanics; calibration of the synthetic rating-to-performance bridge needs time-matched synthetic evidence or separately approved assumptions. Same-game fit is not a holdout.

## 5. Numeric controls preserved exactly

Prototype A:

    m_A(k) = exp(0.006249633846986093*k)

Prototype B:

    m_B(k) = exp(log(1.0189258)*tanh(0.5*k)/tanh(1.5))

Manual level is integer -3..3; negative favors away/Team A, positive favors home/Team B. With |level|=k, favored TEAM/OFF/DEF multiply by m; opponent values divide by m. Both are 1 at zero. The level-3 endpoints are near-equal, not bit-identical: preserve the exact constants rather than silently equalizing them.

Stored base values remain unchanged. Effective ratings are not clipped to 60..99: they may exceed 100 or fall below 60, including a reciprocally penalized FCS team. UI must distinguish base from effective values. Preserve A/B and the existing user control names; display multiplier, actual effective ratings and marginal scoring/forecast impacts alongside them.

Natural total effects are retained. Equal multiplicative changes do NOT guarantee a constant combined total, particularly for asymmetric unit profiles. Do not claim otherwise.

Comeback, recalculated before each possession from the committed score:

    Q3 k = min(2, deficit/10)
    Q4 k = min(3, deficit/7)
    Q1, Q2, tied score, OT: k = 0
    requested = manual_signed + comeback_signed
    combined = clip(requested, -3, 3)

Fractional comeback levels remain fractional. Log requested, combined, appliedComeback=combined-manual, and discarded amount. Default OFF. It is a mild stochastic nudge, not a promise that deficits disappear. A maxed manual slider can consume all headroom; state that visibly. Do not introduce series multiplication or a higher cap without approval.

## 6. Possession/clock model and controls

Regulation possession count targets a population average of about 10-13 per team; never preallocate equal counts or force each game into the range. Overtime is separate. End-of-half kneels and no-snap special-teams events need explicit counting conventions.

Use an event-driven joint model of outcome, duration and next field position, conditional on game state. Do not combine incompatible independent marginals that imply a punt touchdown or a drive ending after the half. Preserve correlations and label any abstraction.

Play Quarter repeatedly advances the same engine as Play Next Possession, yielding UI control at event/possession boundaries. Pause completes the current committed event and stops before the next possession. Queue a manual edit received during a drive for the next actual possession; do not rewrite that drive's opening modifier. If a drive crosses Q1/Q3, retain its ID and partial state across the quarter boundary; do not call that a new drive. A quarter-end UI pause and a possession boundary are different events. The exact internal segment model remains a calibration/implementation gate.

Lock away/home, seed, neutral, temperature, precipitation and Even Teams at kickoff. Abort-and-restart is a separate scenario, not a silent edit. Even Teams equalizes pairwise-average base TEAM/OFF/DEF and style before live controls, leaving canonical records untouched.

Keep pregame forecast immutable. Show new projected final score, expected remaining points and live WP separately. Completed score lines are immutable. No 35-point quarter cap and no unconditional automatic seven points for a TD.

## 7. RNG and replay contract

The prototype reference RNG uses SHA-256 keyed by version, uint32 seed, domain, stable team ID, team-possession ordinal, event type, sub-index and forecast replicate. First 53 bits give u in [0,1). This is a **new RNG version**, not a claim to reproduce legacy LCG finals. Quarter/time is not part of a regulation possession's random address, so changing clock placement does not renumber all later draws; OT event IDs include their OT round/series context. Conditional event labels and sub-indexes must be deterministic.

Forecast and game domains are disjoint. Refreshing a graph or increasing forecast sample count cannot change the actual game. Extra conditional draws cannot shift an unrelated later addressed event. This improves coupling for A/B comparisons, but divergent game paths are not guaranteed to contain identical events.

Exact Replay restores every pregame input plus chronological setting events and demands matching engine/data/config/RNG/audit-schema identities. Checksums validate canonical deterministic content; wall time, display timestamps and new archive IDs are excluded from equality. Replaying a replay must preserve the complete applied control history, not only the first event. Missing legacy inputs cause BLOCKED for exact reproduction, while saved-result review remains available.

Re-run Same Seed takes an explicit new settings snapshot and does NOT overwrite it from a saved archive. It creates a new scenario linked to its parent. No promise that every change yields a different final; require measurable probability/distribution effects instead.

## 8. Forecast contract

Compute conditional win probability by simulation or exact state enumeration from the SAME event kernel and automatic policy, including clock, possession, field position, conversion/OT rules and future deficit-based comeback recalculation. Current manual settings are assumed to persist unless changed. A current comeback boost cannot simply be held constant for all remaining possessions while calling WP exact.

Monte Carlo output reports sample count and uncertainty. Forecast RNG must be independent of actual-game sampling. Forecasting does not reveal the already-known seed's deterministic future as a 0/1 answer. The mobile detailed-forecast target is about two seconds, subject to device testing, not a measured guarantee.

OT winner logic and conversion rates must be included in WP; no unsupported fair 0.5 split substituted for team-specific OT probabilities.

## 9. Rulebook and empirical source ledger

- Operator controls and dataset: supplied in this conversation and pinned production blobs in manifest.json. No upstream workbook method is asserted.
- Earlier mechanics research: `compass_artifact_wf-5da82a39-fad4-59d1-ac48-c24226884739_text_markdown (1).md`, recovered via Files. It explicitly marks duration and several current-season splits as unestablished. Prior approval of a V1 assumption does not establish empirical calibration for this new engine.
- Brian Fremeau, Offensive Drives: https://bcftoys.squarespace.com/drives . Verified primary benchmark: 299,560 non-garbage regulation FBS-vs-FBS drives over 2007-2024; 2.16 points/drive. The page also provides a 2024 subset (16,764 drives; 2.26 points/drive). These exclude OT, FBS-FCS and garbage time and are NOT the full-game target population. Rounded outcome frequencies are not full joint distributions.
- 2024 per-yard drive table located: https://bcftoys.squarespace.com/2024-drives . Potential field-position benchmark; not imported as fitted production probabilities.
- CFBD official documentation: https://apinext.collegefootballdata.com/getting-started and https://apinext.collegefootballdata.com/authentication . Data acquisition requires authorized access/exports; never put a provider key in public JS or source control. No authenticated drive export was obtained in this stage. A connector directory search found no CollegeFootballData plugin.
- NCAA primary change notice: https://www.ncaa.org/media-center-changes-to-injury-timeouts-approved-in-football/ . Effective 2025-26, OT3 onward has one timeout per team for the remainder of the game, not one new timeout every period. This corrects a legacy research statement. Full applicable 2026 rulebook exceptions still require rule-by-rule verification; no claim of complete NCAA certification here.

Required rule test scope: regulation/OT accounting, series order, early termination exceptions, conversion choices, OT2 mandatory two-point treatment, OT3+ try series, defensive return scenarios, and timeout carryover. In particular, do not import a separate GameCast sandbox ruling about defensive returns as POWER CRUNCH authority.

## 10. Data intake and fitting work package

Acquire raw games, drives and needed plays for two chronological historical cohorts, retaining source snapshots and licensing/access metadata without publishing protected source data. Proposed first split: 2024 development, 2025 holdout, with tuning nested chronologically inside development. Alter the split only through the manifest; do not silently blend train and holdout.

Minimum fields: source ID/hash; real/synthetic domain; season/week/game ID; team IDs and subdivision at game date; neutral/home identity; drive ID; starting/ending period and clock; start/end yards to goal; offensive/defensive points; conversion/return points; outcome; plays; next possession owner/field position; and observed weather where available. Separate accepted synthetic results and test runs. Missing fields are null with reasons, never inferred from a score alone.

Preserve excluded, incomplete and disputed rows in an exception table with exact counts. Reconcile source score sums, drive IDs, negative/impossible durations, duplicate events, OT, no-snap possession changes and kneel/end-half treatment. Do not assume every missing field position is own-25.

Seven calibration objects remain BLOCKED/null in configuration.json:

| ID | Object | Evidence needed |
|---|---|---|
| B01 | overall_prior_bridge | Time-matched approved synthetic ratings/results; rating sensitivity and calibration comparison. |
| B02 | unit_logit_coefficients | Opponent-aware drive outcomes and unit ratings without look-ahead; identifiability check. |
| B03 | prior_penalty_strength | Nested chronological model comparison; no arbitrary 70/30 blending. |
| B04 | drive_outcome_baselines | Eligible raw drive observations stratified by field/clock/state; probability support. |
| B05 | drive_duration_field_transition_joint_model | Actual linked timestamps, field transitions, boundary/strategy events. |
| B06 | special_teams_and_conversion_probabilities | Kicks/tries/returns by relevant state and distance, plus rare-event uncertainty. |
| B07 | weather_and_strategy_coefficients | Observed conditions and possession-state outcomes; no side-only neutral penalty. |

No final-score simulation entry point may run until these are calibrated/approved or explicit governed assumptions are approved. Test fixture values do not supply that authority. The old 54 total, 4.4 sigma and fixed quarter weights are retained solely as legacy comparators.

## 11. Future integration tests (not passed in this stage)

| ID | Required assertion | Current status |
|---|---|---|
| I01 | Unique drives, correct volume denominator and quarter-crossing continuity | NOT IMPLEMENTED |
| I02 | Clock, half termination, late-game strategy and no negative time | NOT IMPLEMENTED |
| I03 | Punt, turnover, kickoff and field-position transitions | NOT IMPLEMENTED |
| I04 | Safety credited to defense with correct next possession | NOT IMPLEMENTED |
| I05 | FG attempts/makes/distance and no unsupported default probability | NOT IMPLEMENTED |
| I06 | TD, PAT/two-point and defensive-return score accounting | NOT IMPLEMENTED |
| I07 | OT series, early finish and defensive-score exceptions | NOT IMPLEMENTED |
| I08 | OT3+ timeout budget and try rules | NOT IMPLEMENTED |
| I09 | Final equals four regulation quarters plus separately stored OT | NOT IMPLEMENTED |
| I10 | Strong-prior responsiveness and independent OFF-vs-DEF sensitivity | NOT CALIBRATED |
| I11 | Paired-seed distribution effects; not unique-final-for-every-toggle | NOT IMPLEMENTED |
| I12 | Outcome, total, margin, duration and possession holdout fit | NOT CALIBRATED |
| I13 | Forecast future comeback/OT policies and estimated uncertainty | NOT IMPLEMENTED |
| I14 | End-to-end replay and replay-of-replay preserve full ledger | NOT IMPLEMENTED |
| I15 | Same-seed scenario uses new controls, not archived overwrite | NOT IMPLEMENTED |
| I16 | Quarter/drive/pause equivalence and next-possession application | NOT IMPLEMENTED |
| I17 | iPhone cache update, reload/resume, quota/export and asset consistency | NOT DEVICE-TESTED |
| I18 | Regression fixture seed 3119422330 over stated scenario grid | NOT RE-RUN IN NEW DRIVE ENGINE |

The 36 executed tests exercise the separate reference contracts, NOT these full integration behaviors. Release gates remain closed.

## 12. Delivery and release constraints

Use one manifest for engine/data/config/RNG/audit identity; UI and audit read it. Store full base and effective ratings, score/clock/possession state, interventions (including discarded comeback), probability vector, RNG address/draw, transition and conditional forecast at each committed event. Archive remains append-only, with capacity warnings and explicit export/deletion rather than silent loss.

A future preview must use isolated storage/cache and pinned assets, not mutable ../production scripts. Activation of a new engine during an active game is prohibited; either retain its current complete version or require explicit end-and-restart. Production/preview publish sets are deliberate, not repository root by default.

No active UI, service worker, production branch, release/v2.0.4, existing preview, notice or license is modified by this package. A separate operator acceptance follows numerical validation, integration tests and mobile testing. Do not create an acceptance record that claims this specification package is already a released simulator.
