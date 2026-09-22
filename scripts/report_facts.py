"""Documented facts from the team's written report, "[AIT506] Group 4 - CEROP" (Weeks 2-6).

The report is a PDF, so its tables are transcribed here once, each with the page
it came from. `verify()` re-reads the PDF text and asserts that every number
string listed under `check` appears on the cited page, so a typo here fails the
build of the data rather than reaching the console. Two items live only in
figures (the Week 3 delay distribution, Figure 7, and the Week 6 confusion
matrices, Figure 5). For those, the check strings come from the surrounding
text, and the figure values were read from the figure images.
"""

from __future__ import annotations

REPORT = "[AIT506] Group 4 - CEROP.pdf"

# (source id, location, note, page, strings that must appear on that page)
SOURCES = [
    ("report-w1-plan", "Project plan (p. 3)", "Week-by-week plan, Weeks 1-8.", 3, ["Team Formation", "Finalizing Models"]),
    ("report-w2-title", "Week 2 title page (p. 6)", "Team, course and instructor.", 6, ["Oueichek Ibba", "July 12, 2026"]),
    ("report-w2-metrics", "Week 2, How should performance be measured? (p. 9)", "Why accuracy is not used for the financial layer.", 9, ["more than 97%"]),
    ("report-w2-charter", "Week 2 charter, Responsibilities (p. 35)", "Each member's responsibility.", 35, ["Executive dashboard design and build"]),
    ("report-w3-fin", "Week 3, Financial EDA (pp. 44-45)", "Class balance and top correlates with bankruptcy.", 44, ["6,599", "220", "3.23%"]),
    ("report-w3-corr", "Week 3, Correlation Analysis (p. 45)", "Features most correlated with Bankrupt?.", 45, ["0.250", "0.194", "0.177", "-0.315", "-0.283"]),
    ("report-w3-sentinel", "Week 3, sentinel-value tiers (pp. 47-48)", "24 features with sentinel values in three tiers.", 47, ["24", "3.24%"]),
    ("report-w3-severe", "Week 3, severe tier list (p. 48)", "Share of records affected in the 8 severe features.", 48, ["88.2%", "62.2%", "59.1%", "43.2%", "34.9%", "33.5%", "18.1%", "18.0%"]),
    ("report-w3-ops", "Week 3, Operations EDA key findings (p. 49)", "DataCo size, class balance and strongest numeric correlate.", 49, ["180,519", "53 features", "54.8%", "0.40"]),
    ("report-w3-mode", "Week 3, late rate by shipping mode (p. 51)", "Late-delivery rate by shipping mode.", 51, ["95.3%", "76.6%", "45.7%", "38.1%", "53"]),
    ("report-w3-delay", "Week 3, text p. 53 and Figure 7 (p. 54)", "Distribution of shipping delays, actual vs scheduled days.", 53, ["33.6%", "15.9%"]),
    ("report-w3-gscpi", "Week 3, GSCPI assumption test (p. 55)", "Annual and monthly correlation of GSCPI with late rate.", 55, ["0.41", "-0.06", "37", "51.9%", "56.8%", "January 1998"]),
    ("report-w4-features", "Week 4, Feature Engineering (p. 84)", "Engineered financial features.", 84, ["Profitability_Composite", "Compounding_Leverage_", "Liquidity_Buffer"]),
    ("report-w4-leak", "Week 4, Data Cleaning (p. 89)", "Leakage columns dropped from DataCo.", 89, ["Delivery Status", "Days for shipping (real)", "shipping date"]),
    ("report-w4-dbscan", "Week 4, DBSCAN (p. 96)", "Unsupervised anomaly component.", 96, ["3 clusters", "18 noisy"]),
    ("report-w4-integration", "Week 4, Pipeline Integration (p. 103)", "Artefact removal and split sizes.", 103, ["171,962", "137,569", "34,393"]),
    ("report-w4-gscpi", "Week 4, GSCPI enrichment (p. 105)", "GSCPI file coverage.", 105, ["342", "January 1998", "June 2026"]),
    ("report-w4-summary", "Week 4 changes summary (p. 118)", "Liquidity_Buffer removed as redundant.", 118, ["Liquidity_Buffer"]),
    ("report-w5-intro", "Week 5, introduction (p. 124)", "Why the two layers are kept separate.", 124, ["do not share a target, a feature set, or even a comparable class balance"]),
    ("report-w5-fin", "Week 5, Table 1 (p. 125)", "Financial model comparison, test n = 1,364 with 44 bankrupt.", 125, ["0.878", "0.186", "0.818", "0.303", "0.902", "0.966", "0.478", "0.489", "0.943", "0.970", "0.535", "0.523", "0.529", "0.950", "82", "140", "41%"]),
    ("report-w5-fin-rec", "Week 5, Recommendation (p. 126)", "XGBoost shortlisted, Random Forest kept as backup; 2.3 points per firm.", 126, ["Random Forest retained as a backup", "2.3"]),
    ("report-w5-ops", "Week 5, Table 2 (p. 127)", "Operations model comparison (35 features, pre-fix).", 127, ["0.726", "0.887", "0.573", "0.696", "0.774", "0.752", "0.873", "0.640", "0.739", "0.855", "0.725", "0.570", "0.694", "0.728", "0.002"]),
    ("report-w6-leak", "Week 6 task notes (p. 134)", "Order Status leak: Cancelled and Suspected Fraud had 0% late; 8 columns removed.", 134, ["Cancelled", "Suspected Fraud", "0%", "27 features"]),
    ("report-w6-protocol", "Week 6, introduction (p. 140)", "Shared tuning protocol for both layers.", 140, ["threshold calibration on validation only and one sealed evaluation on the test set"]),
    ("report-w6-partition", "Week 6, Table 1 (p. 141)", "Financial data partition and search size.", 141, ["4,364", "141", "1,091", "35", "1,364", "44", "40", "200", "15,360", "0.26%"]),
    ("report-w6-cv", "Week 6, Table 2 (pp. 143-144)", "Selected hyperparameters and cross-validated PR-AUC.", 144, ["0.4257", "0.0791", "0.3994", "0.3895", "0.0590", "29.95", "0.335"]),
    ("report-w6-test", "Week 6, Table 3 (p. 146)", "Financial test-set performance before and after tuning.", 146, ["0.476", "0.568", "0.505", "0.464", "0.345", "0.434", "0.452", "0.361", "0.355", "0.454", "0.363", "0.030", "0.791", "0.949", "0.518", "35/44", "21/44", "22/44", "33/44", "26/44"]),
    ("report-w6-cm", "Week 6, text p. 145 and Figure 5 (p. 148)", "Financial confusion matrices before tuning, after tuning, after calibration.", 145, ["24 to 42", "26 of 44"]),
    ("report-w6-rf", "Week 6, Random Forest check and ensemble (p. 148)", "Tuned RF false alarms and the stacking result.", 148, ["75 false alarms", "0.3794", "0.3780"]),
    ("report-w6-fa", "Week 6, Test Set Performance (p. 145)", "Recall-targeted threshold: 35 of 44 at 124 false alarms.", 145, ["124 false alarms", "35 of 44"]),
    ("report-w6-why", "Week 6, Why Tuning Did Not Help (p. 149)", "Signal-to-noise of the search and the scale_pos_weight cap.", 149, ["0.0498", "0.0649", "0.77", "28 positives", "30.0", "0.3985"]),
    ("report-w6-boot", "Week 6, How Much of This Is Real? (p. 150)", "Paired bootstrap of the before/after PR-AUC difference.", 150, ["2,000", "-0.0652", "-0.1351", "+0.0249", "8.8%", "2 firms out of 44"]),
    ("report-w6-ops", "Week 6, Operations Tables 1-3 (pp. 152-155)", "Operations tuning, threshold and test results.", 153, ["0.7051", "0.748", "0.676", "0.838", "0.39"]),
    ("report-w6-synthesis", "Week 6, Cross Layer Synthesis (pp. 155-157)", "Deployment decision for each layer; signals shown side by side.", 156, ["side by side", "ready to deploy as is", "more labeled bankruptcies"]),
    ("report-w6-merge", "Week 6, Cross Layer Synthesis (p. 156)", "Why the two signals cannot be merged.", 156, ["Neither layer can be merged into a single score"]),
    ("report-w6-4100", "Week 6, Cross Layer Synthesis (p. 155)", "About 4,100 more at-risk shipments flagged.", 155, ["4,100", "6,994", "2,847", "2,166", "7,045"]),
]


