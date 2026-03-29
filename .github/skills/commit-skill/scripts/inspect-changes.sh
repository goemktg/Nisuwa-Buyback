#!/usr/bin/env sh
set -eu

echo "=== GIT STATUS ==="
git status --short

echo
echo "=== DIFF STATS (staged) ==="
git --no-pager diff --cached --stat

echo
echo "=== DIFF STATS (unstaged) ==="
git --no-pager diff --stat

echo
echo "=== NAME STATUS (HEAD) ==="
git --no-pager diff --name-status HEAD

echo
echo "=== CURRENT BRANCH ==="
git rev-parse --abbrev-ref HEAD
