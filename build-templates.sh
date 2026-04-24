#!/usr/bin/env bash
# build-templates.sh
#
# Builds all game template projects by calling yarn commands in template-projects,
# then copies the output into the builder's templates directory.
#
# Usage:
#   ./build-templates.sh              # build all games
#   ./build-templates.sh group-sort   # build a single game by id

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_PROJECTS="$REPO_ROOT/template-projects"
BUILDER_TEMPLATES="$REPO_ROOT/builder-projects/electron-app-mui/templates"

# ── Game list ─────────────────────────────────────────────────────────────────
# Add a new row here when you add a new game template project.
#   Format: "<game_id>|<game_id>" (project path matches game id)
GAMES=(
  "group-sort"
  "plane-quiz"
  "balloon-letter-picker"
  "pair-matching"
  "word-search"
  "whack-a-mole"
  "labelled-diagram"
  "find-the-treasure"
  "jumping-frog"
  # "my-new-game"
)

# ── Helpers ───────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[ OK ]\033[0m  $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
err()   { echo -e "\033[1;31m[ERR ]\033[0m  $*" >&2; }

# ── Main ─────────────────────────────────────────────────────────────────────
FILTER="${1:-}"  # optional: only build this game_id

# Change to template-projects directory
cd "$TEMPLATE_PROJECTS"

# Check if yarn is available
if ! command -v yarn &> /dev/null; then
    err "yarn is not installed. Run: corepack enable && corepack prepare yarn@4.13.0 --activate"
    exit 1
fi

# Install dependencies
info "Installing dependencies..."
if ! yarn install; then
    err "Failed to install dependencies"
    exit 1
fi

# Build shared libraries first
info "Building shared libraries..."
if ! yarn build:shared; then
    err "Failed to build shared libraries"
    exit 1
fi

ok "Shared libraries built successfully"
echo ""

# Build each game template
success_list=()
warning_list=()
failed_list=()

for game_id in "${GAMES[@]}"; do
  # If a filter was supplied, skip non-matching games
  if [[ -n "$FILTER" && "$game_id" != "$FILTER" ]]; then
    continue
  fi

  info "Building '$game_id'"

  build_success=false

  # Build using yarn workspace — capture output, print after
  build_output=""
  set +e
  build_output=$(yarn workspace "$game_id" run build 2>&1)
  build_rc=$?
  set -e
  echo "$build_output"

  if [[ $build_rc -eq 0 ]]; then
    # Primary build succeeded
    success_list+=("$game_id")
    build_success=true
  else
    # Build failed, try fallback: _build then vite build
    warn "Primary build failed for $game_id, attempting fallback..."

    fallback_ok=false

    # Try _build
    set +e
    fb_output=$(yarn workspace "$game_id" run _build 2>&1)
    fb_rc=$?
    set -e
    echo "$fb_output"
    if [[ $fb_rc -eq 0 ]]; then
      fallback_ok=true
    fi

    # Try vite build
    set +e
    vb_output=$(yarn workspace "$game_id" run vite build 2>&1)
    vb_rc=$?
    set -e
    echo "$vb_output"
    if [[ $vb_rc -eq 0 ]]; then
      fallback_ok=true
    fi

    if [[ "$fallback_ok" == true ]]; then
      warning_list+=("$game_id")
      build_success=true
    else
      failed_list+=("$game_id")
    fi
  fi

  if [[ "$build_success" == true ]]; then
    # Copy dist -> builder templates/<game_id>/game/
    target_dir="$BUILDER_TEMPLATES/$game_id/game"
    template_dir="$BUILDER_TEMPLATES/$game_id"
    abs_project="$TEMPLATE_PROJECTS/$game_id"

    info "Copying dist -> $target_dir"
    mkdir -p "$target_dir"
    rm -rv "$target_dir/" 2>/dev/null || true
    cp -rv "$abs_project/dist/." "$target_dir/"

    # Copy meta.json if it exists in source (always overwrite)
    if [[ -f "$abs_project/meta.json" ]]; then
      cp -v "$abs_project/meta.json" "$template_dir/"
    fi

    # Copy thumbnail.* if it exists in source (always overwrite)
    for thumb in "$abs_project"/thumbnail.*; do
      if [[ -f "$thumb" ]]; then
        cp -v "$thumb" "$template_dir/"
      fi
    done

    ok "Done: $game_id"
  fi
done

echo ""
echo "=========================================="
echo "          BUILD SUMMARY"
echo "=========================================="

if [[ ${#success_list[@]} -gt 0 ]]; then
  echo ""
  ok "BUILT SUCCESSFULLY (${#success_list[@]}):"
  for item in "${success_list[@]}"; do
    echo "  ✓ $item"
  done
fi

if [[ ${#warning_list[@]} -gt 0 ]]; then
  echo ""
  warn "BUILT VIA FALLBACK (${#warning_list[@]}):"
  for item in "${warning_list[@]}"; do
    echo "  ⚠ $item"
  done
fi

if [[ ${#failed_list[@]} -gt 0 ]]; then
  echo ""
  err "FAILED (${#failed_list[@]}):"
  for item in "${failed_list[@]}"; do
    echo "  ✗ $item"
  done
fi

echo ""
echo "=========================================="
total=$(( ${#success_list[@]} + ${#warning_list[@]} + ${#failed_list[@]} ))
echo "Total: $total | Built: ${#success_list[@]} | Fallback: ${#warning_list[@]} | Failed: ${#failed_list[@]}"
echo "=========================================="

if [[ ${#failed_list[@]} -gt 0 ]]; then
  exit 1
fi
