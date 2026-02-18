"""
KPI 액션플랜 Excel → SQL INSERT 변환기

Usage:
  python scripts/excel_to_sql.py <엑셀파일경로> [--org-id <org_id>]

Example:
  python scripts/excel_to_sql.py "C:/obsidian/0_Inbox/KPI_액션플랜_양식.xlsx" --org-id "abc-123"
"""
import sys
import json
import io
from datetime import datetime
from pathlib import Path

# Fix encoding on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

try:
    import openpyxl
except ImportError:
    print("openpyxl 필요: pip install openpyxl")
    sys.exit(1)


def read_actions(filepath: str) -> list[dict]:
    """Read action plan rows from Excel '액션플랜' sheet."""
    wb = openpyxl.load_workbook(filepath, data_only=True)
    ws = wb["액션플랜"]

    rows = []
    for row in ws.iter_rows(min_row=5, max_col=17, values_only=True):
        title = row[1]
        if not title or not str(title).strip():
            continue

        milestones = []
        for i in range(5):
            ms = row[12 + i]
            if ms and str(ms).strip():
                milestones.append({
                    "id": f"m{i+1}",
                    "label": str(ms).strip(),
                    "done": False,
                })

        start_date = row[8] or ""
        due_date = row[9] or ""
        if hasattr(start_date, "strftime"):
            start_date = start_date.strftime("%Y-%m-%d")
        if hasattr(due_date, "strftime"):
            due_date = due_date.strftime("%Y-%m-%d")

        output_type = str(row[10] or "").strip()
        description = str(row[3] or "").strip()
        if output_type:
            description = f"[아웃풋: {output_type}] {description}".strip()

        rows.append({
            "parent_kpi": str(row[0] or "").strip(),
            "title": str(title).strip(),
            "emoji": str(row[2] or "🎯").strip(),
            "description": description,
            "owner_name": str(row[4] or "").strip(),
            "target_value": float(row[5]) if row[5] is not None else 100,
            "unit": str(row[6] or "%").strip(),
            "priority": str(row[7] or "medium").strip().lower(),
            "start_date": str(start_date).strip(),
            "due_date": str(due_date).strip(),
            "weight": float(row[11]) if row[11] is not None else 1.0,
            "milestones": milestones,
        })

    return rows


def validate(rows: list[dict]) -> list[str]:
    """Validate rows and return warnings."""
    warnings = []
    parent_groups: dict[str, float] = {}

    for i, r in enumerate(rows, 1):
        if not r["title"]:
            warnings.append(f"[행 {i}] 제목 누락")
        if not r["owner_name"]:
            warnings.append(f"[행 {i}] 담당자 누락: '{r['title']}'")
        if not r["due_date"]:
            warnings.append(f"[행 {i}] 마감일 누락: '{r['title']}'")
        if len(r["milestones"]) < 3:
            warnings.append(f"[행 {i}] 마일스톤 {len(r['milestones'])}개 (최소 3개 필요): '{r['title']}'")
        if r["priority"] not in ("low", "medium", "high", "critical"):
            warnings.append(f"[행 {i}] 우선순위 '{r['priority']}' 유효하지 않음")

        pk = r["parent_kpi"]
        if pk:
            parent_groups[pk] = parent_groups.get(pk, 0) + r["weight"]

    for pk, total in parent_groups.items():
        if abs(total - 1.0) > 0.05:
            warnings.append(f"[가중치] '{pk}' 그룹 합계 = {total:.2f} (1.0 권장)")

    return warnings


def esc(s: str) -> str:
    """Escape single quotes for SQL."""
    return s.replace("'", "''")


