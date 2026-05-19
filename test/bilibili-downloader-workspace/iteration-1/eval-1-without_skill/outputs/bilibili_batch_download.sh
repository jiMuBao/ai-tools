#!/bin/bash
# bilibili_batch_download.sh
# Batch download script for Bilibili channel videos

CHANNEL_URL="https://space.bilibili.com/123456789"
OUTPUT_DIR="./downloads"

mkdir -p "$OUTPUT_DIR"

echo "Starting download from: $CHANNEL_URL"
echo "Output directory: $OUTPUT_DIR"

yt-dlp \
  --output "$OUTPUT_DIR/%(title)s.%(ext)s" \
  --format "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" \
  --write-thumbnail \
  --write-description \
  "$CHANNEL_URL"

echo "Download completed. Files saved to: $OUTPUT_DIR"
