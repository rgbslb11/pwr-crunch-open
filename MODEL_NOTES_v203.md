# POWER CRUNCH Mobile v2.0.3 — Post-Week 3 Ratings

- Engine: `PC-MOBILE-v2.0.3`
- Data: `2026-postW3-gamecast-power-v1.1-fcs60`
- Rating authority: `SYNTHCAST_GAMECAST_W4_TEAM_OFF_DEF_POWER_121_v1.1.xlsx`
- Source SHA-256: `a76a6d7d7032c120f1f47ac8c49021bf726164ba734bfbffb92f230d42896134`
- Canonical population: 121 teams
- Synthetic FCS: 13 teams, all fixed at `60 / 60 / 60` for TEAM / OFF / DEF
- Simulation population: 134
- Rating scale: direct 60–99 deployment values; no re-normalization
- Margin bridge: 0.75 game points per TEAM rating point
- HFA: 2.2 game points; neutral HFA 0
- OFF/DEF: centered cross-match signal changes expected total only and cannot independently rewrite the TEAM-based expected margin
- Tempo and environmental controls retained as symmetric scoring/variance layers
- Seeded discrete-football scoring and exact remaining-score win probability retained from the accepted v2.0.2.1/v2.0.2.2 lineage

Validation: PASS. 121 unique canonical ratings; no source overlap with the 13 FCS codes; all canonical ratings within 60–99; all canonical OFF+DEF identities equal 2×TEAM.
