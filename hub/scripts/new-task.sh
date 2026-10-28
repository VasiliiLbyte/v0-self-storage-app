#!/usr/bin/env bash
# Create a task file in hub/tasks/ from a template.
# Usage:
#   bash hub/scripts/new-task.sh task     SEC-BOOKING-PRICE
#   bash hub/scripts/new-task.sh incident INC-LOGOUT
set -eo pipefail

HUB="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KIND="${1:-}"
ID="${2:-}"
DATE="$(date +%F)"

usage() {
  sed -n '3,5p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  exit 1
}

[ -n "$KIND" ] && [ -n "$ID" ] || usage
[[ "$ID" =~ ^[A-Z0-9][A-Z0-9-]*$ ]] || { echo "ID — заглавные латинские буквы, цифры и дефисы: SEC-BOOKING-PRICE" >&2; exit 1; }

case "$KIND" in
  task)     TPL=TASK.md;     OUT="$DATE-$ID.task.md" ;;
  incident) TPL=INCIDENT.md; OUT="$DATE-$ID.incident.md" ;;
  *) usage ;;
esac

DEST="$HUB/tasks/$OUT"
[ -e "$DEST" ] && { echo "Уже существует: hub/tasks/$OUT" >&2; exit 1; }

ID="$ID" DATE="$DATE" perl -pe \
  's/\{\{ID\}\}/$ENV{ID}/g; s/\{\{DATE\}\}/$ENV{DATE}/g' \
  "$HUB/templates/$TPL" > "$DEST"

echo "hub/tasks/$OUT"
