"""
switch_db.py
============
Quickly switch DATABASE_URL in .env between Supabase and local SQLite.

Usage:
    python switch_db.py local    # switch to local SQLite (qltb_local.db)
    python switch_db.py supa     # switch back to Supabase
    python switch_db.py status   # show current connection

Run from the backend/ directory.
"""

import re
import sys
from pathlib import Path

ENV_FILE = Path(".env")

SUPABASE_MARKER = "supabase"
SQLITE_URL = "sqlite:///./qltb_local.db"


def read_env() -> str:
    return ENV_FILE.read_text(encoding="utf-8") if ENV_FILE.exists() else ""


def get_current_url(content: str) -> str:
    match = re.search(r"^DATABASE_URL=(.+)$", content, re.MULTILINE)
    return match.group(1).strip() if match else "(not found)"


def set_url(content: str, new_url: str) -> str:
    """Replace the active DATABASE_URL line."""
    # Comment out any existing DATABASE_URL lines, then add new one
    lines = content.splitlines()
    new_lines = []
    replaced = False
    for line in lines:
        if line.startswith("DATABASE_URL="):
            if not replaced:
                new_lines.append(f"DATABASE_URL={new_url}")
                replaced = True
            else:
                new_lines.append(f"# {line}")  # comment out duplicates
        else:
            new_lines.append(line)
    if not replaced:
        new_lines.append(f"DATABASE_URL={new_url}")
    return "\n".join(new_lines) + "\n"


def cmd_status():
    content = read_env()
    url = get_current_url(content)
    if SUPABASE_MARKER in url:
        mode = "☁️  SUPABASE (production)"
    elif "sqlite" in url:
        mode = "💾 SQLite LOCAL"
    else:
        mode = "❓ Unknown"
    print(f"Chế độ hiện tại: {mode}")
    print(f"URL: {url[:80]}{'...' if len(url) > 80 else ''}")


def cmd_local():
    content = read_env()
    current = get_current_url(content)
    if "sqlite" in current and "local" in current:
        print("[OK] Đã đang dùng SQLite local rồi.")
        return

    # Backup Supabase URL as comment if not already backed up
    if SUPABASE_MARKER in current and "# SUPABASE_BACKUP" not in content:
        content = f"# SUPABASE_BACKUP={current}\n" + content

    new_content = set_url(content, SQLITE_URL)
    ENV_FILE.write_text(new_content, encoding="utf-8")
    print(f"[OK] Đã chuyển sang SQLite local: {SQLITE_URL}")
    print("     Restart backend để áp dụng.")


def cmd_supa():
    content = read_env()
    current = get_current_url(content)
    if SUPABASE_MARKER in current:
        print("[OK] Đã đang dùng Supabase rồi.")
        return

    # Try to restore from backup comment
    match = re.search(r"^# SUPABASE_BACKUP=(.+)$", content, re.MULTILINE)
    if match:
        supa_url = match.group(1).strip()
        new_content = set_url(content, supa_url)
        ENV_FILE.write_text(new_content, encoding="utf-8")
        print(f"[OK] Đã khôi phục Supabase URL.")
        print("     Restart backend để áp dụng.")
    else:
        print("[ERROR] Không tìm thấy Supabase URL backup trong .env")
        print("        Hãy thêm thủ công: DATABASE_URL=<supabase_url>")


# ── Main ──────────────────────────────────────────────────────────────────────
if len(sys.argv) < 2:
    print(__doc__)
    sys.exit(0)

cmd = sys.argv[1].lower()
if cmd in ("local", "sqlite"):
    cmd_local()
elif cmd in ("supa", "supabase", "prod"):
    cmd_supa()
elif cmd == "status":
    cmd_status()
else:
    print(f"Lệnh không hợp lệ: '{cmd}'. Dùng: local | supa | status")
    sys.exit(1)
