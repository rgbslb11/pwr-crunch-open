# POWER CRUNCH v2.0.6 — Week 7

The approved Week 7 CSV supplies the exact exported TEAM/OFF/DEF triples for all 121 canonical teams. Its `effective_week` is `2026-W07`; it does not state a games-through cutoff. The code matched all 121 v2.0.5 codes and prior triples exactly. HAW's source display name is “Hawaii”; the established simulator name “Hawai’i” remains.

Hosted build: https://rgbslb11.github.io/pwr-crunch-open/v2.0.6/

For an offline export, extract the ZIP and serve this folder with `python -m http.server 8050` (or `py -m http.server 8050` on Windows), then open http://localhost:8050/. Direct `file://` access does not reliably load modules and ratings.

## Ratings

- 121 canonical teams × 3 values = 363 approved values; 13 synthetic FCS × 3 = 39 fixed values; 134 teams and 402 values overall.
- The 13 FCS names, classifications, and 60/60/60 profiles remain unchanged. Existing conferences and team identities are retained.
- The Ratings view follows the CSV rank order. Both Game selectors sort by team name and have no rank prefixes.
- `ratings-update.json` records all 121 previous/new triples, deltas, counts, identities, and SHA-256 hashes. The supplied bytes are retained at `source/W7_APPROVED_RATINGS_121.csv`.

## Gameplay and history

The engine differs from v2.0.5 only in the version comment and engine/data identity. The provisional parameters, original production stylesheet, quarter boundary and unfinished-drive repairs, controls, RNG, and audit schema remain intact. New games use Week 7 ratings. Exact Replay routes v2.0.5 to frozen engine/ratings in `history-v205/`, and both older R1 engines to `history-v2042/`. Unknown identities and missing data fail visibly. The existing browser history key is retained; history is never automatically cleared.

Re-run Same Seed uses the archived teams and seed with a new explicit controls snapshot and the current Week 7 ratings. Localhost and the hosted site have distinct browser storage origins.

The v2.0.4 production root, frozen `release/v2.0.4`, and prior version directories stay untouched. Existing limitations remain: live control changes can leave the displayed forecast stale until play advances; the displayed pregame prior uses original TEAM values under Even Teams; field transitions and special teams are simplified; OT is aggregate; onside and muffed returns are omitted. This prototype does not claim empirical calibration or full rulebook coverage.

Run `node --test quarter_boundary.test.mjs week7_ratings.test.mjs` with Node 22 or newer. The eight inherited boundary cases and seven Week 7/replay cases are 15 test cases total; seeded loops are coverage inside cases.
