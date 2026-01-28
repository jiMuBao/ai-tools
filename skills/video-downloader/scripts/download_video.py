#!/usr/bin/env python3

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


def sanitize_filename(title):
    """Sanitize video title for use as filename."""
    unsafe_chars = r'[<>:"/\\|?*]'
    filename = re.sub(unsafe_chars, "", title)
    filename = filename.replace(" ", "_")
    filename = filename.strip(".")
    filename = filename[:200]
    return filename


def get_unique_filename(base_name, output_dir):
    """Generate unique filename by adding suffix if file exists."""
    ext = ".mp4"
    counter = 1
    filename = base_name + ext

    while (Path(output_dir) / filename).exists():
        counter += 1
        filename = f"{base_name}_{counter}{ext}"

    return filename


def download_video(url, output_dir="downloads", quality="1080", cookies=None):
    """Download video from URL using yt-dlp."""

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    try:
        cmd = ["yt-dlp", "--get-title", url]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        title = result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error: Failed to get video title: {e.stderr}")
        return False
    except FileNotFoundError:
        print("Error: yt-dlp not installed. Install with: pip install yt-dlp")
        return False

    sanitized_title = sanitize_filename(title)
    unique_filename = get_unique_filename(sanitized_title, output_dir)
    output_path = os.path.join(output_dir, unique_filename)

    quality_format_args = get_quality_format(quality, url)

    download_cmd = ["yt-dlp"]

    if cookies:
        download_cmd.append("--cookies")
        download_cmd.append(cookies)

    download_cmd.append("-o")
    download_cmd.append(output_path)

    for arg in quality_format_args:
        download_cmd.append(arg)

    download_cmd.append(url)

    print(f"Downloading: {title}")
    print(f"Output: {output_path}")

    try:
        subprocess.run(download_cmd, check=True)
        print(f"\n✓ Successfully downloaded to: {output_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Download failed: {e.stderr}")

        if e.stderr and ("sign in" in e.stderr.lower() or "login" in e.stderr.lower()):
            print("\nHint: This video may require authentication.")
            print("Use --cookies option with a cookie file from your browser.")

        if e.stderr and "rate limit" in e.stderr.lower():
            print("\nHint: Rate limit reached. Please wait and try again later.")

        if e.stderr and "format is not available" in e.stderr.lower():
            print("\nHint: Requested format is not available for this video.")
            print("Try using --quality best instead.")

        return False
    except FileNotFoundError:
        print("Error: yt-dlp not installed. Install with: pip install yt-dlp")
        return False


def get_quality_format(quality, url):
    """Get yt-dlp format arguments based on quality and platform."""

    if "bilibili.com" in url:
        if quality == "1080":
            return ["-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]"]
        return ["-f", f"bestvideo[height<={quality}]+bestaudio/best[height<={quality}]"]

    if "tiktok.com" in url:
        return []

    if quality == "best":
        return []

    if quality == "worst":
        return ["-f", "worstvideo+worstaudio/worst"]

    return ["-f", f"best[height<={quality}]/best"]


def main():
    parser = argparse.ArgumentParser(
        description="Download videos from various platforms using yt-dlp"
    )
    parser.add_argument("url", help="Video URL to download")
    parser.add_argument(
        "--output",
        "-o",
        default="downloads",
        help="Output directory (default: downloads)",
    )
    parser.add_argument(
        "--quality",
        "-q",
        default="1080",
        choices=["1080", "best", "worst"],
        help="Video quality: 1080 (default), best, worst",
    )
    parser.add_argument("--cookies", "-c", help="Cookie file for authentication")

    args = parser.parse_args()

    if not validate_url(args.url):
        print(f"Error: Invalid video URL: {args.url}")
        print(
            "Please provide a valid video URL (e.g., https://www.tiktok.com/@user/video/123)"
        )
        sys.exit(1)

    success = download_video(
        url=args.url, output_dir=args.output, quality=args.quality, cookies=args.cookies
    )

    sys.exit(0 if success else 1)


def validate_url(url):
    """Basic URL validation."""
    url_pattern = re.compile(
        r"^https?://"
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
        r"localhost|"
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
        r"(?::\d+)?"
        r"(?:/?|[/?]\S+)$",
        re.IGNORECASE,
    )
    return url_pattern.match(url) is not None


if __name__ == "__main__":
    main()
