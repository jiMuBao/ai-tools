#!/usr/bin/env python3
"""
Bilibili Favorites Downloader
Downloads all videos from a Bilibili favorites folder using yt-dlp

Requirements:
  pip install yt-dlp requests

Usage:
  python download_bilibili_favorites.py
"""

import subprocess
import json
import time
from pathlib import Path

# Configuration
FAVORITES_ID = "YOUR_FAVORITES_ID"  # Get from URL: favlist?fid=XXXXXX
UID = "YOUR_UID"  # Your Bilibili user ID
OUTPUT_DIR = Path("./bilibili_downloads")
COOKIES_FILE = "cookies.txt"  # Optional: for login-required content


def get_favorites_videos(fid, uid):
    """
    Fetch video list from favorites using Bilibili API.
    You may need to add your own cookies for private favorites.
    """
    import requests

    api_url = f"https://api.bilibili.com/x/v3/fav/resource/list"
    params = {
        "media_id": fid,
        "pn": 1,  # page number
        "ps": 20,  # page size
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": f"https://space.bilibili.com/{uid}/favlist",
    }

    videos = []
    page = 1

    while True:
        params["pn"] = page
        response = requests.get(api_url, params=params, headers=headers)
        data = response.json()

        if data["code"] != 0:
            print(f"Error: {data['message']}")
            break

        medias = data["data"].get("medias", [])
        if not medias:
            break

        for item in medias:
            videos.append(
                {
                    "bvid": item["bvid"],
                    "title": item["title"],
                    "url": f"https://www.bilibili.com/video/{item['bvid']}",
                }
            )

        # Check if more pages
        if len(medias) < params["ps"]:
            break

        page += 1
        time.sleep(0.5)  # Rate limiting

    return videos


def download_video(url, output_dir, cookies_file=None):
    """Download a single video using yt-dlp"""
    cmd = [
        "yt-dlp",
        "-f",
        "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "-o",
        str(output_dir / "%(title)s.%(ext)s"),
        "--no-playlist",
        url,
    ]

    if cookies_file and Path(cookies_file).exists():
        cmd.extend(["--cookies", cookies_file])

    try:
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error downloading {url}: {e}")
        return False


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Fetching favorites list...")
    videos = get_favorites_videos(FAVORITES_ID, UID)
    print(f"Found {len(videos)} videos")

    for i, video in enumerate(videos, 1):
        print(f"\n[{i}/{len(videos)}] Downloading: {video['title']}")
        success = download_video(video["url"], OUTPUT_DIR, COOKIES_FILE)

        if success:
            print(f"  ✓ Downloaded: {video['title']}")
        else:
            print(f"  ✗ Failed: {video['title']}")

        # Rate limiting
        if i < len(videos):
            time.sleep(2)

    print(f"\nDone! Videos saved to: {OUTPUT_DIR.absolute()}")


if __name__ == "__main__":
    main()
