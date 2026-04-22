#!/usr/bin/env bash

set -euo pipefail

DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --)
      ;;
    --dry-run)
      DRY_RUN=1
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

info() {
  printf '[pipeline/setup] %s\n' "$1"
}

warn() {
  printf '[pipeline/setup] %s\n' "$1" >&2
}

run_cmd() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf '[dry-run]'
    printf ' %q' "$@"
    printf '\n'
    return 0
  fi

  "$@"
}

require_brew() {
  if command -v brew >/dev/null 2>&1; then
    return 0
  fi

  warn 'Homebrew is required for the current macOS setup flow.'
  warn 'Install Homebrew first, then rerun pnpm setup:local.'
  exit 1
}

ensure_command_line_tools() {
  if pkgutil --pkg-info=com.apple.pkg.CLTools_Executables >/dev/null 2>&1; then
    info 'Xcode Command Line Tools already installed.'
    return 0
  fi

  warn 'Xcode Command Line Tools are not installed.'
  warn 'Launching the Apple installer now. This step is interactive and may open a system prompt.'
  run_cmd xcode-select --install || true
  warn 'After the Command Line Tools installation completes, rerun pnpm setup:local.'
  exit 1
}

ensure_formula() {
  local formula="$1"
  local command_name="$2"

  if command -v "$command_name" >/dev/null 2>&1; then
    info "$command_name already installed."
    return 0
  fi

  info "Installing $formula..."
  run_cmd brew install "$formula"
}

ensure_colima_started() {
  if ! command -v colima >/dev/null 2>&1; then
    warn 'colima was not found after installation.'
    exit 1
  fi

  local status_output
  status_output="$(colima status 2>/dev/null || true)"
  if printf '%s' "$status_output" | grep -qi '^status:.*running'; then
    info 'colima already running.'
    return 0
  fi

  info 'Starting colima...'
  run_cmd colima start
}

main() {
  info 'Bootstrapping local macOS pipeline dependencies.'
  require_brew
  ensure_command_line_tools
  ensure_formula dagger/tap/dagger dagger
  ensure_formula colima colima
  ensure_formula docker docker
  ensure_colima_started
  info 'Local pipeline setup complete.'
}

main