#!/bin/bash
# Bilibili Favorites Downloader Script
# Requires: BBDown (dotnet tool install --global BBDown)

# Configuration
FAV_URL="https://space.bilibili.com/YOUR_UID/favlist?fid=YOUR_FAV_ID"
OUTPUT_DIR="./bilibili_downloads"
QUALITY="4K"  # Options: 4K, 1080P60, 1080P+, 1080P, 720P60, 720P, 480P, 360P

# Create output directory
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# Login first (run once)
# BBDown login

# Download entire favorites
BBDown -p -q "$QUALITY" --work-dir "$OUTPUT_DIR" "$FAV_URL"

echo "Download complete! Files saved to: $OUTPUT_DIR"
