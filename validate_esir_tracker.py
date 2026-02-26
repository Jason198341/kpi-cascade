"""
ESIR Master Tracker V3.2 — Validation Script
Validates the generated Excel file for:
  1. Sheet structure (5 sheets, 25 columns, 3 reference tables)
  2. Column headers match V3.2 spec
  3. Status simulation: compute expected status from manual fields, verify formula logic
  4. Formula syntax (parentheses balance) for U, X, Y columns
  5. Conditional formatting rule count
  6. Per-row simulation report: expected Status, Risk, NextAction
  7. Alarm gap detection (formula structure check)
"""

import sys
import io
import datetime
from openpyxl import load_workbook

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

FILE = r"C:\Users\USER\kpi-cascade\ESIR_Master_Tracker.xlsx"
TODAY = datetime.date(2026, 2, 26)

ALL_STATES = [
    "01-계획서미제출", "02-계획서제출_미검토", "03-검토중_조건충족",
    "04-검토중_조건불만족", "05-계획서승인", "06-BIW생산중단",
    "07-생산완료_미인수", "08-단품준비완료", "09-시험준비중",
    "10-시험완료", "11-결과등록완료", "12-조건부승인검토",
]

# V3 Column mapping (0-indexed for iter_rows)
COL = {
    "A_no": 0, "B_vehicle": 1, "C_part": 2, "D_category": 3,
    "E_test": 4, "F_type": 5, "G_supplier": 6, "H_t0": 7,
    "I_plandue": 8, "J_plansub": 9, "K_review": 10,
    "L_partsplan": 11, "M_partsact": 12,
    "N_teststart_plan": 13, "O_teststart_act": 14,
    "P_testcomp_plan": 15, "Q_testcomp_act": 16,
    "R_reportdue": 17, "S_reportsub": 18,
    "T_override": 19, "U_status": 20, "V_progress": 21,
    "W_days": 22, "X_risk": 23, "Y_action": 24,
}

EXPECTED_HEADERS_KR = [
    "번호", "차종", "부품명", "파트구분", "스펙명", "시험유형", "협력사",
    "T₀ 도면배포", "계획서기한", "계획서제출", "검토결과",
    "부품준비(계획)", "부품준비(실적)", "시험시작(계획)", "시험시작(실적)",
    "시험완료(계획)", "시험완료(실적)", "성적서기한", "성적서제출",
    "오버라이드", "상태", "진행률%", "잔여일", "리스크", "다음조치",
]

EXPECTED_TABLES = [
    "TBL_Vehicle", "TBL_TestCatalog", "TBL_PartMap",
]


def check_parens(formula_str):
    if not formula_str or not isinstance(formula_str, str):
        return True
    return formula_str.count("(") == formula_str.count(")")


def compute_expected_status(j_sub, k_rev, m_act, o_act, q_act, s_sub, t_ovr):
    """Simulate the U (Status) formula from manual field values."""
    if t_ovr and isinstance(t_ovr, str) and t_ovr.strip():
        return t_ovr
    if s_sub and q_act:
        return "11-결과등록완료"
    if q_act and not s_sub:
        return "10-시험완료"
    if o_act and not q_act:
        return "09-시험준비중"
    if m_act and not o_act:
        return "08-단품준비완료"
    if k_rev == "Approved":
        return "05-계획서승인"
    if k_rev == "Revision Needed":
        return "04-검토중_조건불만족"
    if k_rev == "Under Review":
        return "03-검토중_조건충족"
    if j_sub and (not k_rev or k_rev == ""):
        return "02-계획서제출_미검토"
    return "01-계획서미제출"


