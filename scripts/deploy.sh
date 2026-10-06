#!/usr/bin/env bash
# Release-Skript: baut das Projekt und deployed dist/ auf den gh-pages-Branch.
# Nutzt ein temporäres git-worktree – main-Arbeitsverzeichnis bleibt unberührt.
# Voraussetzung: sauberer git-Zustand auf main (Änderungen vorher committen/pushen).
set -euo pipefail

cd "$(dirname "$0")/.."
export PATH="$PWD/node_modules/.bin:$PATH"
ROOT=$PWD

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Abbruch: es gibt uncommittete Änderungen. Erst committen/pushen."
  exit 1
fi

echo "→ Build …"
if [ ! -x node_modules/.bin/tsc ]; then
  echo "→ node_modules unvollständig – installiere Abhängigkeiten …"
  npm ci --no-audit --no-fund > /dev/null
fi
CI=true npm run build > /dev/null

TMP=$(mktemp -d /tmp/traumaatlas-pages.XXXXXX)
trap 'git -C "$ROOT" worktree remove --force "$TMP" 2>/dev/null || true; rm -rf "$TMP"' EXIT

echo "→ Temporäres Worktree für gh-pages …"
git worktree add --force "$TMP" gh-pages
cd "$TMP"

git rm -rf . > /dev/null 2>&1 || true
echo "→ Kopiere dist/ …"
cp -R "$ROOT/dist/." .
touch .nojekyll

git add -A
if git diff --cached --quiet; then
  echo "→ Keine Änderungen, nichts zu deployen."
else
  git commit -q -m "Deploy: $(date '+%Y-%m-%d %H:%M')"
  git push -q origin gh-pages
  echo "→ Gepusht: https://ralfarminkirchner-netizen.github.io/traumaatlas/"
fi
