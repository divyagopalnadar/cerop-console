#!/usr/bin/env python3
"""Extract every figure the console shows from the team's executed artefacts.

The notebooks, decks and CSVs stay outside this repository. Point SOURCE_DIR at
the folder that holds them (default: ~/Downloads) and run:

    python3 scripts/extract_data.py [SOURCE_DIR]

Each emitted record carries a `source` id that resolves to an entry in
src/data/sources.json (file, cell or slide, and what was read there). Values are
parsed from printed cell output or saved result files, never typed in by hand.
"""

from __future__ import annotations

import csv
import json
import re
import sys
import zipfile
from pathlib import Path

SOURCE_DIR = Path(sys.argv[1] if len(sys.argv) > 1 else Path.home() / "Downloads")
OUT_DIR = Path(__file__).resolve().parent.parent / "src" / "data"

NB_OPS_SELECT = "AIT506_Week5_Operational_Model_Selection.ipynb"
NB_OPS_TUNE = "AIT506_Week6_Operations_Model_Tuning.ipynb"
NB_PIPELINE = "Week4_CEROP_Pipeline_Integration_FIXED_v3.ipynb"
NB_FIN_CLEAN = "WEEK_4_—_Financial_Layer_Cleaning_(Taiwan_Bankruptcy_Dataset).ipynb"
CSV_SWEEP = "week6_operations_results/week6_operations_threshold_results.csv"
DECK_FINAL = "CEROP_Unified_Risk_Intelligence.pptx"
DECK_PCA = "CEROP_PCA_Class_Activity.pptx"
DECK_ACTIVITY = "CEROP_Class_Activity_5_Slides_Final.pptx"

sources: dict[str, dict[str, str]] = {}


def source(sid: str, file: str, location: str, note: str) -> str:
    sources[sid] = {"id": sid, "file": file, "location": location, "note": note}
    return sid


def cell_output(nb_name: str, index: int) -> str:
    nb = json.loads((SOURCE_DIR / nb_name).read_text(encoding="utf-8"))
    cell = nb["cells"][index]
    text = []
    for out in cell.get("outputs", []):
        if out.get("output_type") == "stream":
            text.append("".join(out["text"]))
        elif "text/plain" in out.get("data", {}):
            text.append("".join(out["data"]["text/plain"]))
    return "".join(text)


def cell_label(nb_name: str, index: int) -> str:
    nb = json.loads((SOURCE_DIR / nb_name).read_text(encoding="utf-8"))
    count = nb["cells"][index].get("execution_count")
    return f"cell {index}" + (f" (In [{count}])" if count else "")


def num(pattern: str, text: str, cast=float):
    match = re.search(pattern, text)
    if not match:
        raise ValueError(f"pattern not found: {pattern}")
    return cast(match.group(1).replace(",", ""))


def slide_text(deck: str, slide: int) -> str:
    with zipfile.ZipFile(SOURCE_DIR / deck) as z:
        xml = z.read(f"ppt/slides/slide{slide}.xml").decode("utf-8")
    paragraphs = re.findall(r"<a:p>(.*?)</a:p>", xml, re.S)
    lines = ["".join(re.findall(r"<a:t>(.*?)</a:t>", p, re.S)) for p in paragraphs]
    return "\n".join(line for line in lines if line.strip())


def parse_table(text: str, header_start: str) -> list[list[str]]:
    """Parse a pandas `to_string(index=False)` table that begins with header_start."""
    lines = text.splitlines()
    start = next(i for i, l in enumerate(lines) if l.strip().startswith(header_start))
    rows = []
    for line in lines[start + 1 :]:
        if not line.strip() or line.startswith("=") or ":" in line:
            break
        rows.append(line)
    return rows


