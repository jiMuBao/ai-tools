---
name: video-downloader
description: Comprehensive video downloader using yt-dlp for TikTok, Douyin, Bilibili, and 1900+ platforms. Download videos with automatic filename extraction from video titles, watermark removal for TikTok, DASH merging for Bilibili, and cookie support for Douyin. Use when user provides video URLs and wants to download them.
---

# Video Downloader

## Quick Start

```bash
python scripts/download_video.py <VIDEO_URL>
```

Example:
```bash
python scripts/download_video.py "https://www.tiktok.com/@user/video/123"
```

## When to Use

Use this skill when:
- User provides any video URL (TikTok, Douyin, Bilibili, YouTube, etc.)
- Need to download videos with automatic filename from video title
- Want watermark removal for TikTok videos
- Need DASH stream merging for Bilibili videos
- Require cookie authentication for Douyin
- Want to specify quality (default 1080p, option for best)

## Workflow

### Step 1: Identify Video Platform

Script automatically detects platform from URL and applies appropriate settings:
- **TikTok**: Removes watermark, downloads best quality
- **Douyin**: Uses cookies if available (for private/restricted videos)
- **Bilibili**: Merges DASH streams, defaults to 1080p
- **Other platforms**: Downloads with best available quality

### Step 2: Extract Video Title

yt-dlp extracts the video title and sanitizes it:
- Removes unsafe filesystem characters: `/ \ : * ? " < > |``
- Replaces spaces with underscores
- Limits filename to 200 characters
- Preserves Unicode characters

### Step 3: Download Video

Downloads video with platform-specific optimizations:
- If file exists, adds suffix: `video_2.mp4`, `video_3.mp4`, etc.
- Shows download progress
- Displays success message with filename

## Command Options

```bash
python scripts/download_video.py <VIDEO_URL> [OPTIONS]

Options:
  --output DIR        Output directory (default: downloads/)
  --quality QUALITY   Video quality: 1080 (default), best, worst
  --cookies PATH      Cookie file for authentication (Douyin/other platforms)
```

### Examples

#### Download TikTok video (watermark removed)
```bash
python scripts/download_video.py "https://www.tiktok.com/@username/video/123"
```

#### Download Douyin video with cookies
```bash
python scripts/download_video.py "https://www.douyin.com/video/xxx" --cookies cookies.txt
```

#### Download Bilibili video at 1080p (default)
```bash
python scripts/download_video.py "https://www.bilibili.com/video/BV1xx411c7mG" --quality 1080
```

#### Download best quality to custom directory
```bash
python scripts/download_video.py "https://www.youtube.com/watch?v=xxx" --quality best --output ./my_videos
```

#### Download to default downloads/ folder
```bash
python scripts/download_video.py "https://any-platform.com/video/xxx" --output downloads
```

## Platform-Specific Features

### TikTok
- **Watermark removal**: Automatically uses best available format without watermark
- **Quality**: Downloads highest resolution available
- **Filename**: Uses video title as filename

### Douyin
- **Cookie support**: Provide cookies via `--cookies` for private/restricted content
- **Note**: Some videos may require login cookies due to region restrictions
- **Cookie format**: Netscape cookie file format (export from browser)

### Bilibili
- **DASH merging**: Automatically merges separate audio/video streams
- **Quality default**: 1080p with fallback to best available
- **No watermark**: Bilibili videos typically don't have watermarks

### Other Platforms
- Supports 1900+ platforms via yt-dlp
- Automatic quality selection
- Title-based filename

## Error Handling

Script provides clear error messages:

- **Invalid URL**: "Error: Invalid video URL format"
- **Network error**: Suggests checking internet connection
- **Rate limit**: Suggests waiting before retry
- **Unsupported platform**: Lists supported platforms and suggests alternatives
- **Permission denied**: Suggests using cookies for authentication

## Notes

- Default output directory: `downloads/` (created automatically if doesn't exist)
- Videos are saved with extensions from platform (.mp4, .mkv, .webm, etc.)
- Filename sanitization ensures compatibility with all major operating systems
- Duplicate files get automatic suffix: `title_2.mp4`, `title_3.mp4`, etc.
