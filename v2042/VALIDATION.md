# v2.0.4.2 Stage 1 validation

**Mechanical reference-contract tests: 36 passed, 0 failed.**

**No playable drive engine, empirical calibration pass, GitHub CI run, iPhone test or production promotion is claimed.**

Test environment: Node.js v22.16.0; command `node --test --test-reporter=tap contracts.test.mjs`.

| Check | Expected | Actual |
|---|---:|---:|
| Canonical teams | 121 | 121 |
| Synthetic FCS | 13 | 13 |
| Unique total | 134 | 134 |
| Canonical rating fields | 363 | 363 |
| FCS rating fields | 39 | 39 |
| All rating fields | 402 | 402 |
| Rating-field source mismatches | 0 | 0 |
| Identity residual 0 | diagnostic | 56 |
| Identity residual -1 | diagnostic | 35 |
| Identity residual +1 | diagnostic | 30 |

Ratings exact-file SHA256: `5598fbc95de623f282aea8c06a206a67acc351f98669c3d01409e75cf684c3e3`.

Source validation: reconstructed the exact fetched frozen Git blob, verified its Git SHA1, then compared all canonical triples and ranks. This does not verify the statistical method behind the supplied ratings.

## Executed tests

| # | Test | Result |
|---|---|---|
| 1 | C01 population: 121 canonical + 13 FCS = 134 / 402 values | PASS |
| 2 | C02 exact match of all 363 canonical rating fields and 121 ranks to frozen Git blob | PASS |
| 3 | C03 all 13 FCS individually match 60/60/60 and operator slots | PASS |
| 4 | C04 exact-file SHA256 and rating-tuple SHA256 match manifest | PASS |
| 5 | C05 identity remains diagnostic: 56 exact / 35 minus-one / 30 plus-one | PASS |
| 6 | C06 duplicate team code rejected | PASS |
| 7 | C07 missing row rejected | PASS |
| 8 | C08 invalid base rating, zero and NaN rejected | PASS |
| 9 | C09 incorrect FCS value rejected | PASS |
| 10 | C10 supplied rank and FCS slot order must be preserved | PASS |
| 11 | C11 Prototype A retains frozen three multiplier values | PASS |
| 12 | C12 Prototype B retains frozen three multiplier values | PASS |
| 13 | C13 reciprocal product and sign-reversal symmetry for both prototypes/all six nonzero settings | PASS |
| 14 | C14 Even Teams equalizes base units and style BEFORE manual influence | PASS |
| 15 | C15 temporary elite effective ratings may exceed 100 | PASS |
| 16 | C16 reciprocal penalty can take effective FCS below 60 without changing base | PASS |
| 17 | C17 effective-rating calculations never mutate authoritative teams or controls | PASS |
| 18 | C18 both prototypes at zero produce identical base values | PASS |
| 19 | C19 comeback is dormant Q1/Q2/OT and when tied | PASS |
| 20 | C20 Q3 fourteen-point deficit is fractional 1.4, not rounded | PASS |
| 21 | C21 Q4 fourteen-point deficit gives 2; twenty-one gives 3 | PASS |
| 22 | C22 comeback decays from updated possession-boundary score | PASS |
| 23 | C23 maxed manual slider reports discarded additional assistance | PASS |
| 24 | C24 opposite manual and comeback influences combine in signed levels | PASS |
| 25 | C25 site contract returns HFA 2.5 or exactly zero on neutral | PASS |
| 26 | C26 drive features retain actual opposing DEF without hidden overall double-count | PASS |
| 27 | C27 stable seed event-key golden vector (NOT a legacy final-score assertion) | PASS |
| 28 | C28 forecast calls do not consume or alter game randomness | PASS |
| 29 | C29 extra unrelated events cannot shift a later addressed event | PASS |
| 30 | C30 RNG rejects invalid keys and preserves uint32 endpoints | PASS |
| 31 | C31 settings changes have chronological sequence and next-possession boundary | PASS |
| 32 | C32 locked pregame changes and unknown controls rejected | PASS |
| 33 | C33 finalized game refuses intervention | PASS |
| 34 | C34 exact replay requires all archived settings and matching five-part identity | PASS |
| 35 | C35 changed archive content is not an exact replay | PASS |
| 36 | C36 missing empirical parameters explicitly block a playable simulation | PASS |

## Full rating audit - all 134 teams separately