# ---------------------------------------------------------------- operations
def operations() -> dict:
    # Week 5: class balance (cell 5)
    out = cell_output(NB_OPS_SELECT, 5)
    s_balance = source(
        "ops-w5-balance", NB_OPS_SELECT, cell_label(NB_OPS_SELECT, 5),
        "Class distribution table for the train and test splits.",
    )
    counts = dict(
        train_on_time=num(r"Train On time \(0\)\s+(\d+)", out, int),
        train_late=num(r"Train\s+Late \(1\)\s+(\d+)", out, int),
        test_on_time=num(r"Test On time \(0\)\s+(\d+)", out, int),
        test_late=num(r"Test\s+Late \(1\)\s+(\d+)", out, int),
    )

    # Week 4 pipeline: raw rows and artifact removal (cell 14)
    out = cell_output(NB_PIPELINE, 14)
    s_rows = source(
        "pipeline-ops-rows", NB_PIPELINE, cell_label(NB_PIPELINE, 14),
        "DataCo rows before and after removing the Nov-Dec 2017 collection artefact.",
    )
    rows = dict(
        original=num(r"Original operations rows: (\d+)", out, int),
        after_artifact_removal=num(r"Rows after artifact removal: (\d+)", out, int),
        removed=num(r"Rows removed: (\d+)", out, int),
    )

    # Week 6: shapes and late rate (cell 4), dev/validation split (cell 6)
    out4 = cell_output(NB_OPS_TUNE, 4)
    out6 = cell_output(NB_OPS_TUNE, 6)
    s_shapes = source(
        "ops-w6-shapes", NB_OPS_TUNE, cell_label(NB_OPS_TUNE, 4),
        "Corrected (v2) train/test shapes, 27 features, late-delivery rate.",
    )
    s_val = source(
        "ops-w6-validation", NB_OPS_TUNE, cell_label(NB_OPS_TUNE, 6),
        "Stratified 80/20 development/validation split of the training set.",
    )
    dataset = dict(
        train_rows=num(r"Training features: \((\d+),", out4, int),
        test_rows=num(r"Test features: \((\d+),", out4, int),
        features=num(r"Training features: \(\d+, (\d+)\)", out4, int),
        late_rate=num(r"Late-delivery rate in training set: ([\d.]+)", out4),
        dev_rows=num(r"Development set: \((\d+),", out6, int),
        validation_rows=num(r"Validation set: \((\d+),", out6, int),
        source=s_shapes,
        validation_source=s_val,
        class_counts={**counts, "source": s_balance},
        raw_rows={**rows, "source": s_rows},
        features_before_leak_fix=num(
            r"X_train_operations: \(\d+, (\d+)\)", cell_output(NB_OPS_SELECT, 3), int
        ),
        features_before_leak_fix_source=source(
            "ops-w5-shapes", NB_OPS_SELECT, cell_label(NB_OPS_SELECT, 3),
            "Week 5 input shapes: 35 features, later found to include 8 leaking Order Status "
            "columns (see Week 6 notebook, cell 0).",
        ),
    )

    # Week 5 model comparison (cell 11) and confusion matrices (cell 24)
    out = cell_output(NB_OPS_SELECT, 11)
    s_cmp = source(
        "ops-w5-comparison", NB_OPS_SELECT, cell_label(NB_OPS_SELECT, 11),
        "Test-set metrics for LR, RF and linear SVM on the Week 5 (35-feature) data.",
    )
    models = []
    for line in parse_table(out, "Model  Accuracy")[:3]:
        parts = line.split()
        name = " ".join(parts[:-6])
        acc, prec, rec, f1, roc, pr = map(float, parts[-6:])
        models.append(dict(model=name, accuracy=acc, precision=prec, recall=rec, f1=f1, roc_auc=roc, pr_auc=pr))
    out = cell_output(NB_OPS_SELECT, 24)
    s_cm5 = source(
        "ops-w5-confusion", NB_OPS_SELECT, cell_label(NB_OPS_SELECT, 24),
        "Confusion-matrix counts (TN, FP, FN, TP) for the three Week 5 models.",
    )
    for m in models:
        match = re.search(re.escape(m["model"]) + r"\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)", out)
        tn, fp, fn, tp = map(int, match.groups())
        m["confusion"] = dict(tn=tn, fp=fp, fn=fn, tp=tp, source=s_cm5)
        m["source"] = s_cmp
    out = cell_output(NB_OPS_SELECT, 16)
    s_cv = source(
        "ops-w5-cv", NB_OPS_SELECT, cell_label(NB_OPS_SELECT, 16),
        "5-fold stratified cross-validation on the training set.",
    )
    for m in models:
        match = re.search(re.escape(m["model"]) + r"\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)", out)
        a, a_sd, f, f_sd = map(float, match.groups())
        m["cv"] = dict(accuracy_mean=a, accuracy_sd=a_sd, f1_mean=f, f1_sd=f_sd, source=s_cv)
    out = cell_output(NB_OPS_SELECT, 18)
    rbf = dict(
        model="SVM (RBF, 20k-row sample)",
        train_rows=num(r"RBF SVM trained on ([\d,]+) rows", out, int),
        accuracy=num(r"Accuracy : ([\d.]+)", out),
        precision=num(r"Precision: ([\d.]+)", out),
        recall=num(r"Recall   : ([\d.]+)", out),
        f1=num(r"F1-Score : ([\d.]+)", out),
        source=source(
            "ops-w5-rbf", NB_OPS_SELECT, cell_label(NB_OPS_SELECT, 18),
            "Optional RBF SVM trained on a 20,000-row stratified sample.",
        ),
    )
    out = cell_output(NB_OPS_SELECT, 5)
    majority = num(r"Accuracy : ([\d.]+)", out)

    # Week 5 feature importance (cell 20)
    out = cell_output(NB_OPS_SELECT, 20)
    s_fi = source(
        "ops-w5-importance", NB_OPS_SELECT, cell_label(NB_OPS_SELECT, 20),
        "Top-15 Random Forest impurity importances (Week 5 model, 35-feature set).",
    )
    importance = []
    for line in out.strip().splitlines():
        match = re.search(r"(numeric|low_cardinality|high_cardinality)__(.+?)\s+([\d.]+)$", line.strip())
        if match:
            group, feature, value = match.groups()
            importance.append(dict(feature=feature.strip(), group=group, importance=float(value)))

    # Week 6 tuning (cell 8)
    out = cell_output(NB_OPS_TUNE, 8)
    tuning = dict(
        search_rows=num(r"Rows used for hyperparameter search: (\d+)", out, int),
        folds=num(r"Fitting (\d+) folds", out, int),
        candidates=num(r"for each of (\d+) candidates", out, int),
        best_cv_f1=num(r"Best cross-validation F1: ([\d.]+)", out),
        best_params={k: v for k, v in re.findall(r"^\s+(\w+): (.+)$", out, re.M)},
        source=source(
            "ops-w6-search", NB_OPS_TUNE, cell_label(NB_OPS_TUNE, 8),
            "RandomizedSearchCV: 25 candidates x 3 folds on a 50,000-row stratified sample.",
        ),
    )

    # Week 6 selected threshold (cell 10) + full sweep saved by cell 19
    out = cell_output(NB_OPS_TUNE, 10)
    s_thr = source(
        "ops-w6-threshold", NB_OPS_TUNE, cell_label(NB_OPS_TUNE, 10),
        "Validation sweep 0.10-0.90; selected threshold = max validation F1 (top five printed).",
    )
    selected = num(r"Selected threshold: ([\d.]+)", out)
    top5 = []
    for line in parse_table(out, "Threshold  Precision"):
        t, p, r, f = map(float, line.split())
        top5.append(dict(threshold=t, precision=p, recall=r, f1=f))
    s_sweep = source(
        "ops-w6-sweep-csv", "week6_operations_results/week6_operations_threshold_results.csv",
        f"written by {NB_OPS_TUNE} {cell_label(NB_OPS_TUNE, 19)}",
        "Full 81-step validation sweep saved by the notebook; matches the printed top five.",
    )
    sweep = []
    with open(SOURCE_DIR / CSV_SWEEP, newline="") as fh:
        for row in csv.DictReader(fh):
            sweep.append(dict(
                threshold=round(float(row["Threshold"]), 2),
                precision=float(row["Precision"]),
                recall=float(row["Recall"]),
                f1=float(row["F1"]),
            ))
    for printed in top5:  # guard: CSV agrees with the printed notebook output
        row = next(r for r in sweep if r["threshold"] == printed["threshold"])
        for k in ("precision", "recall", "f1"):
            assert abs(round(row[k], 4) - printed[k]) < 1e-9, (printed, row)

    # Validation positives: recall steps of 1/N imply N. Cross-check with rate.
    distinct = sorted({r["recall"] for r in sweep}, reverse=True)
    gap = distinct[0] - distinct[1]
    val_pos = round(1 / gap)
    assert abs(val_pos / dataset["validation_rows"] - dataset["late_rate"]) < 1e-3

    # Week 6 final test (cell 13)
    out = cell_output(NB_OPS_TUNE, 13)
    s_test = source(
        "ops-w6-test", NB_OPS_TUNE, cell_label(NB_OPS_TUNE, 13),
        "Final test results and confusion matrices; the test set is opened only here.",
    )
    final = []
    names = ["Corrected Baseline RF", "Tuned RF at 0.50", "Tuned RF at Calibrated Threshold"]
    for name in names:
        match = re.search(re.escape(name) + r"\s+([\d.]+)" + r"\s+([\d.]+)" * 6, out)
        thr, acc, prec, rec, f1, roc, pr = map(float, match.groups())
        cm = re.findall(re.escape(name) + r"\s+[\d.]+\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$", out, re.M)
        tn, fp, fn, tp = map(int, cm[-1])
        final.append(dict(
            model=name, threshold=thr, accuracy=acc, precision=prec, recall=rec, f1=f1,
            roc_auc=roc, pr_auc=pr, confusion=dict(tn=tn, fp=fp, fn=fn, tp=tp), source=s_test,
        ))

    return dict(
        dataset=dataset,
        majority_baseline_accuracy=majority,
        week5_models=models,
        week5_rbf=rbf,
        feature_importance=dict(items=importance, source=s_fi),
        tuning=tuning,
        threshold=dict(
            selected=selected, top5=top5, source=s_thr,
            sweep=sweep, sweep_source=s_sweep,
            validation_positives=val_pos,
            validation_positives_note=(
                "Derived: recall moves in steps of 1/N across the sweep, giving N = "
                f"{val_pos}; agrees with {dataset['validation_rows']} x {dataset['late_rate']}."
            ),
        ),
        final_test=final,
    )


