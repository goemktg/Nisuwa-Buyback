#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
UPGRADE_SCRIPT="$SCRIPT_DIR/upgrade_ai.py"

if command -v python3 >/dev/null 2>&1; then
  UPGRADE_PYTHON_CMD="python3" exec python3 "$UPGRADE_SCRIPT" "$@"
fi

if command -v python >/dev/null 2>&1; then
  UPGRADE_PYTHON_CMD="python" exec python "$UPGRADE_SCRIPT" "$@"
fi

echo "ERROR: Python runtime not found. Tried: python3, python" >&2
exit 1
