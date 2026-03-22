---
name: video-watermark-remover
description: Remove watermarks from local video files using FFmpeg's delogo filter with iterative preview-adjust workflow. Supports batch processing, audio preservation, and creates tracking manifest. Use when user wants to remove watermarks, logos, or overlays from video files they have locally. Triggers on phrases like "remove watermark from video", "clean video logo", "delogo", "remove bilibili watermark", "erase video watermark".
---

# Video Watermark Remover

Remove watermarks from video files using FFmpeg's delogo filter with an interactive preview-adjust workflow.

## Quick Start

```bash
# Create a 5-second preview to test settings
ffmpeg -i video.mp4 -vf "delogo=x=10:y=10:w=420:h=80" -t 5 -c:a copy preview.mp4

# Process full video
ffmpeg -i video.mp4 -vf "delogo=x=10:y=10:w=420:h=80" -c:a copy -c:v libx264 -crf 18 output.mp4
```

## When to Use

Use this skill when:
- User wants to remove watermarks/logos from local video files
- User mentions "delogo" or video watermark removal
- User has videos with platform watermarks (Bilibili, TikTok, etc.)
- User wants to clean overlays from videos
- User asks about batch processing videos to remove logos

## Prerequisites

- FFmpeg installed (`which ffmpeg`)
- Video files accessible in local filesystem
- User has permission to modify the videos

## Workflow

### Step 1: Scan for Video Files

Find all video files in the target directory:

```bash
ls -lh *.mp4 *.mkv *.avi *.mov *.webm 2>/dev/null
```

Ask user to confirm which directory contains the videos.

### Step 2: Analyze Video Properties

Get resolution and check for audio streams:

```bash
ffprobe -v error -show_entries stream=width,height,codec_type,codec_name -of csv=p=0 video.mp4
```

Important to note:
- Video resolution (for positioning the delogo area)
- Whether audio exists (affects output command)

### Step 3: Ask About Watermark

Ask user:
1. **Position**: Where is the watermark? (top-left, top-right, bottom-left, bottom-right, center)
2. **Approximate size**: Small (~100x40), Medium (~150x60), Large (~300x100)

Use this to set initial delogo parameters.

### Step 4: Create Preview for Testing

Create a short preview (5 seconds) to test delogo settings:

```bash
ffmpeg -y -i "video.mp4" -vf "delogo=x=10:y=10:w=420:h=80" -t 5 -c:a copy "processed/test_preview.mp4"
```

**Parameter reference:**
- `x` - Horizontal position from left edge
- `y` - Vertical position from top edge  
- `w` - Width of area to process
- `h` - Height of area to process

**Position presets by corner:**
| Position | x | y |
|----------|---|---|
| Top-left | 10 | 10 |
| Top-right | W-430 | 10 |
| Bottom-left | 10 | H-90 |
| Bottom-right | W-430 | H-90 |

Where W = video width, H = video height.

### Step 5: Iterate with User

1. Show user the preview
2. Ask if the watermark removal looks correct
3. If not, ask for adjustments:
   - "Make it wider/narrower" → adjust `w`
   - "Make it taller/shorter" → adjust `h`
   - "Move it left/right" → adjust `x`
   - "Move it up/down" → adjust `y`
4. Create new preview with adjusted settings
5. Repeat until user approves

### Step 6: Batch Process All Videos

Once settings are approved, process all videos:

```bash
for f in *.mp4; do
  ffmpeg -y -i "$f" -vf "delogo=x=10:y=10:w=420:h=80" -c:a copy -c:v libx264 -crf 18 "processed/$f"
done
```

**Quality settings:**
- `-crf 18` - Visually lossless (recommended default)
- `-crf 23` - Good quality, smaller files
- `-crf 28` - Acceptable quality, much smaller files

**Audio handling:**
- `-c:a copy` - Copy audio without re-encoding (fast, preserves quality)
- Only use if video has audio stream (check in Step 2)

### Step 7: Create Manifest

Create a tracking file to log what was processed:

```bash
echo "# Watermark Removal Manifest
# Generated: $(date +%Y-%m-%d)
# Filter: delogo=x=10:y=10:w=420:h=80
# Quality: CRF 18 (visually lossless)
" > processed/manifest.txt

for f in *.mp4; do
  echo "Original: $f" >> processed/manifest.txt
  echo "Processed: processed/$f" >> processed/manifest.txt
  echo "Date: $(date +%Y-%m-%d)" >> processed/manifest.txt
  echo "---" >> processed/manifest.txt
done
```

## Output Structure

```
original_directory/
├── video1.mp4          (original files preserved)
├── video2.mp4
└── processed/
    ├── video1.mp4      (processed videos)
    ├── video2.mp4
    ├── test_preview.mp4
    └── manifest.txt    (tracking log)
```

## Command Reference

### FFmpeg delogo filter syntax

```
delogo=x=X:y=Y:w=W:h=H[:band=B]
```

| Parameter | Description |
|-----------|-------------|
| x | X position of top-left corner |
| y | Y position of top-left corner |
| w | Width of area to process |
| h | Height of area to process |
| band | Tolerance band (default: 4, higher = smoother edges) |

### Full processing command

```bash
ffmpeg -i INPUT.mp4 \
  -vf "delogo=x=10:y=10:w=420:h=80" \
  -c:v libx264 -crf 18 \
  -c:a copy \
  OUTPUT.mp4
```

## Helper Script

For batch processing, use the bundled script:

```bash
bash scripts/batch_delogo.sh \
  --input-dir . \
  --output-dir processed \
  --x 10 --y 10 --width 420 --height 80 \
  --preview 5
```

## Common Issues

### Audio missing in output

Check if original has audio:
```bash
ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 video.mp4
```

If empty output, video has no audio - this is expected.

### Filename with special characters

Use proper quoting:
```bash
f="video with spaces & symbols!.mp4"
ffmpeg -i "$f" -vf "delogo=x=10:y=10:w=420:h=80" "processed/$f"
```

### Preview looks blurry

The delogo filter interpolates pixels. For cleaner results:
1. Increase `band` parameter for smoother edges
2. Ensure delogo area tightly matches watermark size
3. Consider AI-based inpainting tools for complex watermarks

## Alternative: AI-Based Removal

For complex or moving watermarks, FFmpeg delogo may not be sufficient. Alternatives:

- **ProPainter** - Video inpainting model
- **E2FGVI** - Flow-guided video inpainting
- **DaVinci Resolve** (free) - Manual masking + content-aware fill

These require more setup but produce cleaner results for difficult cases.
