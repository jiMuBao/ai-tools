# Bilibili Channel Download Instructions

## Target Channel
https://space.bilibili.com/123456789

## Prerequisites

1. **yt-dlp**: `pip install yt-dlp`
2. **FFmpeg**: Required for merging video/audio streams
   - Windows: `winget install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
   - Mac: `brew install ffmpeg`
3. **Browser Login**: Log into Bilibili in Chrome/Firefox/Edge, then close the browser

## Download Command

### Download All Videos from Channel
```bash
yt-dlp --cookies-from-browser chrome \
  --limit-rate 1M \
  --sleep-interval 60 \
  --max-sleep-interval 90 \
  --download-archive ./bilibili_videos/archive.txt \
  -f "bestvideo[height<=1080]+bestaudio/best" \
  -o "./bilibili_videos/%(upload_date>%Y%m%d)s-%(title)s.%(ext)s" \
  "https://space.bilibili.com/123456789"
```

### Download First 30 Videos Only
```bash
yt-dlp --cookies-from-browser chrome \
  --playlist-end 30 \
  --limit-rate 1M \
  --sleep-interval 60 \
  --max-sleep-interval 90 \
  --download-archive ./bilibili_videos/archive.txt \
  -f "bestvideo[height<=1080]+bestaudio/best" \
  -o "./bilibili_videos/%(upload_date>%Y%m%d)s-%(title)s.%(ext)s" \
  "https://space.bilibili.com/123456789"
```

## Output
- **Location**: `./bilibili_videos/`
- **Format**: `YYYYMMDD-VideoTitle.mp4`
- **Archive**: `./bilibili_videos/archive.txt` (tracks downloaded videos)

## Estimated Time
~2-3 minutes per video (including anti-bot delays)

## Resume Downloads
Run the same command again. The archive.txt file prevents re-downloading.

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Request is rejected, you need to login" | Log into Bilibili in browser, close browser, retry |
| HTTP Error 514: Frequency Capped | Wait 5-10 minutes, or increase delays |
| Permission Denied (WSL) | Use WSL browser or export cookies manually |

## Alternative Browsers
Replace `chrome` with `firefox`, `edge`, or `safari` in the `--cookies-from-browser` parameter.
