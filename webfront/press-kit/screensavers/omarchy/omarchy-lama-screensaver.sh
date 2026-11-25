#!/usr/bin/env bash
# Omarchy / Hyprland video screensaver launcher for the Lama Apps collection.
#
# Usage:
#   ./omarchy-lama-screensaver.sh                 # Random Lama MP4 fullscreen via mpv
#   ./omarchy-lama-screensaver.sh 01              # Play a specific screensaver by prefix
#   ./omarchy-lama-screensaver.sh --terminal      # Play inside an Omarchy terminal (mpv --vo=tct)
#
# Exits immediately on any keypress or mouse click (q / ESC / Space / click).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCREENSAVER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

MODE="gui"
FILTER=""

for arg in "$@"; do
  case "$arg" in
    --terminal|-t) MODE="terminal" ;;
    *) FILTER="$arg" ;;
  esac
done

mapfile -t VIDEOS < <(find "$SCREENSAVER_DIR" -maxdepth 1 -type f -name "${FILTER}*.mp4" | sort)
if [[ ${#VIDEOS[@]} -eq 0 ]]; then
  echo "No matching Lama screensaver MP4s found in $SCREENSAVER_DIR" >&2
  exit 1
fi

PICK="${VIDEOS[$((RANDOM % ${#VIDEOS[@]}))]}"

if [[ "$MODE" == "terminal" ]]; then
  exec mpv \
    --vo=tct \
    --no-audio \
    --loop-file=inf \
    --really-quiet \
    "$PICK"
else
  exec mpv \
    --fs \
    --no-audio \
    --loop-file=inf \
    --no-osd-bar \
    --osd-level=0 \
    --cursor-autohide=always \
    --input-default-bindings=no \
    --input-conf=<(printf 'ANY_UNICODE quit\nESC quit\nENTER quit\nSPACE quit\nMBTN_LEFT quit\nMBTN_RIGHT quit\n') \
    --really-quiet \
    "$PICK"
fi
