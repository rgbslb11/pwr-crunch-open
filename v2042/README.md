# POWER CRUNCH v2.0.4.2 specification/test package

**Not a playable simulator or production release.** This is the first numerical specification and executable contract-test stage of the approved drive-engine rebuild.

From the repository root, with Node.js 22:

```sh
node --test v2042/contracts.test.mjs
```

No npm dependencies or API credentials are required for these tests. The baseline `week4_power_v204.js` in the parent directory is read only as a frozen provenance fixture; no old runtime is executed or loaded as fallback.

- `NUMERICAL_SPEC.md`: model family, pipeline, source review, seven calibration blockers and eighteen future integration requirements.
- `ratings.json`: 134 team rows and 402 exact operator-approved rating values, through Week 4 for Week 5.
- `manifest.json`: data identities, hashes, rank/slot order and source references.
- `configuration.json`: approved controls separated from uncalibrated null fields and legacy comparators.
- `contracts.mjs`: reference validation, A/B multipliers, comeback, effective ratings, event-addressed RNG, queued controls and replay checks. No actual drive outcome/duration engine.
- `contracts.test.mjs`: 36 executable contract tests.
- `source_receipt.json`: verified legacy source Git blob and SHA256.
- `test-results.tap`: actual local test output, not GitHub CI or an iPhone test.
- `VALIDATION.md`: scope and result summary, including all 134 data rows.

Production root and `release/v2.0.4` are unchanged. Do not merge this package as a complete gameplay release. Licensing/notice work is deferred.