# ---------------------------------------------------------------- financial
def financial() -> dict:
    out = cell_output(NB_FIN_CLEAN, 0)
    s_shape = source(
        "fin-w4-shape", NB_FIN_CLEAN, "cell 0",
        "Taiwanese Bankruptcy dataset loaded from UCI (id 572): rows x columns incl. target.",
    )
    rows = num(r"Shape: \((\d+),", out, int)
    cols = num(r"Shape: \(\d+, (\d+)\)", out, int)

    out = cell_output(NB_FIN_CLEAN, 2)
    s_groups = source(
        "fin-w4-groups", NB_FIN_CLEAN, "cell 2 and cell 5",
        "Outlier tiers: 15 minor + 1 borderline capped at p99, 8 severe dropped.",
    )
    minor = num(r"Minor outlier cols: (\d+)", out, int)
    severe = num(r"Severe cols to drop: (\d+)", out, int)
    capped = num(r"Total columns to cap: (\d+)", cell_output(NB_FIN_CLEAN, 5), int)

    out8 = cell_output(NB_PIPELINE, 8)
    out10 = cell_output(NB_PIPELINE, 10)
    s_split = source(
        "pipeline-fin-split", NB_PIPELINE, "cells 8 and 10",
        "Stratified 80/20 split, cleaned, scaled: final train/test shapes and feature count.",
    )
    split = dict(
        train_rows=num(r"Financial train: \((\d+),", out10, int),
        test_rows=num(r"Financial test: \((\d+),", out10, int),
        features=num(r"Financial train: \(\d+, (\d+)\)", out10, int),
        duplicate_pair_max_diff=num(r"max absolute difference: ([\d.]+)", out8),
        source=s_split,
    )

    # Class balance: the deck gives 3.23% positive; the final deck gives 44 test positives.
    pca = slide_text(DECK_PCA, 1)
    positive_share = num(r"([\d.]+)%\npositive class", pca) / 100
    s_pca = source(
        "deck-pca-s1", DECK_PCA, "slide 1",
        "Team deck headline: 95 financial features, 3.23% positive class.",
    )

    s5 = slide_text(DECK_FINAL, 5)
    s7 = slide_text(DECK_FINAL, 7)
    s_s5 = source(
        "deck-final-s5", DECK_FINAL, "slide 5",
        "Dual-domain summary: financial XGBoost test F1 and recall; chosen strategy.",
    )
    s_s7 = source(
        "deck-final-s7", DECK_FINAL, "slide 7",
        "Financial PR-AUC and '25/44 at-risk firms caught' on the test split.",
    )
    fin_block = s5.split("Operational Risk Layer")[0]
    caught, positives = map(int, re.search(r"(\d+)/(\d+) At-Risk Firms Caught", s7).groups())
    result = dict(
        model=re.search(r"Financial Risk Layer \((\w+)\)", s5).group(1),
        test_f1=num(r"Test F1-Score\n([\d.]+)", fin_block),
        test_recall=num(r"Test Recall\n([\d.]+)", fin_block),
        pr_auc=num(r"PR-AUC: ([\d.]+)", s7),
        caught=caught,
        test_positives=positives,
        challenge=re.search(r"Primary Challenge: (.+)", fin_block).group(1).replace("&amp;", "&"),
        strategy=re.search(r"Selected Strategy: (.+)", fin_block).group(1),
        source=s_s5,
        detail_source=s_s7,
    )
    s1 = slide_text(DECK_FINAL, 1)
    team = re.search(r"Group 4(.+?)Westcliff", s1).group(1)
    team_members = [n.strip() for n in team.split("•")]

    # Reconstruct the confusion matrix. Recall = TP / positives is given exactly.
    # Precision is the only unknown; search FP for the value that reproduces F1 to 3 dp.
    tp = caught
    fn = positives - caught
    candidates = []
    for fp in range(0, split["test_rows"] - positives + 1):
        prec = tp / (tp + fp)
        rec = tp / positives
        f1 = 2 * prec * rec / (prec + rec)
        if round(f1, 3) == result["test_f1"]:
            candidates.append(fp)
    assert len(candidates) == 1, candidates
    fp = candidates[0]
    tn = split["test_rows"] - positives - fp
    s_derived = source(
        "derived-fin-cm", "derived", "from deck-final-s5, deck-final-s7, pipeline-fin-split",
        "TP and FN from '25/44'; FP is the unique count that reproduces F1 = 0.568; "
        "TN = 1,364 - 44 - FP.",
    )

    return dict(
        dataset=dict(
            rows=rows, columns=cols, features=cols - 1, positive_share=positive_share,
            source=s_shape, positive_share_source=s_pca,
        ),
        cleaning=dict(
            minor_capped=minor, capped_total=capped, severe_dropped=severe,
            duplicate_dropped=1, source=s_groups,
        ),
        split=split,
        result=result,
        derived_confusion=dict(tn=tn, fp=fp, fn=fn, tp=tp, source=s_derived),
        team=dict(members=team_members, source=source(
            "deck-final-s1", DECK_FINAL, "slide 1", "Team roster (Group 4).",
        )),
    )


