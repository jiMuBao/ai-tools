#!/usr/bin/env python3
# bilibili_downloader.py
# Download videos from Bilibili channel using yt-dlp

import subprocess
import sys
from pathlib import Path


def download_channel(channel_url: str, output_dir: str = "./downloads"):
    """
    Download all videos from a Bilibili channel using yt-dlp.

    Args:
        channel_url: Bilibili channel URL
        output_dir: Directory to save downloaded videos
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    cmd = [
        "yt-dlp",
        "--output",
        str(output_path / "%(title)s.%(ext)s"),
        "--format",
        "bestvideo+bestaudio/best",
        "--write-thumbnail",
        "--write-description",
        channel_url,
    ]

    print(f"Starting download from: {channel_url}")
    print(f"Output directory: {output_dir}")

    try:
        subprocess.run(cmd, check=True)
        print(f"Successfully downloaded videos to {output_dir}")
    except subprocess.CalledProcessError as e:
        print(f"Error downloading: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("Error: yt-dlp not found. Install with: pip install yt-dlp")
        sys.exit(1)


if __name__ == "__main__":
    CHANNEL_URL = "https://space.bilibili.com/123456789"
    download_channel(CHANNEL_URL, output_dir="./downloads")
