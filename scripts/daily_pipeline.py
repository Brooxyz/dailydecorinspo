"""Single zero-token orchestrator for Daily Decor Inspo storefront maintenance."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

STOREFRONT_ROOT = Path(__file__).resolve().parent.parent
ENV_LOCAL_PATH = STOREFRONT_ROOT / ".env.local"


def load_env_local() -> dict[str, str]:
    """Read key=value pairs from .env.local without printing any secrets."""
    env_vars: dict[str, str] = {}
    if not ENV_LOCAL_PATH.exists():
        return env_vars
    for raw_line in ENV_LOCAL_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env_vars[k.strip()] = v.strip()
    return env_vars


def run_step(label: str, cmd: list[str] | str, shell: bool = False) -> int:
    """Run a pipeline command inside storefront/ and stream concise output."""
    print(f"\n--- [{label}] ---")
    proc = subprocess.run(cmd, cwd=STOREFRONT_ROOT, shell=shell)
    return proc.returncode


def check_pinterest_account() -> int:
    """Run a single GET /v5/user_account check against Pinterest production API."""
    env_vars = load_env_local()
    token = os.environ.get("PINTEREST_ACCESS_TOKEN") or env_vars.get("PINTEREST_ACCESS_TOKEN")
    if not token:
        print("[pinterest] PINTEREST_ACCESS_TOKEN not found in .env.local or environment.")
        return 1

    req = urllib.request.Request(
        "https://api.pinterest.com/v5/user_account",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8", errors="ignore")
            print(f"[pinterest] HTTP {resp.status} OK -> {body[:200]}")
            return 0
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="ignore")
        print(f"[pinterest] HTTP {exc.code}: {err_body[:200]}")
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"[pinterest] Connection failed: {exc}")
        return 1


def main() -> int:
    """Execute image optimization, pin generation, RSS/CSV feeds, audit, and optional build."""
    parser = argparse.ArgumentParser(description="Daily Decor Inspo zero-token pipeline.")
    parser.add_argument("--online", action="store_true", help="Run online link checks inside auditor.")
    parser.add_argument("--build", action="store_true", help="Run Next.js static export build.")
    parser.add_argument("--check-pinterest", action="store_true", help="Check Pinterest API account status.")
    args = parser.parse_args()

    py = sys.executable

    if run_step("1/4 Optimize Images", [py, "scripts/optimize_images.py"]) != 0:
        return 1

    if run_step("2/4 Generate Pins (Sharp)", ["node", "scripts/generate-pins.mjs"]) != 0:
        return 1

    # Extra fresh pins (collage / zoom / product) + manifest for tools/schedule.py extras
    if run_step("2b/4 Generate Extra Pins", ["node", "scripts/generate-extra-pins.mjs"]) != 0:
        return 1

    if run_step("3/4 Generate Pinterest RSS & CSV", [py, "scripts/generate_pinterest_feeds.py"]) != 0:
        return 1

    audit_cmd = [py, "scripts/audit_storefront.py"]
    if args.online:
        audit_cmd.append("--online")
    if run_step("4/4 Storefront Audit", audit_cmd) != 0:
        return 1

    if args.build:
        build_rc = run_step("5/5 Next.js Static Build", 'cmd /c "npm run build"', shell=True)
        if build_rc != 0:
            return build_rc

    if args.check_pinterest:
        run_step("Optional: Pinterest API Check", [py, "-c", "pass"])
        check_pinterest_account()

    print("\n[daily_pipeline] All requested steps completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