def cell_source(nb_name: str, index: int) -> str:
    nb = json.loads((SOURCE_DIR / nb_name).read_text(encoding="utf-8"))
    return "".join(nb["cells"][index]["source"])


def cross_layer() -> dict:
    act = slide_text(DECK_ACTIVITY, 2)
    separate = re.search(r"(Separate datasets: .+)", act).group(1)
    imbalance = re.search(r"(Class imbalance: .+)", act).group(1)
    gscpi = cell_source(NB_PIPELINE, 21).split("\n", 1)[1].strip()
    gscpi = gscpi.split(". ")[0] + "."
    fin_fn = cell_source(NB_PIPELINE, 3)
    assert "Profitability_Composite" in fin_fn and "Compounding_Leverage_Risk" in fin_fn
    separation = dict(
        separate=separate,
        imbalance=imbalance,
        gscpi=gscpi,
        source=source(
            "deck-activity-s2", DECK_ACTIVITY, "slide 2",
            "Team constraints: class imbalance, and datasets that cannot be merged row by row.",
        ),
        gscpi_source=source(
            "pipeline-gscpi", NB_PIPELINE, "cell 21 (markdown)",
            "GSCPI joins only the operations layer: the bankruptcy data has no date field.",
        ),
        engineering_source=source(
            "pipeline-fin-functions", NB_PIPELINE, "cell 3 (code)",
            "Financial feature engineering: 3 ROA variants -> Profitability_Composite; "
            "adds Compounding_Leverage_Risk; drops exact duplicate column.",
        ),
    )
    s6 = slide_text(DECK_FINAL, 6)
    s_s6 = source(
        "deck-final-s6", DECK_FINAL, "slide 6",
        "Cross-layer decision matrix: what to do when one or both layers flag.",
    )
    lines = s6.splitlines()
    playbook = []
    for label in ("High Dual Risk", "Financial Only", "Operational Only"):
        i = lines.index(label)
        playbook.append(dict(label=label, action=lines[i + 1]))
    s3 = slide_text(DECK_FINAL, 3)
    protocol = re.findall(r"\d\. (.+)\n(.+)", s3)
    return dict(
        separation=separation,
        playbook=playbook,
        playbook_source=s_s6,
        protocol=[dict(step=a, detail=b) for a, b in protocol],
        protocol_source=source(
            "deck-final-s3", DECK_FINAL, "slide 3",
            "Shared protocol across both layers (split, search, metric, calibration).",
        ),
    )


def main() -> None:
    data = dict(operations=operations(), financial=financial(), crossLayer=cross_layer())
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for key, value in data.items():
        (OUT_DIR / f"{key}.json").write_text(json.dumps(value, indent=2) + "\n")
    (OUT_DIR / "sources.json").write_text(json.dumps(list(sources.values()), indent=2) + "\n")
    print("wrote", ", ".join(f"{k}.json" for k in data), "and sources.json to", OUT_DIR)


if __name__ == "__main__":
    main()
