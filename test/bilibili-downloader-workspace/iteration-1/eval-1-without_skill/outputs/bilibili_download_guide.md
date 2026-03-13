# Bilibili Video Download Guide

## Target Channel
https://space.bilibili.com/123456789

## Recommended Tools

### 1. you-get (Python-based)
```bash
# Install
pip install you-get

# Download single video
you-get "https://www.bilibili.com/video/BV1PLACEHOLDER"

# Download entire channel (requires scripting)
# Note: you-get doesn't support batch channel downloads natively
```

### 2. yt-dlp (Recommended)
```bash
# Install
pip install yt-dlp

# Download single video
yt-dlp "https://www.bilibili.com/video/BV1PLACEHOLDER"

# Download with best quality
yt-dlp -f "bestvideo+bestaudio" "https://www.bilibili.com/video/BV1PLACEHOLDER"

# Download channel videos (with playlist support)
yt-dlp "https://space.bilibili.com/123456789"
```

### 3. BBDown (Specialized Bilibili downloader)
```bash
# Download from: https://github.com/nilaoda/BBDown

# Download single video
BBDown "https://www.bilibili.com/video/BV1PLACEHOLDER"

# Download with cookies (for login-required content)
BBDown -c "cookies.txt" "https://www.bilibili.com/video/BV1PLACEHOLDER"
```

## Batch Download Script Example

```bash
#!/bin/bash
# bilibili_batch_download.sh

CHANNEL_URL="https://space.bilibili.com/123456789"
OUTPUT_DIR="./downloads"

mkdir -p "$OUTPUT_DIR"

# Using yt-dlp for channel download
yt-dlp \
  --output "$OUTPUT_DIR/%(title)s.%(ext)s" \
  --format "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" \
  --write-thumbnail \
  --write-description \
  "$CHANNEL_URL"

echo "Download completed. Files saved to: $OUTPUT_DIR"
```

## Python Script Example

```python
# bilibili_downloader.py
import subprocess
import sys

def download_channel(channel_url: str, output_dir: str = "./downloads"):
    """
    Download all videos from a Bilibili channel using yt-dlp.
    
    Args:
        channel_url: Bilibili channel URL
        output_dir: Directory to save downloaded videos
    """
    cmd = [
        "yt-dlp",
        "--output", f"{output_dir}/%(title)s.%(ext)s",
        "--format", "bestvideo+bestaudio/best",
        "--write-thumbnail",
        "--write-description",
        channel_url
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"Successfully downloaded videos to {output_dir}")
    except subprocess.CalledProcessError as e:
        print(f"Error downloading: {e}")
        sys.exit(1)

if __name__ == "__main__":
    CHANNEL_URL = "https://space.bilibili.com/123456789"
    download_channel(CHANNEL_URL, output_dir="./downloads")
```

## Important Notes

1. **Cookies may be required** for age-restricted or member-only content
2. **Respect rate limits** to avoid IP bans
3. **Check copyright** - only download content you have permission to
4. **Quality selection** - Bilibili offers multiple quality tiers (360P to 4K)
5. **File formats** - Videos are typically MP4, audio M4A

## Requirements

```txt
# requirements.txt
yt-dlp>=2023.0.0
# or
you-get>=0.4.0
```

## Execution

```bash
# Make script executable
chmod +x bilibili_batch_download.sh

# Run
./bilibili_batch_download.sh

# Or with Python
pip install -r requirements.txt
python bilibili_downloader.py
```
