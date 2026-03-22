#!/bin/bash

set -e

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Remove watermarks from videos using FFmpeg delogo filter"
  echo ""
  echo "Required options:"
  echo "  -i, --input-dir DIR     Input directory with video files"
  echo "  -o, --output-dir DIR    Output directory for processed videos"
  echo "  -x, --x POS             X position of watermark (from left)"
  echo "  -y, --y POS             Y position of watermark (from top)"
  echo "  -w, --width WIDTH       Width of watermark area"
  echo "  -h, --height HEIGHT     Height of watermark area"
  echo ""
  echo "Optional options:"
  echo "  -p, --preview SECS      Create preview of first N seconds (default: 0, no preview)"
  echo "  -q, --quality CRF       Video quality CRF value (default: 18)"
  echo "  -f, --formats FORMATS   Video extensions to process (default: mp4,mkv,avi,mov,webm)"
  echo "  --skip-preview          Skip preview creation even if -p is set"
  echo ""
  echo "Examples:"
  echo "  $0 -i . -o processed -x 10 -y 10 -w 420 -h 80 -p 5"
  echo "  $0 -i videos/ -o clean/ -x 0 -y 0 -w 300 -h 60 -q 23"
  exit 1
}

INPUT_DIR=""
OUTPUT_DIR=""
X_POS=""
Y_POS=""
WIDTH=""
HEIGHT=""
PREVIEW_SECS=0
CRF=18
FORMATS="mp4,mkv,avi,mov,webm"
SKIP_PREVIEW=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -i|--input-dir)
      INPUT_DIR="$2"
      shift 2
      ;;
    -o|--output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -x|--x)
      X_POS="$2"
      shift 2
      ;;
    -y|--y)
      Y_POS="$2"
      shift 2
      ;;
    -w|--width)
      WIDTH="$2"
      shift 2
      ;;
    -h|--height)
      HEIGHT="$2"
      shift 2
      ;;
    -p|--preview)
      PREVIEW_SECS="$2"
      shift 2
      ;;
    -q|--quality)
      CRF="$2"
      shift 2
      ;;
    -f|--formats)
      FORMATS="$2"
      shift 2
      ;;
    --skip-preview)
      SKIP_PREVIEW=true
      shift
      ;;
    --help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

if [[ -z "$INPUT_DIR" || -z "$OUTPUT_DIR" || -z "$X_POS" || -z "$Y_POS" || -z "$WIDTH" || -z "$HEIGHT" ]]; then
  echo "Error: Missing required options"
  usage
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "Error: ffmpeg not found. Please install ffmpeg first."
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

DELogo_FILTER="delogo=x=${X_POS}:y=${Y_POS}:w=${WIDTH}:h=${HEIGHT}"
IFS=',' read -ra FORMAT_ARRAY <<< "$FORMATS"
FIND_ARGS=""

for fmt in "${FORMAT_ARRAY[@]}"; do
  if [[ -n "$FIND_ARGS" ]]; then
    FIND_ARGS+=" -o"
  fi
  FIND_ARGS+=" -name '*.${fmt}'"
done

VIDEO_FILES=$(eval "find '$INPUT_DIR' -maxdepth 1 -type f $FIND_ARGS" | sort)

if [[ -z "$VIDEO_FILES" ]]; then
  echo "No video files found in $INPUT_DIR"
  exit 1
fi

VIDEO_COUNT=$(echo "$VIDEO_FILES" | wc -l)
echo "Found $VIDEO_COUNT video(s) to process"
echo "Delogo filter: $DELogo_FILTER"
echo "Quality: CRF $CRF"
echo ""

MANIFEST_FILE="$OUTPUT_DIR/manifest.txt"
echo "# Watermark Removal Manifest" > "$MANIFEST_FILE"
echo "# Generated: $(date +%Y-%m-%d)" >> "$MANIFEST_FILE"
echo "# Filter: $DELogo_FILTER" >> "$MANIFEST_FILE"
echo "# Quality: CRF $CRF" >> "$MANIFEST_FILE"
echo "" >> "$MANIFEST_FILE"

FIRST_VIDEO=true

while IFS= read -r video; do
  FILENAME=$(basename "$video")
  OUTPUT_PATH="$OUTPUT_DIR/$FILENAME"
  
  echo "Processing: $FILENAME"
  
  HAS_AUDIO=$(ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "$video" 2>/dev/null | head -1)
  
  AUDIO_CMD=""
  if [[ -n "$HAS_AUDIO" ]]; then
    AUDIO_CMD="-c:a copy"
  fi
  
  if [[ "$FIRST_VIDEO" == true && "$SKIP_PREVIEW" == false && "$PREVIEW_SECS" -gt 0 ]]; then
    PREVIEW_PATH="$OUTPUT_DIR/test_preview.mp4"
    echo "  Creating ${PREVIEW_SECS}s preview..."
    ffmpeg -y -i "$video" -vf "$DELogo_FILTER" -t "$PREVIEW_SECS" $AUDIO_CMD "$PREVIEW_PATH" -loglevel warning
    FIRST_VIDEO=false
  fi
  
  echo "  Processing full video..."
  ffmpeg -y -i "$video" -vf "$DELogo_FILTER" -c:v libx264 -crf "$CRF" $AUDIO_CMD "$OUTPUT_PATH" -loglevel warning
  
  echo "  Original: $video" >> "$MANIFEST_FILE"
  echo "  Processed: $OUTPUT_PATH" >> "$MANIFEST_FILE"
  echo "  Date: $(date +%Y-%m-%d)" >> "$MANIFEST_FILE"
  echo "  ---" >> "$MANIFEST_FILE"
  
  echo "  Done: $OUTPUT_PATH"
  echo ""
done <<< "$VIDEO_FILES"

echo "=========================================="
echo "Complete! Processed $VIDEO_COUNT video(s)"
echo "Output directory: $OUTPUT_DIR"
echo "Manifest: $MANIFEST_FILE"
if [[ "$PREVIEW_SECS" -gt 0 && "$SKIP_PREVIEW" == false ]]; then
  echo "Preview: $OUTPUT_DIR/test_preview.mp4"
fi