def facts(src) -> dict:
    """Return the documented facts, registering each source via `src(id, file, location, note)`."""
    ids = {}
    for sid, location, note, _page, _checks in SOURCES:
        ids[sid] = src(sid, REPORT, location, note)

    return dict(
        project=dict(
            name="CEROP: Cross-Border Enterprise Risk & Operations Predictor",
            group="Group 4",
            course="AIT 506 Machine Learning",
            university="Westcliff University",
            instructor="Prof. Oueichek Ibba",
            term="Summer 2026 (July-August)",
            team=[
                dict(name="Ankit Kumar", role="Data infrastructure: loading, cleaning and merging the three datasets; pipeline support for model tuning"),
                dict(name="Arthunya Kanoklertwongse", role="Financial feature engineering, business and risk framing, financial distress classification layer"),
                dict(name="Aswin Shriram Thiagarajan", role="Core ML pipeline and ensemble modelling across both risk layers, model selection and tuning"),
                dict(name="Divya Gopal", role="Executive dashboard design and build, translating model output into a decision-support interface"),
            ],
            source=ids["report-w2-title"],
            roles_source=ids["report-w2-charter"],
        ),
        financial_eda=dict(
            rows=6819, bankrupt=220, healthy=6599, bankrupt_pct=3.23, features=95,
            source=ids["report-w3-fin"],
            correlates=[
                dict(feature="Net Income to Total Assets", r=-0.315),
                dict(feature="ROA(A) before interest and % after tax", r=-0.283),
                dict(feature="Debt ratio %", r=0.250),
                dict(feature="Current Liability to Assets", r=0.194),
                dict(feature="Borrowing dependency", r=0.177),
            ],
            correlates_source=ids["report-w3-corr"],
            sentinel=dict(
                total=24, minor=15, minor_rule="under 2% of rows; capped at the 99th percentile",
                borderline=dict(feature="Interest-bearing debt interest rate", pct=3.24, treatment="capped"),
                severe_rule="18-88% of rows; dropped",
                severe=[
                    dict(feature="Total Asset Growth Rate", pct=88.2),
                    dict(feature="Cash Turnover Rate", pct=62.2),
                    dict(feature="Research and Development Expense Rate", pct=59.1),
                    dict(feature="Inventory Turnover Rate", pct=43.2),
                    dict(feature="Quick Asset Turnover Rate", pct=34.9),
                    dict(feature="Operating Expense Rate", pct=33.5),
                    dict(feature="Current Asset Turnover Rate", pct=18.1),
                    dict(feature="Fixed Assets Turnover Frequency", pct=18.0),
                ],
                source=ids["report-w3-sentinel"],
                severe_source=ids["report-w3-severe"],
            ),
            engineered=[
                dict(feature="Profitability_Composite", formula="Mean of ROA(A), ROA(B) and ROA(C)"),
                dict(feature="Compounding_Leverage_Risk", formula="Current Liability to Assets × Borrowing dependency"),
            ],
            removed_feature=dict(feature="Liquidity_Buffer", why="Removed as redundant: an exact linear copy of two ratios already in the data."),
            final_features=85,
            engineered_source=ids["report-w4-features"],
            removed_source=ids["report-w4-summary"],
            class_ratio=30.0,
            class_ratio_source=ids["report-w6-why"],
        ),
        operations_eda=dict(
            rows=180519, features=53, late_pct=54.8, days_real_r=0.40,
            source=ids["report-w3-ops"],
            shipping_mode=[
                dict(mode="First Class", late_pct=95.3),
                dict(mode="Second Class", late_pct=76.6),
                dict(mode="Same Day", late_pct=45.7),
                dict(mode="Standard Class", late_pct=38.1),
            ],
            other_dimensions="Region, category and segment all sit between 53% and 57% late.",
            shipping_mode_source=ids["report-w3-mode"],
            delay=[
                dict(days=-2, pct=12.0), dict(days=-1, pct=12.0), dict(days=0, pct=18.7),
                dict(days=1, pct=33.6), dict(days=2, pct=15.9), dict(days=3, pct=3.9), dict(days=4, pct=3.9),
            ],
            delay_source=ids["report-w3-delay"],
            leakage_columns=["Delivery Status", "Days for shipping (real)", "shipping date (DateOrders)"],
            leakage_source=ids["report-w4-leak"],
            order_status=dict(
                columns_removed=8, zero_late=["Cancelled", "Suspected Fraud"],
                features_after=27, source=ids["report-w6-leak"],
            ),
            after_artifact=171962, integration_source=ids["report-w4-integration"],
        ),
        gscpi=dict(
            coverage="January 1998 to June 2026", records=342,
            annual_r=0.41, annual_n=4, monthly_r=-0.06, monthly_n=37,
            monthly_late_range=[51.9, 56.8], supported=False,
            bankruptcy_note="The bankruptcy data has no date field, so the assumption could not be tested on the financial layer.",
            source=ids["report-w3-gscpi"], records_source=ids["report-w4-gscpi"],
        ),
        dbscan=dict(
            features=["Benefit per order", "Order Item Profit Ratio", "Sales", "Order Item Discount Rate"],
            clusters=3, noise=18, source=ids["report-w4-dbscan"],
        ),
        financial_w5=dict(
            n=1364, positives=44,
            models=[
                dict(model="Logistic Regression", accuracy=0.878, precision=0.186, recall=0.818, f1=0.303, roc_auc=0.902),
                dict(model="Random Forest", accuracy=0.966, precision=0.478, recall=0.500, f1=0.489, roc_auc=0.943),
                dict(model="XGBoost", accuracy=0.970, precision=0.535, recall=0.523, f1=0.529, roc_auc=0.950),
            ],
            equal_recall=dict(recall=0.818, caught=36, xgb_false_alarms=82, lr_false_alarms=140, fewer_pct=41),
            decision="XGBoost shortlisted, with Random Forest kept as the backup.",
            firm_recall_points=2.3,
            source=ids["report-w5-fin"], decision_source=ids["report-w5-fin-rec"],
        ),
        operations_w5=dict(rf_cv_f1=0.728, rf_cv_sd=0.002, source=ids["report-w5-ops"]),
        financial_w6=dict(
            partition=[
                dict(split="Tuning fit", rows=4364, bankrupt=141, use="Cross-validated hyperparameter search"),
                dict(split="Validation", rows=1091, bankrupt=35, use="Model choice and threshold calibration"),
                dict(split="Test (sealed)", rows=1364, bankrupt=44, use="One final evaluation"),
            ],
            search=dict(draws=40, folds=5, fits=200, scoring="average_precision", space=15360, coverage_pct=0.26),
            source=ids["report-w6-partition"],
            cv=[
                dict(model="XGBoost, tuned", pr_auc=0.4257, sd=0.0791),
                dict(model="Random Forest, tuned", pr_auc=0.3994, sd=None),
                dict(model="XGBoost, Week 5 configuration", pr_auc=0.3895, sd=0.0590),
            ],
            params=[
                dict(param="colsample_bytree", tuned="0.8", week5="0.8"),
                dict(param="learning_rate", tuned="0.05", week5="0.1"),
                dict(param="max_depth", tuned="8", week5="4"),
                dict(param="min_child_weight", tuned="1", week5="1"),
                dict(param="n_estimators", tuned="100", week5="300"),
                dict(param="scale_pos_weight", tuned="10", week5="29.95"),
                dict(param="subsample", tuned="0.9", week5="0.8"),
            ],
            cv_source=ids["report-w6-cv"],
            test=[
                dict(row="XGB · Week 5 published", group="XGBoost", threshold=0.500, precision=0.535, recall=0.523, f1=0.529, roc_auc=0.950, pr_auc=0.476, caught=23),
                dict(row="XGB · Week 5 config (refit)", group="XGBoost", threshold=0.500, precision=0.568, recall=0.568, f1=0.568, roc_auc=0.947, pr_auc=0.490, caught=25, deployed=True),
                dict(row="XGB · tuned", group="XGBoost", threshold=0.500, precision=0.489, recall=0.523, f1=0.505, roc_auc=0.946, pr_auc=0.425, caught=23),
                dict(row="XGB · tuned @ calibrated", group="XGBoost", threshold=0.335, precision=0.382, recall=0.591, f1=0.464, roc_auc=0.946, pr_auc=0.425, caught=26),
                dict(row="XGB · tuned @ recall ≥ 80%", group="XGBoost", threshold=0.030, precision=0.220, recall=0.795, f1=0.345, roc_auc=0.946, pr_auc=0.425, caught=35),
                dict(row="RF · tuned", group="Random Forest", threshold=0.500, precision=0.306, recall=0.750, f1=0.434, roc_auc=0.944, pr_auc=0.461, caught=33),
                dict(row="RF · tuned @ calibrated", group="Random Forest", threshold=0.791, precision=0.429, recall=0.477, f1=0.452, roc_auc=0.944, pr_auc=0.461, caught=21),
                dict(row="RF · tuned @ recall ≥ 80%", group="Random Forest", threshold=0.331, precision=0.233, recall=0.795, f1=0.361, roc_auc=0.944, pr_auc=0.461, caught=35),
                dict(row="Stacking (XGB + RF)", group="Stacking", threshold=0.500, precision=0.229, recall=0.795, f1=0.355, roc_auc=0.943, pr_auc=0.454, caught=35),
                dict(row="Stacking @ calibrated", group="Stacking", threshold=0.949, precision=0.415, recall=0.500, f1=0.454, roc_auc=0.943, pr_auc=0.454, caught=22),
                dict(row="Stacking @ recall ≥ 80%", group="Stacking", threshold=0.518, precision=0.235, recall=0.795, f1=0.363, roc_auc=0.943, pr_auc=0.454, caught=35),
            ],
            test_source=ids["report-w6-test"],
            false_alarms=dict(rf_tuned=75, xgb_tuned_recall80=124),
            false_alarms_source=ids["report-w6-rf"],
            recall80_source=ids["report-w6-fa"],
            matrices=[
                dict(label="Before tuning (Week 5 config)", threshold=0.500, tn=1301, fp=19, fn=19, tp=25),
                dict(label="Tuned @ 0.50", threshold=0.500, tn=1296, fp=24, fn=21, tp=23),
                dict(label="Tuned @ calibrated", threshold=0.335, tn=1278, fp=42, fn=18, tp=26),
            ],
            matrices_source=ids["report-w6-cm"],
            why=dict(
                spread=0.0498, fold_sd=0.0649, snr=0.77, all_within_1sd=True, positives_per_fold=28,
                spw_cap=20, class_ratio=30.0, rerun_spw=30, rerun_val_pr_auc=0.3985,
                baseline_val_pr_auc=0.3794, winner_val_pr_auc=0.3780,
            ),
            why_source=ids["report-w6-why"],
            bootstrap=dict(resamples=2000, delta=-0.0652, ci=[-0.1351, 0.0249], tuned_wins_pct=8.8, firms=2, of=44),
            bootstrap_source=ids["report-w6-boot"],
            decision="Keep the Week 5 configuration. The next investment should go into more labelled bankruptcies, not more search.",
        ),
        operations_w6=dict(
            validation_f1=0.748, validation_precision=0.676, validation_recall=0.838,
            source=ids["report-w6-ops"],
            more_flagged="about 4,100", more_flagged_source=ids["report-w6-4100"],
        ),
        separation=dict(
            shared="They do not share a target, a feature set, or even a comparable class balance.",
            source=ids["report-w5-intro"],
            merge="Neither layer can be merged into a single score: a firm's balance sheet and a shipment's delivery risk answer different business questions for different stakeholders.",
            merge_source=ids["report-w6-merge"],
        ),
        protocol=dict(
            steps=[
                dict(step="Validation split", detail="A stratified validation split is carved out of the training data."),
                dict(step="Search", detail="Hyperparameter search scored by a metric matched to each layer's imbalance: average precision for the financial layer, F1 for operations."),
                dict(step="Calibrate", detail="Decision thresholds are calibrated on the validation split only."),
                dict(step="One sealed evaluation", detail="The test set is opened once, so before and after are comparable within each layer."),
            ],
            source=ids["report-w6-protocol"],
        ),
        deployment=dict(
            financial="XGBoost at its Week 5 configuration, threshold 0.50",
            operations="Tuned Random Forest at the calibrated 0.39 threshold",
            presentation="Shown side by side in one CEROP report, never merged into a single score.",
            source=ids["report-w6-synthesis"],
        ),
        timeline=[
            dict(week=1, title="Team formation", points=["Confirmed the datasets and each member's role."], source=ids["report-w1-plan"]),
            dict(week=2, title="Frame the problem", points=[
                "Framed CEROP as two separate binary classifiers: financial distress and late delivery.",
                "Chose precision, recall, F1 and AUC-ROC over accuracy: an all-healthy guess would score more than 97% on the bankruptcy data.",
            ], source=ids["report-w2-metrics"]),
            dict(week=3, title="Get and explore the data", points=[
                "Found 24 financial ratios holding sentinel values in the billions; tiered them as 15 minor, 1 borderline and 8 severe.",
                "Shipping mode was the strongest operations signal: First Class orders were late 95.3% of the time.",
                "Tested the GSCPI assumption: monthly r = -0.06 over 37 months, so it was not supported.",
            ], source=ids["report-w3-gscpi"]),
            dict(week=4, title="Prepare the data", points=[
                "Split before fitting anything: 5,455 / 1,364 firms and 137,569 / 34,393 orders.",
                "Dropped the Nov-Dec 2017 artefact (180,519 → 171,962 orders) and three leakage columns.",
                "Engineered Profitability_Composite and Compounding_Leverage_Risk; 85 financial features.",
                "DBSCAN on four order-value features found 3 clusters and 18 anomalous transactions.",
            ], source=ids["report-w4-integration"]),
            dict(week=5, title="Model selection", points=[
                "Financial: XGBoost shortlisted (F1 0.529, ROC-AUC 0.950), Random Forest kept as backup.",
                "At equal 81.8% recall, XGBoost raised 82 false alarms against 140 for Logistic Regression.",
                "Operations: Random Forest led every metric (F1 0.739) on the 35-feature set.",
            ], source=ids["report-w5-fin"]),
            dict(week=6, title="Finalize models", points=[
                "Found and removed the Order Status leak: 35 → 27 operations features.",
                "Operations: tuned Random Forest at a 0.39 cutoff lifted test recall to 0.849 and F1 to 0.764.",
                "Financial: tuning did not transfer (bootstrap 95% CI for ΔPR-AUC straddles zero); kept the Week 5 configuration.",
            ], source=ids["report-w6-synthesis"]),
            dict(week=7, title="Deployment specification (planned)", points=[
                "Ship the financial layer at its Week 5 configuration and the operations layer tuned and calibrated.",
                "Surface both signals side by side in one CEROP report; they cannot be merged into one model.",
            ], source=ids["report-w6-synthesis"]),
        ],
    )


def verify(pdf_path) -> int:
    """Assert every `check` string appears on its cited page. Returns the number of checks."""
    import pypdf  # only needed for verification

    reader = pypdf.PdfReader(str(pdf_path))
    pages = [" ".join((p.extract_text() or "").split()) for p in reader.pages]
    n = 0
    for sid, _loc, _note, page, checks in SOURCES:
        text = pages[page - 1]
        for c in checks:
            assert c in text, f"{sid}: {c!r} not found on page {page}"
            n += 1
    return n
