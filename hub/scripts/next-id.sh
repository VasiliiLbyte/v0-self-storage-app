#!/usr/bin/env bash
# Print the next free sequential ID: DEP-NNN (deploys), D-NNN (decisions), INC-NNN (incidents).
# Usage: bash hub/scripts/next-id.sh DEP
set -eo pipefail

HUB="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREFIX="${1:-}"
case "$PREFIX" in
  DEP|D|INC) ;;
  *) echo "Usage: bash hub/scripts/next-id.sh DEP|D|INC" >&2; exit 1 ;;
esac

cd "$HUB"
max=$({ grep -rhowE "${PREFIX}-[0-9]{3,}" \
          PROGRESS.md DECISIONS.md DEPLOY.md tasks archive 2>/dev/null || true; } |
      awk -F- '{ n = $NF + 0; if (n > m) m = n } END { print m + 0 }')

printf '%s-%03d\n' "$PREFIX" "$((max + 1))"
