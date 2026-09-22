# CEROP Risk Console

A console for CEROP (Cross-Border Enterprise Risk & Operations Predictor), a two-layer machine-learning project that asks two separate questions about a supplier: *is this company heading for bankruptcy?* and *will this order arrive late?*

Every number in the console is a documented result from one of three places: the team's executed notebooks, one results file those notebooks saved, or the team's written report, "[AIT506] Group 4 - CEROP" (Weeks 2–6). Each figure carries a source chip that links to its row in a lineage table giving the file, cell or page, and what was read there.

**Live:** https://divyagopalnadar.github.io/cerop-console/

![CEROP Risk Console overview, with the financial and operations layers side by side](docs/screenshot.png)

## Views

- **Overview.** The deployed result for each layer, the Week 6 deployment decision, why the two layers are never merged into one score, and the three datasets.
- **Data & EDA.** Late-delivery rate by shipping mode, the shipping-delay distribution, the top correlates with bankruptcy, the 24 sentinel-valued financial ratios, the GSCPI assumption test (not supported), the DBSCAN anomaly component, and the cleaning and leakage decisions.
- **Financial layer.** The Week 5 model comparison and the equal-recall result. For Week 6: the partition, search, parameters, the 11-row test table, three documented confusion matrices, why tuning did not transfer, and the bootstrap check.
- **Operations layer.** A threshold explorer over the team's 81-step validation sweep, the sealed-test comparison of baseline, tuned, and tuned plus calibrated, a confusion-matrix viewer, the Order Status leakage fix, feature importances and the tuning setup.
- **Timeline.** What each week, 1 through 7, decided.
- **Methodology.** The shared protocol, a lineage table for all 55 sources, and the team with each member's charter responsibility.

Light and dark themes with a system default and no flash on load. Hash routing, so deep links work on GitHub Pages (for example `#/operations?t=0.45` or `#/lineage?src=report-w6-test`). Responsive down to 390px. ARIA tabs with arrow, Home and End keys, labelled controls, charts backed by lists or tables, visible focus and reduced-motion support.

## Results

### Financial layer (Taiwanese Bankruptcy, 6,819 firms, 3.23% bankrupt)

Week 5, test set n = 1,364 with 44 bankrupt:

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression | 0.878 | 0.186 | 0.818 | 0.303 | 0.902 |
| Random Forest | 0.966 | 0.478 | 0.500 | 0.489 | 0.943 |
| XGBoost | 0.970 | 0.535 | 0.523 | 0.529 | 0.950 |

With both models held to 81.8% recall (36 of 44 caught), XGBoost raised 82 false alarms against 140 for Logistic Regression: 41% fewer. XGBoost was shortlisted, with Random Forest as the backup.

Week 6: RandomizedSearchCV, 40 draws × 5 folds, scored on average precision. The tuned model beat the Week 5 configuration in cross-validation (PR-AUC 0.4257 vs 0.3895) but not on the sealed test set:

| Configuration | Threshold | Precision | Recall | F1 | PR-AUC | Caught |
|---|---|---|---|---|---|---|
| XGBoost, Week 5 config (refit) · **deployed** | 0.500 | 0.568 | 0.568 | 0.568 | 0.490 | 25/44 |
| XGBoost, tuned | 0.500 | 0.489 | 0.523 | 0.505 | 0.425 | 23/44 |
| XGBoost, tuned @ calibrated | 0.335 | 0.382 | 0.591 | 0.464 | 0.425 | 26/44 |

The report explains why tuning did not transfer:

- **Noise.** The ranking signal (0.0498 PR-AUC, best to worst) was smaller than the fold noise (SD 0.0649), a signal-to-noise ratio of 0.77, with about 28 positives per fold.
- **Grid.** The grid capped `scale_pos_weight` at 20 while the class ratio was 30.0.
- **Bootstrap.** A paired bootstrap with 2,000 resamples puts ΔPR-AUC at −0.0652, with a 95% CI of [−0.1351, +0.0249], which spans zero.

The decision was to keep the Week 5 configuration and invest in more labelled bankruptcies rather than more search.

### Operations layer (DataCo, 171,962 orders after artefact removal, 54.8% late)

