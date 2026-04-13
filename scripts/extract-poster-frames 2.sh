#!/bin/bash
# Extract poster frames from zodiac videos
# Run this once after cloning: bash scripts/extract-poster-frames.sh
# Requires: ffmpeg (brew install ffmpeg)

set -e

VIDEOS_DIR="public/videos/zodiac"
POSTERS_DIR="public/images/posters"

mkdir -p "$POSTERS_DIR"

SIGNS=(aquarius aries cancer capricorn gemini leo libra pisces sagittarius scorpio space taurus virgo)

for sign in "${SIGNS[@]}"; do
  input="${VIDEOS_DIR}/${sign}.mp4"
  output="${POSTERS_DIR}/${sign}.jpg"

  if [ -f "$input" ]; then
    echo "Extracting poster for $sign..."
    ffmpeg -y -i "$input" -vframes 1 -q:v 2 "$output"
    echo "  -> $output"
  else
    echo "  SKIP: $input not found"
  fi
done

echo "Done. Poster frames saved to $POSTERS_DIR"
