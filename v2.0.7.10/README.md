# POWER CRUNCH v2.0.7.10 — Week 13

Live path: https://rgbslb11.github.io/pwr-crunch-open/v2.0.7.10/

This release imports the approved GameCast 5.0.8 synthetic Week 13 ratings from the post Week 12 snapshot. The pinned source and its SHA-256 are in ratings-update.json. The 121 canonical codes match exactly, supplying 363 TEAM/OFF/DEF integers with no recalculation. The 13 synthetic FCS teams retain 60/60/60. There are 134 teams and 402 values. Compared with v2.0.7.9, 110 canonical teams and 308 rating values change. Ratings follow the approved source order; the matchup selectors remain alphabetical and unranked.

Power Crunch's gameplay code, parameters, layout, and audit storage remain intact. Exact Replay adds the frozen v2.0.7.9 engine and Week 9 snapshot to the existing historical routes. Production root v2.0.4 and all prior version folders are unchanged.

To run the ZIP locally, extract it and run `python -m http.server 8050` from the v2.0.7.10 folder (Windows: `py -m http.server 8050`), then open http://localhost:8050/. The hosted and localhost sites have separate browser history.

Run `node --test quarter_boundary.test.mjs week13_ratings.test.mjs` with Node 22 or newer. These 15 cases cover the ratings, selector order, engine and style parity, quarter boundaries, and exact replay across the current and five historical engines.
