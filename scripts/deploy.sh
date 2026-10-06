#!/usr/bin/env bash
# Release-Skript: baut das Projekt und deployed dist/ auf den gh-pages-Branch.
# Voraussetzung: sauberer git-Zustand auf main (Commit vorher pushen).
set -euo pipefail

cd "$(dirname "$0")/.."
export PATH="$PWD/node_modules/.bin:$PATH"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Abbruch: es gibt uncommittete Änderungen. Erst committen/pushen."
  exit 1
fi

SOURCE_BRANCH=$(git branch --show-current)

echo "→ Build …"
CI=true npm run build > /dev/null

echo "→ Wechsle zu gh-pages …"
git checkout -q gh-pages
git rm -rf . > /dev/null 2>&1 || true
git clean -fdq

echo "→ Kopiere dist/ …"
cp -R dist/. .
touch .nojekyll

git add -A
if git diff --cached --quiet; then
  echo "→ Keine Änderungen, nichts zu deployen."
else
  git commit -q -m "Deploy: $(date '+%Y-%m-%d %H:%M')"
  git push -q origin gh-pages
  echo "→ Gepusht: https://ralfarminkirchner-netizen.github.io/traumaatlas/"
fi

git checkout -q "$SOURCE_BRANCH"
echo "→ Fertig (zurück auf $SOURCE_BRANCH)."
