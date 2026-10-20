# POWER CRUNCH v2.0.7.9 — Week 9

Live path: https://rgbslb11.github.io/pwr-crunch-open/v2.0.7.9/

The approved GameCast W09 workbook supplies the ratings only. Its Ranked Ratings sheet contains 121 canonical team codes and 363 integer TEAM/OFF/DEF values. All values are imported exactly by code; no rounding, blending, normalization, or GameCast engine mechanics are introduced. The 13 synthetic FCS profiles remain 60/60/60: 134 unique teams and 402 values total. All 121 canonical teams change versus v2.0.6, with 346 changed individual values.

The Ratings view follows the workbook's ordinal rank; the Game selectors remain alphabetical and unranked. Existing team names and conferences remain intact, including Hawai’i (HAW). The exact extracted rating values are preserved in source/approved-ratings.json. The original workbook remains private; its SHA-256 identifies the source used. ratings-update.json contains all 121 prior/new triples and deltas, identities, counts, and SHA-256 hashes.

The engine changes only its version comment and engine/data identities. Original styles, parameters, controls, RNG, quarter stops, pending-drive continuation, and audit storage remain unchanged. Exact Replay explicitly selects the frozen v2.0.6 engine/ratings in history-v206/, v2.0.5 in history-v205/, and the two v2.0.4.2 engines in history-v2042/. Unknown identities and missing historical data fail visibly. Re-run Same Seed uses the archived teams/seed with the current explicit control snapshot and current ratings. No browser history is cleared.

Production v2.0.4, v2.0.5, v2.0.6, and all earlier folders stay untouched. Known prototype limitations remain: stale forecast after live-control edits until play advances; original TEAM values in the Even Teams displayed prior; simplified field transitions and special teams; aggregate overtime; omitted onside/muffed-return cases. No empirical calibration or full rulebook claim is made.

To run the ZIP locally, extract it, open a terminal in the v2.0.7.9 folder, and run `python -m http.server 8050` (Windows: `py -m http.server 8050`), then visit http://localhost:8050/. Use HTTP rather than file://. Localhost and the hosted site have separate browser history origins.

Validation: `node --test quarter_boundary.test.mjs week9_ratings.test.mjs` (Node 22+) runs 15 cases, including seeded boundary and mode-equivalence coverage. `python3 validate_workbook.py /path/to/approved-source.xlsx` independently reads all workbook triples and compares them to the deployed ratings. The manifest covers every package file except itself.
