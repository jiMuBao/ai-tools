# Bilibili Favorites Download Guide

## Prerequisites

Before downloading, ensure these are installed:
1. **yt-dlp**: `yt-dlp --version` (Install: `pip install yt-dlp`)
2. **FFmpeg**: `ffmpeg -version` (Required for merging video/audio streams)
3. **Browser login**: You must be logged into Bilibili in Chrome/Firefox/Edge, then close the browser to save cookies

## Download Command for All Favorites Videos

```bash
yt-dlp --cookies-from-browser chrome \
  --limit-rate 1M \
  --sleep-interval 60 \
  --max-sleep-interval 90 \
  --download-archive ./bilibili_videos/archive.txt \
  -f "bestvideo[height<=1080]+bestaudio/best" \
  -o "./bilibili_videos/%(upload_date>%Y%m%d)s-%(title)s.%(ext)s" \
  "https://space.bilibili.com/YOUR_USER_ID/favlist"
```

**Important**: Replace `YOUR_USER_ID` with your actual Bilibili user ID.

## How to Find Your User ID

1. Log into bilibili.com
2. Go to your personal space (click your avatar)
3. The URL will be `https://space.bilibili.com/XXXXXXX` - the number is your user ID

## Parameters Explained

| Parameter | Purpose |
|-----------|---------|
| `--cookies-from-browser chrome` | Uses browser cookies for authentication |
| `--limit-rate 1M` | Rate limit to avoid bot detection |
| `--sleep-interval 60 --max-sleep-interval 90` | Random 60-90 second delays between videos |
| `--download-archive ./bilibili_videos/archive.txt` | Tracks downloads, skips already downloaded videos |
| `-f "bestvideo[height<=1080]+bestaudio/best"` | Downloads 1080p quality with auto-merged audio |
| `-o "./bilibili_videos/..."` | Saves files with date prefix (YYYYMMDD-Title.mp4) |

## What to Expect

- **Save location**: `./bilibili_videos/`
- **Filename format**: `YYYYMMDD-VideoTitle.mp4`
- **Download time**: ~2-3 minutes per video (including delays)
- **Resume capability**: Run the same command again to continue interrupted downloads

## Troubleshooting

### "Request is rejected, you need to login"
1. Open Chrome and log into bilibili.com
2. Close browser completely to save cookies
3. Retry the download command

### HTTP Error 514: Frequency Capped
1. Wait 5-10 minutes before resuming
2. Or increase delays: `--sleep-interval 90 --max-sleep-interval 120`

### WSL Permission Issues
Log into Bilibili using a browser installed in WSL, not Windows.