def generate_sql(rows: list[dict], org_id: str) -> str:
    """Generate SQL INSERT statements."""
    lines = [
        f"-- KPI 액션플랜 일괄 등록",
        f"-- 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"-- 총 {len(rows)}건",
        "",
    ]

    # Reference queries
    parent_kpis = sorted(set(r["parent_kpi"] for r in rows if r["parent_kpi"]))
    owners = sorted(set(r["owner_name"] for r in rows if r["owner_name"]))

    if parent_kpis:
        lines.append("-- [참조] 상위 KPI → parent_id 매핑 조회:")
        lines.append("-- SELECT id, title FROM kpi_nodes WHERE depth = 1 AND title IN (")
        lines.extend(f"--   '{esc(pk)}'," for pk in parent_kpis)
        lines.append("-- );")
        lines.append("")

    if owners:
        lines.append("-- [참조] 담당자 → owner_id 매핑 조회:")
        lines.append("-- SELECT id, display_name FROM profiles WHERE display_name IN (")
        lines.extend(f"--   '{esc(o)}'," for o in owners)
        lines.append("-- );")
        lines.append("")

    lines.append("BEGIN;")
    lines.append("")

    for i, r in enumerate(rows):
        ms_json = json.dumps(r["milestones"], ensure_ascii=False)

        lines.append(f"-- [{i+1}] {r['title']} (담당: {r['owner_name']})")
        lines.append("INSERT INTO kpi_nodes (")
        lines.append("  id, org_id, parent_id, depth, title, description, emoji,")
        lines.append("  owner_id, target_value, current_value, unit, weight,")
        lines.append("  status, priority, start_date, due_date, milestones, sort_order")
        lines.append(") VALUES (")
        lines.append("  gen_random_uuid(),")
        lines.append(f"  '{esc(org_id)}',")
        lines.append(f"  (SELECT id FROM kpi_nodes WHERE depth = 1 AND title ILIKE '%{esc(r['parent_kpi'])}%' LIMIT 1),")
        lines.append("  2,")
        lines.append(f"  '{esc(r['title'])}',")
        lines.append(f"  '{esc(r['description'])}'," if r["description"] else "  NULL,")
        lines.append(f"  '{esc(r['emoji'])}',")
        lines.append(f"  (SELECT id FROM profiles WHERE display_name = '{esc(r['owner_name'])}' LIMIT 1),")
        lines.append(f"  {r['target_value']},")
        lines.append("  0,")
        lines.append(f"  '{esc(r['unit'])}',")
        lines.append(f"  {r['weight']},")
        lines.append("  'active',")
        lines.append(f"  '{esc(r['priority'])}',")
        lines.append(f"  '{r['start_date']}'," if r["start_date"] else "  NULL,")
        lines.append(f"  '{r['due_date']}'," if r["due_date"] else "  NULL,")
        lines.append(f"  '{esc(ms_json)}'::jsonb,")
        lines.append(f"  {i}")
        lines.append(");")
        lines.append("")

    lines.append("COMMIT;")
    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/excel_to_sql.py <엑셀파일경로> [--org-id <org_id>]")
        print("Example: python scripts/excel_to_sql.py input.xlsx --org-id abc-123")
        sys.exit(1)

    filepath = sys.argv[1]
    org_id = "YOUR_ORG_ID"
    if "--org-id" in sys.argv:
        idx = sys.argv.index("--org-id")
        if idx + 1 < len(sys.argv):
            org_id = sys.argv[idx + 1]

    if not Path(filepath).exists():
        print(f"파일 없음: {filepath}")
        sys.exit(1)

    print(f"읽는 중: {filepath}")
    rows = read_actions(filepath)
    print(f"액션 플랜 {len(rows)}건 발견")

    # Validate
    warnings = validate(rows)
    if warnings:
        print("\n⚠️  검증 경고:")
        for w in warnings:
            print(f"  {w}")
        print()

    # Generate SQL
    sql = generate_sql(rows, org_id)

    # Save
    out_path = str(Path(filepath).with_suffix("")) + "_INSERT.sql"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(sql)

    print(f"✅ SQL 생성 완료: {out_path}")
    print(f"   INSERT 문: {sql.count('INSERT INTO')}건")

    # Preview
    preview_lines = sql.split("\n")[:30]
    print("\n--- Preview ---")
    print("\n".join(preview_lines))
    if len(sql.split("\n")) > 30:
        print("...")


if __name__ == "__main__":
    main()
