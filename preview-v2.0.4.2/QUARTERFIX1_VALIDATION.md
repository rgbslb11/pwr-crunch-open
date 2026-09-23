# v2.0.4.2 preview - QUARTERFIX1

Scope: repair Play Quarter boundary overshoot, restore the original regulation scoreboard with future-period dashes, and remove rank prefixes from both matchup selectors. No ratings, probability parameters, original palette, production root or release/v2.0.4 changes.

Cause: both the UI loop and engine quarter helper advanced an entire possession before checking the period. A possession could finish in Q2 and add Q2 points during Play Quarter 1. The scoreboard also rendered zero-filled arrays as if every period had started.

Repair: a drive spanning Q1/Q2 or Q3/Q4 now keeps its identity, sampled duration, starting probabilities and controls while time stops exactly at the boundary. Its outcome and points are not sampled or committed until it finishes after continuation. Mid-drive control edits apply to the following possession. A separate periodsStarted array governs display; the next quarter's 15:00 clock does not mark that quarter played. Halftime terminates a pending drive under the existing model. Play Quarter 4 never executes an OT possession automatically.

Scoreboard: original Team / Q1 / Q2 / Q3 / Q4 / F grid, typography, dividers and colors. Cells stay '-' until that quarter actually starts. OT column appears only after overtime starts. Original style.css blob remains b01a15c613c3f6ccff5de9dd6d3c8c4f1a1768a1; only the extra scoreboard layout override changes.

History: new engine identity PC-MOBILE-v2.0.4.2-R1-QUARTERFIX1. The old plain engine is retained as engine_r1_legacy.mjs solely for exact replay of already-saved R1 prototype audits. New gameplay never falls back to it. Storage is not cleared.

Actual local checks:
- 44 existing R1 mechanics tests passed, with only the engine-ID expectation updated.
- 18 targeted regression tests passed, including 100 seeds x four exact regulation stops, preserved spanning-drive state, control timing, forecast isolation, exact replay and replay-of-replay.
- All 56 configurations of seed 3119422330 (2 prototypes x 2 site states x 2 comeback states x 7 slider settings) have identical completed events in possession mode and quarter mode when controls are unchanged.
- A separately runnable eight-test subset is committed as quarter_boundary.test.mjs; all eight passed.
- Offline Chromium UI runs at 390px and 1000px passed: 134 options per selector, no rank prefixes, original gold button color, all eight pregame quarter cells '-', exact Q1/Q2/Q3 stops, full-game completion, replay, same-seed rerun and pause callback.
- Browser snapshot after Q1 for TEX at UGA, seed 3119422330, default controls: TEX 7 / - / - / -; UGA 0 / - / - / -. Status End of Q1 (0:00); drive #5 pending.

Test limits: browser runs used exact local assets through an offline harness and in-memory fetch/storage. They are not a physical iPhone/Safari test or a live Pages execution test. No new empirical-calibration claim. Existing aggregate-drive/OT simplifications remain.

Run the committed tests with Node 22:

    node --test preview-v2.0.4.2/quarter_boundary.test.mjs

Source baseline: 682dd392bd4da5001b6c5ef06ed3353b45a2172e. Changes are restricted to preview-v2.0.4.2/. Production promotion remains a separate operator decision.
