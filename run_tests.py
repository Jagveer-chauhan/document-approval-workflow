#!/usr/bin/env python
"""
Unified Test Runner for Document Approval Workflow
Executes both Django backend tests and React frontend tests in a single command.
"""

import os
import subprocess
import sys
from pathlib import Path

if sys.stdout.encoding != "utf-8" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr.encoding != "utf-8" and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"


def get_python_executable():
    # Prefer virtualenv python if present (checks root and backend directories)
    candidate_paths = [
        ROOT_DIR / ".venv" / "Scripts" / "python.exe",
        BACKEND_DIR / ".venv" / "Scripts" / "python.exe",
        ROOT_DIR / ".venv" / "bin" / "python",
        BACKEND_DIR / ".venv" / "bin" / "python",
    ]
    for path in candidate_paths:
        if path.is_file():
            return str(path)
    return sys.executable



def run_backend_tests():
    print("=" * 60)
    print(" 🧪 RUNNING BACKEND TESTS (Django REST Framework)")
    print("=" * 60)

    py_exe = get_python_executable()
    cmd = [py_exe, "manage.py", "test", "submissions", "accounts", "--noinput", "--verbosity=1"]

    env = os.environ.copy()
    result = subprocess.run(cmd, cwd=str(BACKEND_DIR), env=env)
    return result.returncode == 0


def run_frontend_tests():
    print("\n" + "=" * 60)
    print(" 🧪 RUNNING FRONTEND TESTS (Vitest + React Testing Library)")
    print("=" * 60)

    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    cmd = [npm_cmd, "run", "test"]

    try:
        result = subprocess.run(cmd, cwd=str(FRONTEND_DIR), shell=(sys.platform == "win32"))
        return result.returncode == 0
    except FileNotFoundError:
        # Fallback to direct npx/vitest
        print("Note: npm not directly on PATH, attempting vitest execution...")
        result = subprocess.run(["npx.cmd" if sys.platform == "win32" else "npx", "vitest", "run"], cwd=str(FRONTEND_DIR))
        return result.returncode == 0


def main():
    print("\n🚀 Starting Full Test Suite Execution...\n")

    backend_ok = run_backend_tests()
    frontend_ok = run_frontend_tests()

    print("\n" + "=" * 60)
    print(" 📊 TEST EXECUTION SUMMARY")
    print("=" * 60)
    print(f"  Backend Tests (Django):      {'✅ PASSED' if backend_ok else '❌ FAILED'}")
    print(f"  Frontend Tests (Vitest):     {'✅ PASSED' if frontend_ok else '❌ FAILED'}")
    print("=" * 60 + "\n")

    if backend_ok and frontend_ok:
        print("🎉 ALL TESTS PASSED SUCCESSFULLY!\n")
        sys.exit(0)
    else:
        print("💥 TEST FAILURES DETECTED.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
