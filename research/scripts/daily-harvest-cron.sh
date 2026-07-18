#!/bin/bash
# Glyphie daily harvest — non-interactive part.
# Runs at 06:00 UTC via systemd --user timer.
#
# Fires: fetch-roles.mjs (writes snapshot-YYYY-MM-DD.json + latest.json).
# Emits: research/feeds/roles/health/health-YYYY-MM-DD.json for the next
#        Glyphie heartbeat to pick up and post to chat.
#        research/snapshots/pending-YYYY-MM-DD-diff.json when there IS a
#        role diff since previous snapshot — the agent-spawn wrapper reads
#        this and calls the LLM to synthesise the daily briefing prose.
# Does NOT: commit, push, open PRs, call any LLM, or write to per-company
# feeds — those need agent reasoning ("is this signal or noise?", LLM
# credentials, git identity) and belong in the agent-spawn wrapper.

set -u
cd /root/projects/lobbycat-glyphie || exit 1

DATE=$(date -u +%Y-%m-%d)
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
HEALTH_DIR="research/feeds/roles/health"
mkdir -p "$HEALTH_DIR"
HEALTH="$HEALTH_DIR/health-$DATE.json"
LOG_DIR="/var/log/glyphie"
mkdir -p "$LOG_DIR" 2>/dev/null || true
LOG="$LOG_DIR/daily-$DATE.log"

echo "=== $TS daily harvest starting ===" >> "$LOG"

# Guard: only run once per day (idempotent).
if [ -f "research/feeds/roles/snapshot-$DATE.json" ]; then
  echo "  snapshot-$DATE.json already exists; skipping fetch" >> "$LOG"
  jq -n --arg ts "$TS" --arg date "$DATE" '{ok: true, date: $date, timestamp: $ts, skipped: true, reason: "snapshot exists"}' > "$HEALTH"
  exit 0
fi

# Fetch. --dry writes NO files; we want a real run.
if node research/scripts/fetch-roles.mjs >> "$LOG" 2>&1; then
  SNAP_FILE="research/feeds/roles/snapshot-$DATE.json"
  if [ -f "$SNAP_FILE" ]; then
    TOTAL=$(jq -r '.summary.totalPolicyRoles' "$SNAP_FILE" 2>/dev/null || echo -1)
    NEW=$(jq -r '.summary.newSincePrevious' "$SNAP_FILE" 2>/dev/null || echo -1)
    LDN=$(jq -r '.summary.londonRoles' "$SNAP_FILE" 2>/dev/null || echo -1)
    ERR=$(jq -r '.errors | length' "$SNAP_FILE" 2>/dev/null || echo -1)
    jq -n --arg ts "$TS" --arg date "$DATE" --argjson total "$TOTAL" --argjson new "$NEW" --argjson ldn "$LDN" --argjson err "$ERR" \
      '{ok: true, date: $date, timestamp: $ts, totalPolicyRoles: $total, newSincePrevious: $new, londonRoles: $ldn, errors: $err, snapshot: "research/feeds/roles/snapshot-\($date).json"}' > "$HEALTH"
    echo "  OK: total=$TOTAL new=$NEW london=$LDN errors=$ERR" >> "$LOG"

    # Emit a pending-diff file if there is a real role diff. The
    # agent-spawn wrapper (Techie's piece) reads this, calls the LLM,
    # writes research/snapshots/daily-$DATE.json + latest.json.
    if [ "$NEW" -gt 0 ]; then
      mkdir -p research/snapshots
      PENDING="research/snapshots/pending-$DATE-diff.json"
      if node research/scripts/build-daily-diff.mjs "$DATE" > "$PENDING" 2>>"$LOG"; then
        echo "  DIFF: wrote $PENDING ($NEW new roles → LLM synthesis pending)" >> "$LOG"
      else
        echo "  WARN: build-daily-diff.mjs failed; deleting empty pending file" >> "$LOG"
        rm -f "$PENDING"
      fi
    else
      echo "  DIFF: 0 new roles — no synthesis pending" >> "$LOG"
    fi
  else
    jq -n --arg ts "$TS" --arg date "$DATE" '{ok: false, date: $date, timestamp: $ts, error: "fetch-roles produced no snapshot file"}' > "$HEALTH"
    echo "  FAIL: no snapshot file" >> "$LOG"
    exit 2
  fi
else
  RC=$?
  jq -n --arg ts "$TS" --arg date "$DATE" --argjson rc "$RC" '{ok: false, date: $date, timestamp: $ts, error: "fetch-roles.mjs exited non-zero", exitCode: $rc}' > "$HEALTH"
  echo "  FAIL: fetch-roles exited $RC" >> "$LOG"
  exit $RC
fi

echo "=== $TS done ===" >> "$LOG"