def compute_expected_risk(status, plan_due, days_to_deadline):
    """Simulate the X (Risk) formula."""
    if status == "11-결과등록완료":
        return "DONE"
    if status == "06-BIW생산중단":
        return "CRITICAL"
    if status == "01-계획서미제출" and plan_due and plan_due < TODAY:
        return "CRITICAL"
    if status in ("04-검토중_조건불만족", "07-생산완료_미인수", "12-조건부승인검토"):
        return "ACTION"
    if days_to_deadline is not None and isinstance(days_to_deadline, (int, float)):
        if days_to_deadline <= 0:
            return "OVERDUE"
        if days_to_deadline <= 14:
            return "WARNING"
    return "ON TRACK"


def compute_expected_action(status, plan_due):
    """Simulate the Y (NextAction) formula."""
    actions = {
        "11-결과등록완료": "— 완료",
        "02-계획서제출_미검토": "설계자: 계획서 검토 착수",
        "03-검토중_조건충족": "설계자: 승인 처리",
        "04-검토중_조건불만족": "보완 요청 → 협력사 재제출 독촉",
        "05-계획서승인": "시험편 준비 현황 확인",
        "06-BIW생산중단": "BIW 생산팀 확인 → 일정 재수립",
        "07-생산완료_미인수": "협력사 인수 독촉",
        "08-단품준비완료": "시험 일정 확인",
        "09-시험준비중": "시험 진행 모니터링",
        "10-시험완료": "결과 보고서 전산 등록 독촉",
        "12-조건부승인검토": "조건부 승인 여부 판단 → 관련부서 협의",
    }
    if status == "01-계획서미제출":
        if plan_due and plan_due < TODAY:
            return "계획서 제출 독촉 (OVERDUE)"
        return "계획서 제출 대기"
    return actions.get(status, "—")


def to_date(val):
    if isinstance(val, datetime.datetime):
        return val.date()
    if isinstance(val, datetime.date):
        return val
    return None


def is_filled(val):
    """Check if a cell has a real value (not None, not empty string, not formula)."""
    if val is None:
        return False
    if isinstance(val, str):
        if val.strip() == "" or val.startswith("="):
            return False
        return True
    return True  # date, number, etc.


