#!/usr/bin/env bash
# Repro: SERVICE_UNAVAILABLE after login when D1 has no tables.
# Red when profiles table is missing; green after migration.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$ROOT/dist/server/wrangler.json"
SQL="$ROOT/drizzle/0000_swift_jamie_braddock.sql"
cd "$ROOT"

if [[ ! -f "$CFG" ]]; then
  echo "missing dist/server/wrangler.json — run npm run build first" >&2
  exit 2
fi

echo "== drop local profiles if present =="
npx wrangler d1 execute DB --local --config "$CFG" --command "DROP TABLE IF EXISTS profiles;" >/dev/null 2>&1 || true

echo "== query without schema (expect fail) =="
if npx wrangler d1 execute DB --local --config "$CFG" --command "SELECT 1 FROM profiles LIMIT 1;" >/tmp/fl-d1-red.txt 2>&1; then
  echo "UNEXPECTED: profiles readable before migration"
  cat /tmp/fl-d1-red.txt
  exit 1
fi
echo "RED confirmed: no profiles table"
grep -i "no such table\|error\|Failed" /tmp/fl-d1-red.txt | head -5 || true

echo "== apply migration =="
# Strip drizzle breakpoints for sqlite exec
TMP=$(mktemp)
sed 's/--> statement-breakpoint//g' "$SQL" > "$TMP"
npx wrangler d1 execute DB --local --config "$CFG" --file "$TMP"
rm -f "$TMP"

echo "== query after migration (expect ok) =="
npx wrangler d1 execute DB --local --config "$CFG" --command "SELECT name FROM sqlite_master WHERE type='table' AND name='profiles';" >/tmp/fl-d1-green.txt 2>&1
if ! grep -q profiles /tmp/fl-d1-green.txt; then
  echo "UNEXPECTED: profiles still missing after migration"
  cat /tmp/fl-d1-green.txt
  exit 1
fi
echo "GREEN: profiles table exists"
exit 0
