#!/bin/bash
# Download command for single Bilibili video
# Video URL: https://www.bilibili.com/video/BV1test456

yt-dlp --cookies-from-browser chrome \
  -f "bestvideo[height<=1080]+bestaudio/best" \
  -o "./bilibili_videos/%(upload_date>%Y%m%d)s-%(title)s.%(ext)s" \
  "https://www.bilibili.com/video/BV1test456"