def main():
    print(f"{'='*80}")
    print("ESIR Master Tracker V3.2 — Validation Report")
    print(f"File: {FILE}")
    print(f"{'='*80}\n")

    wb = load_workbook(FILE, data_only=False)

    # ── 0. Sheet structure ─────────────────────────────────────────────
    print("=" * 60)
    print("CHECK 0: Sheet structure")
    print("=" * 60)

    print(f"  Sheets found: {wb.sheetnames}")
    expected_sheets = ["Config", "Reference Data 기준데이터", "Master Tracker 마스터추적표",
                       "Dashboard 대시보드", "Supplier Checklist 협력사체크리스트"]
    for es in expected_sheets:
        found = es in wb.sheetnames
        print(f"  {'✓' if found else '✗'} {es}")

    # Check reference tables
    ref_ws = wb["Reference Data 기준데이터"]
    tables_found = [t.name for t in ref_ws.tables.values()]
    print(f"\n  Reference tables: {tables_found}")
    tables_ok = True
    for et in EXPECTED_TABLES:
        found = et in tables_found
        if not found:
            tables_ok = False
        print(f"  {'✓' if found else '✗'} {et}")

    # Find tracker sheet
    tracker_name = "Master Tracker 마스터추적표"
    if tracker_name not in wb.sheetnames:
        print("[FAIL] Could not find Master Tracker sheet!")
        return

    ws = wb[tracker_name]
    print(f"\n  Tracker dimensions: {ws.dimensions}")

    # ── 1. Column headers ──────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("CHECK 1: Column headers (row 4 KR)")
    print("=" * 60)

    headers_ok = True
    for i, expected in enumerate(EXPECTED_HEADERS_KR):
        actual = ws.cell(row=4, column=i + 1).value
        match = actual == expected
        if not match:
            headers_ok = False
            print(f"  ✗ Col {chr(65+i)}: expected '{expected}', got '{actual}'")
    if headers_ok:
        print(f"  [PASS] All 25 column headers match V3 spec")
    else:
        print(f"  [FAIL] Some headers don't match")

    # ── 2. Read data rows and compute expected statuses ────────────────
    print(f"\n{'='*60}")
    print("CHECK 2: Status simulation (12 states from manual fields)")
    print("=" * 60)

    DATA_START = 5
    rows_data = []
    statuses_found = set()

    for row in ws.iter_rows(min_row=DATA_START, max_col=25, values_only=False):
        a_val = row[COL["A_no"]].value
        # Stop at first truly empty row (no number in A)
        if a_val is None:
            break
        # Skip formula-only rows (empty rows start at 71)
        if isinstance(a_val, str) and a_val.startswith("="):
            break

        vehicle = row[COL["B_vehicle"]].value
        part = row[COL["C_part"]].value
        test = row[COL["E_test"]].value
        j_sub = row[COL["J_plansub"]].value
        k_rev = row[COL["K_review"]].value
        m_act = row[COL["M_partsact"]].value
        o_act = row[COL["O_teststart_act"]].value
        q_act = row[COL["Q_testcomp_act"]].value
        s_sub = row[COL["S_reportsub"]].value
        t_ovr = row[COL["T_override"]].value

        # Plan due (I) is formula — can't read. Compute from sim data:
        # plan_due = T0 + 14 days (PLAN_DUE offset)
        # For validation, we use the sim data pattern
        plan_due_cell = row[COL["I_plandue"]].value  # formula string
        report_due_cell = row[COL["R_reportdue"]].value  # formula string

        # Compute expected status
        exp_status = compute_expected_status(
            j_sub if is_filled(j_sub) else None,
            k_rev if is_filled(k_rev) else None,
            m_act if is_filled(m_act) else None,
            o_act if is_filled(o_act) else None,
            q_act if is_filled(q_act) else None,
            s_sub if is_filled(s_sub) else None,
            t_ovr if is_filled(t_ovr) else None,
        )
        statuses_found.add(exp_status)

        # For days_to_deadline: since R is formula and S is manual,
        # if S is filled -> "-" (done), else we can't compute exact days without formula eval
        # Approximate: for "done" rows (s_sub filled), days=None
        if is_filled(s_sub):
            days_val = None
        else:
            days_val = None  # Can't compute without formula evaluation

        # For plan_due: I is formula, can't read directly.
        # Use J (plan submitted date) as proxy for "plan was submitted" flag
        # Plan due overdue check needs actual date — approximate from sim pattern
        plan_due = None  # Can't determine from formula

        rows_data.append({
            "row": row[0].row,
            "row_num": a_val,
            "vehicle": vehicle,
            "part": part,
            "test": test,
            "exp_status": exp_status,
            "plan_due": plan_due,
            "days_to_deadline": days_val,
            "status_formula": row[COL["U_status"]].value,
            "risk_formula": row[COL["X_risk"]].value,
            "action_formula": row[COL["Y_action"]].value,
        })

    # State coverage
    missing_states = set(ALL_STATES) - statuses_found
    state_counts = {s: sum(1 for rd in rows_data if rd["exp_status"] == s) for s in ALL_STATES}

    for s in ALL_STATES:
        marker = "✓" if s in statuses_found else "✗ MISSING"
        print(f"  {s:30s} count={state_counts.get(s,0):2d}  {marker}")

    if missing_states:
        print(f"\n  [FAIL] Missing states: {missing_states}")
    else:
        print(f"\n  [PASS] All 12 states covered by simulation data!")

    print(f"  Total data rows: {len(rows_data)}")

    # Vehicle distribution
    v_counts = {}
    for rd in rows_data:
        v = rd["vehicle"]
        v_counts[v] = v_counts.get(v, 0) + 1
    print(f"  Vehicle distribution: {v_counts}")

    # ── 3. Formula syntax ──────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("CHECK 3: Formula syntax (parentheses balance)")
    print("=" * 60)

    formula_errors = 0
    formulas_checked = 0
    for rd in rows_data:
        for fname, fval in [("U Status", rd["status_formula"]),
                            ("X Risk", rd["risk_formula"]),
                            ("Y Action", rd["action_formula"])]:
            if fval and isinstance(fval, str) and fval.startswith("="):
                formulas_checked += 1
                if not check_parens(fval):
                    print(f"  [FAIL] Row {rd['row']}: {fname} — unbalanced parens")
                    formula_errors += 1

    if formula_errors == 0:
        print(f"  [PASS] All {formulas_checked} formulas have balanced parentheses")
    else:
        print(f"  [FAIL] {formula_errors} formulas with unbalanced parentheses")

    # ── 4. Formula structure spot-check ────────────────────────────────
    print(f"\n{'='*60}")
    print("CHECK 4: Formula structure spot-check")
    print("=" * 60)

    structure_ok = True
    if rows_data:
        rd0 = rows_data[0]
        u_f = rd0["status_formula"] or ""
        x_f = rd0["risk_formula"] or ""
        y_f = rd0["action_formula"] or ""

        # U formula should reference T (override), S, Q, O, M, K, J columns
        u_checks = [
            ("Override ref (T)", "T5" in u_f or "T{" in u_f),
            ("11-결과등록완료 literal", "11-결과등록완료" in u_f),
            ("01-계획서미제출 literal", "01-계획서미제출" in u_f),
            ("K=Approved check", "Approved" in u_f),
        ]
        for label, passed in u_checks:
            if not passed:
                structure_ok = False
            print(f"  {'✓' if passed else '✗'} U formula: {label}")

        # X formula should reference U (status), W (days), I (plan due)
        x_checks = [
            ("06-BIW check", "06-BIW" in x_f or "BIW" in x_f),
            ("DONE literal", "DONE" in x_f),
            ("CRITICAL literal", "CRITICAL" in x_f),
            ("OVERDUE literal", "OVERDUE" in x_f),
            ("WARNING literal", "WARNING" in x_f),
        ]
        for label, passed in x_checks:
            if not passed:
                structure_ok = False
            print(f"  {'✓' if passed else '✗'} X formula: {label}")

        # Y formula should reference U (status)
        y_checks = [
            ("— 완료 literal", "완료" in y_f),
            ("계획서 제출 대기", "대기" in y_f),
            ("12-조건부승인검토", "12-조건부승인검토" in y_f),
        ]
        for label, passed in y_checks:
            if not passed:
                structure_ok = False
            print(f"  {'✓' if passed else '✗'} Y formula: {label}")

    if structure_ok:
        print(f"\n  [PASS] All formula structure checks passed")
    else:
        print(f"\n  [WARN] Some formula structure checks failed — review formulas")

    # ── 5. Conditional formatting ──────────────────────────────────────
    print(f"\n{'='*60}")
    print("CHECK 5: Conditional formatting rules")
    print("=" * 60)

    cf_rules = ws.conditional_formatting
    rule_count = len(list(cf_rules))
    print(f"  Tracker CF rules: {rule_count}")
    for cf in cf_rules:
        range_str = str(cf)
        rules_in_range = len(cf.rules)
        print(f"    {range_str:35s}  Rules: {rules_in_range}")

    # Expected: U(12 status) + X(6 risk) + W(2 days) + V(1 databar) + 5 plan/actual pairs = 26 rules in 9 ranges
    expected_cf_ranges = 9
    if rule_count == expected_cf_ranges:
        print(f"\n  [PASS] {rule_count} CF ranges (expected {expected_cf_ranges})")
    else:
        print(f"\n  [WARN] {rule_count} CF ranges (expected {expected_cf_ranges})")

    # Dashboard CF
    dash_ws = wb["Dashboard 대시보드"] if "Dashboard 대시보드" in wb.sheetnames else None
    if dash_ws:
        dash_cf = len(list(dash_ws.conditional_formatting))
        print(f"  Dashboard CF rules: {dash_cf}")

    # ── 6. Per-row simulation report ───────────────────────────────────
    print(f"\n{'='*60}")
    print("CHECK 6: Per-row simulation report (first 30 rows)")
    print("=" * 60)
    print(f"  {'Row':>4s} | {'Vehicle':8s} | {'Part':22s} | {'ExpStatus':25s} | {'ExpRisk':10s}")
    print(f"  {'-'*4} | {'-'*8} | {'-'*22} | {'-'*25} | {'-'*10}")

    for rd in rows_data[:30]:
        exp_risk = compute_expected_risk(rd["exp_status"], rd["plan_due"], rd["days_to_deadline"])
        print(f"  {rd['row_num']:>4} | {str(rd['vehicle'])[:8]:8s} | {str(rd['part'])[:22]:22s} | {rd['exp_status']:25s} | {exp_risk}")

    if len(rows_data) > 30:
        print(f"  ... ({len(rows_data) - 30} more rows)")

    # ── 7. Alarm gap detection ─────────────────────────────────────────
    print(f"\n{'='*60}")
    print("CHECK 7: Alarm gap detection (formula content)")
    print("=" * 60)

    alarm_gaps = []
    for rd in rows_data:
        formula = rd["risk_formula"]
        if not formula or not isinstance(formula, str):
            continue

        # BIW check
        if rd["exp_status"] == "06-BIW생산중단" and "06-BIW" not in formula:
            alarm_gaps.append((rd["row"], rd["exp_status"], "Risk formula missing BIW check"))

        # 01 overdue check
        if rd["exp_status"] == "01-계획서미제출" and "01-" not in formula:
            alarm_gaps.append((rd["row"], rd["exp_status"], "Risk formula missing 01 overdue check"))

    should_alarm = [rd for rd in rows_data
                    if compute_expected_risk(rd["exp_status"], rd["plan_due"], rd["days_to_deadline"])
                    in ("CRITICAL", "OVERDUE", "ACTION")]
    for rd in should_alarm:
        exp_risk = compute_expected_risk(rd["exp_status"], rd["plan_due"], rd["days_to_deadline"])
        print(f"  Row {rd['row']:2d} | {rd['exp_status']:25s} | {exp_risk:10s} | ALARM")

    if alarm_gaps:
        print(f"\n  [WARN] Potential alarm gaps:")
        for row, status, msg in alarm_gaps:
            print(f"    Row {row}: {status} — {msg}")
    else:
        print(f"\n  [PASS] No alarm gaps detected")

    # ── Summary ────────────────────────────────────────────────────────
    print(f"\n{'='*80}")
    print("VALIDATION SUMMARY")
    print(f"{'='*80}")
    all_pass = True

    checks = [
        ("Sheet structure (5 sheets, 3 tables)", len(wb.sheetnames) == 5 and tables_ok),
        ("Column headers (25 KR)", headers_ok),
        (f"All 12 states in sim data", not missing_states),
        (f"Formula syntax ({formulas_checked} checked)", formula_errors == 0),
        ("Formula structure", structure_ok),
        (f"CF rules ({rule_count} ranges)", rule_count == expected_cf_ranges),
        (f"Data rows ({len(rows_data)})", len(rows_data) == 66),
        ("No alarm gaps", len(alarm_gaps) == 0),
    ]

    for label, passed in checks:
        status = "PASS" if passed else "FAIL"
        if not passed:
            all_pass = False
        print(f"  [{status}] {label}")

    if all_pass:
        print(f"\n  >>> ALL CHECKS PASSED <<<")
    else:
        print(f"\n  >>> SOME CHECKS FAILED — review above <<<")


if __name__ == "__main__":
    main()
