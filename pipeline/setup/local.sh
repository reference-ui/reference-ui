#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM="$(uname -s)"

case "$PLATFORM" in
  Darwin)
    exec bash "$SCRIPT_DIR/macos.sh" "$@"
    ;;
  *)
    echo "Unsupported platform for pipeline/setup/local.sh: $PLATFORM" >&2
    echo "Add a platform-specific setup script under pipeline/setup/ before using setup:local here." >&2
    exit 1
    ;;
esac