Values are unchanged; residual is OFF+DEF-2*TEAM, not a correction request.

| Slot | ID | Team | Synthetic conference | TEAM | OFF | DEF | Residual |
|---:|---|---|---|---:|---:|---:|---:|
| 1 | TEX | Texas | SEC | 99 | 99 | 99 | +0 |
| 2 | UGA | Georgia | SEC | 98 | 99 | 97 | +0 |
| 3 | MIA | Miami | ACC | 98 | 98 | 98 | +0 |
| 4 | IU | Indiana | Big Ten | 97 | 94 | 99 | -1 |
| 5 | TTU | Texas Tech | Big 12 | 95 | 96 | 95 | +1 |
| 6 | MISS | Ole Miss | SEC | 95 | 99 | 91 | +0 |
| 7 | ALA | Alabama | SEC | 94 | 99 | 90 | +1 |
| 8 | OSU | Ohio State | Big Ten | 94 | 96 | 92 | +0 |
| 9 | USC | USC | Big Ten | 93 | 99 | 88 | +1 |
| 10 | ORE | Oregon | Big Ten | 93 | 95 | 92 | +1 |
| 11 | ND | Notre Dame | Independent | 93 | 95 | 91 | +0 |
| 12 | MICH | Michigan | Big Ten | 93 | 90 | 97 | +1 |
| 13 | BYU | BYU | Big 12 | 92 | 89 | 95 | +0 |
| 14 | TENN | Tennessee | SEC | 91 | 92 | 90 | +0 |
| 15 | TA&M | Texas A&M | SEC | 91 | 95 | 87 | +0 |
| 16 | IOWA | Iowa | Big Ten | 90 | 87 | 94 | +1 |
| 17 | OU | Oklahoma | SEC | 90 | 84 | 96 | +0 |
| 18 | UTAH | Utah | Big 12 | 89 | 90 | 87 | -1 |
| 19 | VAN | Vanderbilt | SEC | 88 | 96 | 80 | +0 |
| 20 | WASH | Washington | Big Ten | 88 | 87 | 89 | +0 |
| 21 | UVA | Virginia | ACC | 87 | 88 | 85 | -1 |
| 22 | ILL | Illinois | Big Ten | 85 | 87 | 84 | +1 |
| 23 | ARIZ | Arizona | Big 12 | 83 | 78 | 88 | +0 |
| 24 | SMU | SMU | ACC | 83 | 75 | 91 | +0 |
| 25 | LSU | LSU | SEC | 83 | 85 | 80 | -1 |
| 26 | HOU | Houston | Big 12 | 82 | 84 | 81 | +1 |
| 27 | MIZ | Missouri | SEC | 82 | 81 | 84 | +1 |
| 28 | LEH | Lehigh | ECL | 82 | 82 | 81 | -1 |
| 29 | TCU | TCU | Big 12 | 81 | 76 | 85 | -1 |
| 30 | PITT | Pittsburgh | ACC | 81 | 76 | 85 | -1 |
| 31 | LOU | Louisville | ACC | 81 | 82 | 80 | +0 |
| 32 | GT | Georgia Tech | ACC | 81 | 75 | 86 | -1 |
| 33 | DUKE | Duke | ACC | 80 | 75 | 86 | +1 |
| 34 | VT | Virginia Tech | ACC | 80 | 82 | 77 | -1 |
| 35 | WAKE | Wake Forest | ACC | 79 | 80 | 78 | +0 |
| 36 | PSU | Penn State | Big Ten | 79 | 79 | 78 | -1 |
| 37 | UCLA | UCLA | Big Ten | 78 | 86 | 71 | +1 |
| 38 | FLA | Florida | SEC | 78 | 83 | 73 | +0 |
| 39 | OKST | Oklahoma State | Big 12 | 78 | 81 | 75 | +0 |
| 40 | NEB | Nebraska | Big Ten | 78 | 83 | 73 | +0 |
| 41 | CIN | Cincinnati | Big 12 | 78 | 74 | 82 | +0 |
| 42 | MSST | Mississippi State | SEC | 78 | 77 | 78 | -1 |
| 43 | BOISE | Boise State | Pac-12 | 77 | 84 | 71 | +1 |
| 44 | NCSU | NC State | ACC | 77 | 77 | 77 | +0 |
| 45 | ARMY | Army | American | 77 | 78 | 75 | -1 |
| 46 | UK | Kentucky | SEC | 77 | 82 | 71 | -1 |
| 47 | TLN | Tulane | American | 76 | 75 | 77 | +0 |
| 48 | CAL | California | ACC | 76 | 77 | 76 | +1 |
| 49 | NAVY | Navy | American | 76 | 71 | 81 | +0 |
| 50 | UNC | North Carolina | ACC | 76 | 69 | 82 | -1 |
| 51 | MEM | Memphis | American | 76 | 81 | 70 | -1 |
| 52 | ASU | Arizona State | Big 12 | 76 | 77 | 74 | -1 |
| 53 | USF | South Florida | American | 75 | 69 | 82 | +1 |
| 54 | MINN | Minnesota | Big Ten | 75 | 77 | 73 | +0 |
| 55 | CLEM | Clemson | ACC | 75 | 80 | 70 | +0 |
| 56 | MD | Maryland | Big Ten | 75 | 75 | 75 | +0 |
| 57 | FSU | Florida State | ACC | 75 | 76 | 73 | -1 |
| 58 | AUB | Auburn | SEC | 75 | 74 | 75 | -1 |
| 59 | TLSA | Tulsa | American | 74 | 67 | 82 | +1 |
| 60 | UCF | UCF | Big 12 | 74 | 69 | 79 | +0 |
| 61 | UConn | UConn | Independent | 74 | 77 | 71 | +0 |
| 62 | KSU | Kansas State | Big 12 | 74 | 72 | 76 | +0 |
| 63 | KU | Kansas | Big 12 | 73 | 69 | 77 | +0 |
| 64 | BAY | Baylor | Big 12 | 73 | 69 | 76 | -1 |
| 65 | UNT | North Texas | American | 72 | 76 | 69 | +1 |
| 66 | WIS | Wisconsin | Big Ten | 72 | 71 | 74 | +1 |
| 67 | ARK | Arkansas | SEC | 72 | 68 | 77 | +1 |
| 68 | NU | Northwestern | Big Ten | 72 | 71 | 73 | +0 |
| 69 | SYR | Syracuse | ACC | 72 | 72 | 71 | -1 |
| 70 | MSU | Michigan State | Big Ten | 72 | 74 | 70 | +0 |
| 71 | HC | Holy Cross | ECL | 72 | 71 | 72 | -1 |
| 72 | WVU | West Virginia | Big 12 | 71 | 73 | 70 | +1 |
| 73 | COLO | Colorado | Big 12 | 71 | 68 | 75 | +1 |
| 74 | NDSU | North Dakota State | Mountain West | 71 | 79 | 63 | +0 |
| 75 | STAN | Stanford | ACC | 71 | 75 | 66 | -1 |
| 76 | ODU | Old Dominion | Atlantic-8 | 71 | 64 | 77 | -1 |
| 77 | SC | South Carolina | SEC | 71 | 70 | 71 | -1 |
| 78 | FAU | Florida Atlantic | American | 71 | 70 | 71 | -1 |
| 79 | FRES | Fresno State | Pac-12 | 70 | 62 | 78 | +0 |
| 80 | SDSU | San Diego State | Pac-12 | 70 | 62 | 78 | +0 |
| 81 | ECU | East Carolina | American | 70 | 66 | 74 | +0 |
| 82 | NM | New Mexico | Mountain West | 70 | 67 | 73 | +0 |
| 83 | TEM | Temple | American | 69 | 65 | 74 | +1 |
| 84 | PUR | Purdue | Big Ten | 69 | 70 | 68 | +0 |
| 85 | ISU | Iowa State | Big 12 | 69 | 66 | 71 | -1 |
| 86 | MRSH | Marshall | Atlantic-8 | 69 | 66 | 71 | -1 |
| 87 | PRIN | Princeton | ECL | 69 | 71 | 66 | -1 |
| 88 | TXST | Texas State | Pac-12 | 68 | 75 | 62 | +1 |
| 89 | BC | Boston College | ACC | 68 | 64 | 72 | +0 |
| 90 | UTSA | UTSA | American | 68 | 71 | 65 | +0 |
| 91 | DEL | Delaware | Atlantic-8 | 68 | 62 | 74 | +0 |
| 92 | WSU | Washington State | Pac-12 | 68 | 65 | 70 | -1 |
| 93 | NIU | Northern Illinois | Mountain West | 67 | 67 | 68 | +1 |
| 94 | USU | Utah State | Pac-12 | 67 | 66 | 69 | +1 |
| 95 | COLG | Colgate | ECL | 67 | 71 | 64 | +1 |
| 96 | GAST | Georgia State | Atlantic-8 | 67 | 73 | 62 | +1 |
| 97 | CSU | Colorado State | Pac-12 | 66 | 70 | 63 | +1 |
| 98 | RUTG | Rutgers | Big Ten | 66 | 69 | 63 | +0 |
| 99 | PENN | Penn | ECL | 66 | 72 | 60 | +0 |
| 100 | ORST | Oregon State | Pac-12 | 66 | 64 | 68 | +0 |
| 101 | COR | Cornell | ECL | 66 | 66 | 66 | +0 |
| 102 | BUFF | Buffalo | Atlantic-8 | 65 | 64 | 66 | +0 |
| 103 | UNLV | UNLV | Mountain West | 65 | 61 | 69 | +0 |
| 104 | SJSU | San Jose State | Mountain West | 64 | 63 | 65 | +0 |
| 105 | AF | Air Force | Mountain West | 64 | 64 | 64 | +0 |
| 106 | NEV | Nevada | Mountain West | 64 | 64 | 64 | +0 |
| 107 | TROY | Troy | Atlantic-8 | 64 | 60 | 67 | -1 |
| 108 | HAW | Hawai’i | Mountain West | 63 | 60 | 66 | +0 |
| 109 | USM | Southern Miss | American | 63 | 66 | 60 | +0 |
| 110 | UAB | UAB | American | 63 | 65 | 60 | -1 |
| 111 | LT | Louisiana Tech | American | 63 | 65 | 60 | -1 |
| 112 | RICE | Rice | American | 62 | 63 | 62 | +1 |
| 113 | HARV | Harvard | ECL | 62 | 64 | 60 | +0 |
| 114 | FIU | Florida International | Atlantic-8 | 62 | 60 | 63 | -1 |
| 115 | NMSU | New Mexico State | American | 62 | 60 | 63 | -1 |
| 116 | WYO | Wyoming | Mountain West | 62 | 62 | 61 | -1 |
| 117 | GASO | Georgia Southern | Atlantic-8 | 61 | 61 | 62 | +1 |
| 118 | MTSU | Middle Tennessee | Atlantic-8 | 61 | 60 | 62 | +0 |
| 119 | UTEP | UTEP | Mountain West | 60 | 61 | 60 | +1 |
| 120 | CCU | Coastal Carolina | Atlantic-8 | 60 | 60 | 60 | +0 |
| 121 | YALE | Yale | ECL | 60 | 60 | 60 | +0 |
| 122 | ARST | Arkansas State | FCS | 60 | 60 | 60 | +0 |
| 123 | CHAR | Charlotte | FCS | 60 | 60 | 60 | +0 |
| 124 | CP | Cal Poly | FCS | 60 | 60 | 60 | +0 |
| 125 | DUQ | Duquesne | FCS | 60 | 60 | 60 | +0 |
| 126 | EMU | Eastern Michigan | FCS | 60 | 60 | 60 | +0 |
| 127 | IDHO | Idaho | FCS | 60 | 60 | 60 | +0 |
| 128 | SAC | Sacramento State | FCS | 60 | 60 | 60 | +0 |
| 129 | SUU | Southern Utah | FCS | 60 | 60 | 60 | +0 |
| 130 | TOL | Toledo | FCS | 60 | 60 | 60 | +0 |
| 131 | ULL | Louisiana (UL Lafayette) | FCS | 60 | 60 | 60 | +0 |
| 132 | ULM | Louisiana-Monroe | FCS | 60 | 60 | 60 | +0 |
| 133 | WKU | Western Kentucky | FCS | 60 | 60 | 60 | +0 |
| 134 | WMU | Western Michigan | FCS | 60 | 60 | 60 | +0 |

## Remaining release gates

Seven calibration objects remain BLOCKED/null. Eighteen integration requirements are explicitly NOT IMPLEMENTED, NOT CALIBRATED, or NOT DEVICE-TESTED in NUMERICAL_SPEC.md. Passing rejection tests for missing inputs is not passing calibration.

The new RNG golden vector for seed 3119422330 tests an addressed random draw, not a claimed re-creation of TEX 9 - UGA 39. Legacy archives remain tied to legacy mechanics.
