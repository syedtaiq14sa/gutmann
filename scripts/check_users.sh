#!/usr/bin/env bash
# =============================================================================
# check_users.sh — Check user existence in the Gutmann PostgreSQL database
# =============================================================================
#
# Usage
# -----
#   # Provide the connection string directly:
#   DATABASE_URL="postgres://user:password@host:5432/dbname" bash scripts/check_users.sh
#
#   # Or export it first, then run:
#   export DATABASE_URL="<your-connection-string>"
#   bash scripts/check_users.sh
#
#   # Check a specific email address:
#   CHECK_EMAIL="ceo@gutmann.com" bash scripts/check_users.sh
#
# Where to get DATABASE_URL
# -------------------------
#   Supabase : Dashboard → your project → Settings → Database → Connection string
#              (use the "URI" format starting with "postgresql://")
#   Render   : Dashboard → your PostgreSQL service → Info → Internal Database URL
#
# Requirements
# ------------
#   - psql (PostgreSQL client) must be installed
#   - The DATABASE_URL environment variable must be set
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Helper: print a section header
# ---------------------------------------------------------------------------
header() {
    echo ""
    echo "============================================================"
    echo "  $*"
    echo "============================================================"
}

# ---------------------------------------------------------------------------
# Validate prerequisites
# ---------------------------------------------------------------------------
if ! command -v psql &>/dev/null; then
    echo "ERROR: 'psql' is not installed or not in PATH."
    echo "  Supabase: use the Supabase SQL Editor instead (no psql needed)."
    echo "  Render  : psql is pre-installed in the Render shell."
    exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "ERROR: DATABASE_URL is not set."
    echo ""
    echo "  Export it before running this script:"
    echo "    export DATABASE_URL=\"postgres://user:password@host:5432/dbname\""
    echo ""
    echo "  Or prefix the command:"
    echo "    DATABASE_URL=\"<url>\" bash scripts/check_users.sh"
    exit 1
fi

# ---------------------------------------------------------------------------
# 1. List all users
# ---------------------------------------------------------------------------
header "All users in public.users"

psql "$DATABASE_URL" --no-password --tuples-only --pset=border=2 <<'SQL'
SELECT
    id,
    name,
    email,
    role,
    is_active,
    to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at
FROM   public.users
ORDER  BY created_at DESC;
SQL

# ---------------------------------------------------------------------------
# 2. Count users
# ---------------------------------------------------------------------------
header "Total user count"

psql "$DATABASE_URL" --no-password --tuples-only --pset=border=2 <<'SQL'
SELECT COUNT(*) AS total_users FROM public.users;
SQL

# ---------------------------------------------------------------------------
# 3. Count by role
# ---------------------------------------------------------------------------
header "User count by role"

psql "$DATABASE_URL" --no-password --tuples-only --pset=border=2 <<'SQL'
SELECT
    role,
    COUNT(*)           AS total,
    COUNT(*) FILTER (WHERE is_active = true)  AS active,
    COUNT(*) FILTER (WHERE is_active = false) AS inactive
FROM   public.users
GROUP  BY role
ORDER  BY role;
SQL

# ---------------------------------------------------------------------------
# 4. (Optional) Check a specific email
# ---------------------------------------------------------------------------
if [[ -n "${CHECK_EMAIL:-}" ]]; then
    header "Checking for email: ${CHECK_EMAIL}"

    # Use psql -v for safe variable substitution (avoids SQL injection)
    RESULT=$(psql "$DATABASE_URL" --no-password --tuples-only --pset=border=2 \
        -v "check_email=${CHECK_EMAIL}" \
        --command "SELECT id, name, email, role, is_active FROM public.users WHERE email = :'check_email';")

    if [[ -z "$(echo "$RESULT" | tr -d '[:space:]|')" ]]; then
        echo "  No user found with email: ${CHECK_EMAIL}"
    else
        echo "$RESULT"
    fi
fi

echo ""
echo "Done."
