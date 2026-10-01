# POWER CRUNCH v2.0.5 — Week 6

This build updates the alphabetized QUARTERFIX1 possession simulator with the operator-supplied `team-ratings-121.csv` for synthetic Week 6. The operator identified these as the ratings to use after Week 5; the CSV itself has no date or cutoff column.

## Open the simulator

Publishing is pending approval in PR #10: https://github.com/rgbslb11/pwr-crunch-open/pull/10

The intended hosted URL after deployment is https://rgbslb11.github.io/pwr-crunch-open/v2.0.5/. It has not been published or verified live. Automatic approval review blocked merging to main because the Pages workflow deploys on that branch and the standing handoff requires separate production-promotion approval.

For the exported copy, extract the ZIP, open a terminal in this folder, and run:

```sh
python -m http.server 8050
```

Then open http://localhost:8050/. On Windows, `py -m http.server 8050` is an alternative. Serve the folder over HTTP; opening index.html directly with a file:// URL does not support its module and data fetches reliably.

## Ratings and retained behavior

- All 121 supplied team codes match the prior canonical population; all 363 TEAM/OFF/DEF values are used exactly.
- The 13 synthetic FCS profiles retain their original identities and 60/60/60 values: 134 unique teams and 402 values total.
- 120 canonical teams have at least one changed value; 334 individual values differ. Texas remains 99/99/99.
- Ratings follow supplied CSV row order. Away and Home selectors remain alphabetical and unranked.
- Existing conference assignments and team identities are retained. HAW is labeled “Hawaii” in the CSV and “Hawai’i” in the existing UI; the stable code provides the match.
- The original stylesheet, model parameters, RNG, quarter boundaries, pending-drive continuation, Prototype A/B, comeback, special teams, and OT mechanics remain unchanged.

`ratings-update.json` records every canonical team's prior/new values and deltas, the count reconciliation, source SHA-256, ratings SHA-256, and engine/data/config/RNG/audit identities. The exact supplied CSV is included under `source/`.

## History and exact replay

The existing possession-engine audit storage key is retained. New games use v2.0.5 and Week 6 ratings. Exact Replay explicitly routes old QUARTERFIX1 and original R1 audits to byte-preserved engines and the frozen Week 5 rating snapshot in `history-v2042/`. Unknown identities and missing historical data fail visibly. No history is cleared or migrated.

Re-run Same Seed uses archived teams and seed with the current controls and current Week 6 ratings. Browser history is origin-specific: a downloaded localhost copy cannot automatically access audits saved at the hosted site. Keep the hosted site for access to those existing audits.

## Scope and limitations

The production root v2.0.4, frozen release/v2.0.4 reference, and preview-v2.0.4.2 remain unchanged. This separate build does not promote the provisional mechanics to empirically calibrated production status.

Known pre-existing limitations remain: live-control changes leave the displayed forecast stale until play advances; the displayed pregame prior uses original TEAM ratings even with Even Teams enabled; simplified field transitions, pooled special teams, aggregate OT, and omitted onside/muffed-return cases remain. No full rulebook-coverage or physical iPhone/Safari claim is made.

## Repeat validation

Requires Node 22 or newer:

```sh
node --test quarter_boundary.test.mjs week6_ratings.test.mjs
```

The eight inherited boundary tests and six Week 6/replay tests are separate cases. The 100-seed boundary and mode-equivalence loops are coverage inside those cases, not additional test totals.
