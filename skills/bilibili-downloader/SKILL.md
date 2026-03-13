---
name: bilibili-downloader
description: Download videos from Bilibili user channels, playlists, and single videos with anti-bot protection. Use this skill whenever the user mentions Bilibili (bilibili.com, space.bilibili.com), wants to download videos from a Chinese video platform, or asks to bulk download videos. The skill handles authentication, rate limiting, and provides interactive guidance.
---

# Bilibili Video Downloader

Download videos from Bilibili with automatic anti-bot protection and smart defaults.

## Overview

This skill helps you download videos from Bilibili using yt-dlp with:
- Browser cookie authentication (avoids login errors)
- Anti-bot protection (rate limiting + random delays)
- Auto-merged video/audio streams
- Organized filenames with date prefixes
- Resume capability (skip already downloaded videos)

## Prerequisites Check

Before downloading, verify these are installed:

1. **yt-dlp**: `yt-dlp --version`
   - Install: `pip install yt-dlp`

2. **FFmpeg**: `ffmpeg -version`
   - Windows: `winget install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
   - Mac: `brew install ffmpeg`

3. **Browser login**: User must be logged into Bilibili in their browser
   - Supported: Chrome, Firefox, Edge, Safari
   - Make sure to close browser after login to save cookies

## Interactive Workflow

### Step 1: Understand what the user wants to download

Ask the user:
1. **What type of content?**
   - Single video
   - User channel (all their uploaded videos)
   - Playlist
   - Favorites

2. **How many videos?** (skip for single video)
   - First page only (typically 30 videos)
   - All videos
   - Custom number

3. **Which browser?** (for cookies)
   - Chrome (default)
   - Firefox
   - Edge
   - Safari

### Step 2: Generate the download command

Based on user's answers, construct the appropriate command.

#### Common Parameters

**Always include**:
- `--cookies-from-browser BROWSER`: Authentication via browser cookies
- `--limit-rate 1M`: Rate limit to avoid bot detection
- `--sleep-interval 60 --max-sleep-interval 90`: Random delays between videos
- `-f "bestvideo[height<=1080]+bestaudio/best"`: 1080p quality with auto-merge
- `-o "./bilibili_videos/%(upload_date>%Y%m%d)s-%(title)s.%(ext)s"`: Date-prefixed filenames

**For bulk downloads** (channel/playlist/favorites):
- `--download-archive ./bilibili_videos/archive.txt`: Track downloads to skip duplicates

**For limited downloads**:
- `--playlist-end N`: Download only first N videos

### Step 3: Command Templates

#### Single Video
```bash
yt-dlp --cookies-from-browser chrome \
  -f "bestvideo[height<=1080]+bestaudio/best" \
  -o "./bilibili_videos/%(upload_date>%Y%m%d)s-%(title)s.%(ext)s" \
  "https://www.bilibili.com/video/VIDEO_ID"
```

#### User Channel - First Page (30 videos)
```bash
yt-dlp --cookies-from-browser chrome \
  --playlist-end 30 \
  --limit-rate 1M \
  --sleep-interval 60 \
  --max-sleep-interval 90 \
  --download-archive ./bilibili_videos/archive.txt \
  -f "bestvideo[height<=1080]+bestaudio/best" \
  -o "./bilibili_videos/%(upload_date>%Y%m%d)s-%(title)s.%(ext)s" \
  "https://space.bilibili.com/USER_ID"
```

#### User Channel - All Videos
```bash
yt-dlp --cookies-from-browser chrome \
  --limit-rate 1M \
  --sleep-interval 60 \
  --max-sleep-interval 90 \
  --download-archive ./bilibili_videos/archive.txt \
  -f "bestvideo[height<=1080]+bestaudio/best" \
  -o "./bilibili_videos/%(upload_date>%Y%m%d)s-%(title)s.%(ext)s" \
  "https://space.bilibili.com/USER_ID"
```

#### Playlist
```bash
yt-dlp --cookies-from-browser chrome \
  --limit-rate 1M \
  --sleep-interval 60 \
  --max-sleep-interval 90 \
  --download-archive ./bilibili_videos/archive.txt \
  -f "bestvideo[height<=1080]+bestaudio/best" \
  -o "./bilibili_videos/%(upload_date>%Y%m%d)s-%(title)s.%(ext)s" \
  "PLAYLIST_URL"
```

#### Favorites
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

## Quality Options

Default is 1080p max. If user wants different quality:

- **720p**: `-f "bestvideo[height<=720]+bestaudio/best"`
- **Best available**: `-f "bestvideo+bestaudio/best"`
- **4K** (if available): `-f "bestvideo[height<=2160]+bestaudio/best"`

Note: Some 1080P high bitrate formats require Bilibili premium membership.

## Execution Guidance

After generating the command, tell the user:

1. **Videos will be saved to**: `./bilibili_videos/`
2. **Filename format**: `YYYYMMDD-VideoTitle.mp4`
3. **Download time estimate**: ~2-3 minutes per video with delays
4. **To resume**: Run the same command again (archive.txt tracks progress)

## Troubleshooting

### "Request is rejected, you need to login"

**Problem**: Bilibili requires authentication for channel/playlist access

**Solutions**:
1. Open Chrome/Firefox/Edge and log into bilibili.com
2. Close browser completely to save cookies
3. Retry the download command

### HTTP Error 514: Frequency Capped

**Problem**: Rate limited by Bilibili (too many requests)

**Solutions**:
1. Wait 5-10 minutes before resuming
2. Increase delays: `--sleep-interval 90 --max-sleep-interval 120`
3. Reduce rate limit: `--limit-rate 500K`

### Permission Denied (WSL Users)

**Problem**: Cannot access Windows browser cookies from WSL

**Solutions**:
1. Use WSL browser: Log into bilibili.com in WSL Chrome/Firefox
2. Or export cookies manually using browser extension "Get cookies.txt"

### "Format(s) 1080P 高码率 are missing"

**Info**: Some videos have premium-only high bitrate formats

**Result**: yt-dlp automatically falls back to regular 1080p (still good quality)

No action needed - this is normal for non-premium users.

### Incomplete Downloads

**Problem**: Download interrupted mid-video

**Solution**: yt-dlp automatically retries failed downloads up to 10 times. If it still fails:
1. Check internet connection
2. Wait a few minutes (may be temporary rate limit)
3. Resume with the same command

## Advanced Options

If user wants more control:

- **Custom output directory**: Change `./bilibili_videos/` to desired path
- **No date prefix**: Use `-o "./bilibili_videos/%(title)s.%(ext)s"`
- **Download subtitles**: Add `--write-subs` or `--write-auto-subs`
- **Thumbnail**: Add `--write-thumbnail`
- **Metadata**: Add `--write-info-json`

## Notes

- Anti-bot settings (rate limit + delays) are crucial to avoid account flags
- Archive file prevents re-downloading same videos
- FFmpeg automatically merges separate video/audio streams
- Date format is YYYYMMDD (e.g., 20260312 for March 12, 2026)