After removing eight leaking Order Status columns (35 → 27 features), a tuned Random Forest was calibrated on the validation split. The threshold 0.39 gave the best validation F1 (0.748). Results on the sealed test set (34,393 orders):

| Model | Threshold | Precision | Recall | F1 | ROC-AUC | PR-AUC |
|---|---|---|---|---|---|---|
| Corrected baseline RF | 0.50 | 0.8261 | 0.6461 | 0.7251 | 0.8138 | 0.8620 |
| Tuned RF | 0.50 | 0.8456 | 0.6290 | 0.7214 | 0.8258 | 0.8730 |
| Tuned RF · **deployed** | 0.39 | 0.6944 | 0.8490 | 0.7639 | 0.8258 | 0.8730 |

Calibration cut missed late orders from 6,994 to 2,847, so about 4,100 more at-risk shipments are flagged. False alarms rose from 2,166 to 7,045.

The two layers are presented side by side and never merged into a single score.

## Data provenance

- `scripts/extract_data.py` parses executed cell output from the notebooks, plus the threshold sweep that `AIT506_Week6_Operations_Model_Tuning.ipynb` saved to `week6_operations_threshold_results.csv`.
- `scripts/report_facts.py` holds the report's tables, each with the page it came from. On every extraction, 166 values are re-checked against the report's PDF text.
- Two report items exist only as figures: the delay distribution (Week 3, Figure 7) and the Week 6 confusion matrices (Figure 5). Those values were read from the figure images and cross-checked against the surrounding text ("33.6% at +1 day", "false alarms rising from 24 to 42").
- The notebooks and the report are not in this repository.

| Source | Used for |
|---|---|
| `AIT506_Week6_Operations_Model_Tuning.ipynb` and its saved sweep CSV | Operations Week 6: splits, search, threshold sweep, final test results |
| `AIT506_Week5_Operational_Model_Selection.ipynb` | Operations Week 5: class balance, model comparison, CV, feature importances |
| `Week4_CEROP_Pipeline_Integration_FIXED_v3.ipynb`, `WEEK_4_—_Financial_Layer_Cleaning_(Taiwan_Bankruptcy_Dataset).ipynb` | Dataset shapes, cleaning tiers, split sizes, GSCPI join |
| `[AIT506] Group 4 - CEROP.pdf` (Weeks 2–6) | EDA, GSCPI test, DBSCAN, financial Weeks 5–6, deployment decision, team and roles |

The report and the notebooks agree on every operations figure they share, to the printed precision. The only inconsistency found is inside the report: Week 6 Figure 5 labels the calibrated financial threshold t = 0.334, while Table 3 gives 0.335. The console uses Table 3.

## Tech stack

- Vite 8, React 19, TypeScript 6 in strict mode (with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`)
- CSS Modules on a small set of design tokens. No UI kit or chart library: the charts are hand-built SVG and HTML, with palettes checked for colour-vision-deficiency separation and contrast in both themes.
- Vitest and Testing Library, 58 tests:
  - confusion matrices sum to their test sets;
  - precision, recall, F1 and accuracy recomputed from the matrices match the reported values;
  - caught/44 equals recall for every financial row;
  - the report and notebooks agree;
  - the sweep is ordered and consistent;
  - provenance covers every source;
  - interactions: tabs, the slider, deep links, the matrix picker and theme.
- oxlint with the React, jsx-a11y and Vitest plugins
- A GitHub Actions workflow that runs lint, typecheck, tests and build on Node 22, then deploys to GitHub Pages from `main`

## Getting started

```bash
npm ci
npm run dev          # http://localhost:5173/cerop-console/
npm run check        # lint + typecheck + tests + build
npm run extract -- ~/Downloads   # regenerate src/data (pypdf enables the report check)
```

## Credits

Team project · AIT 506 Machine Learning, Westcliff University · Console designed and built by Divya Gopal.

CEROP was built by Group 4 (Ankit Kumar, Arthunya Kanoklertwongse, Aswin Shriram Thiagarajan and Divya Gopal) for Prof. Oueichek Ibba, Summer 2026. The modelling is the team's work. The team charter assigns Divya the executive dashboard: "translating model output into a decision-support interface". This console is that work.
