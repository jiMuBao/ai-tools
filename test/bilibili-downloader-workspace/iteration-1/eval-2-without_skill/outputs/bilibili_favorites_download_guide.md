# Bilibili Favorites Download Guide

## Recommended Tools

### 1. BBDown (Most Reliable for Bilibili)
```bash
# Install
dotnet tool install --global BBDown

# Download single video
BBDown "https://www.bilibili.com/video/BV..."

# Download with login (required for some videos)
BBDown login
BBDown "https://www.bilibili.com/video/BV..."

# Download entire playlist/favorites
BBDown -p "https://space.bilibili.com/USERID/favlist?fid=FAVID"
```

### 2. yt-dlp
```bash
# Install
pip install yt-dlp

# Download single video
yt-dlp "https://www.bilibili.com/video/BV..."

# Download with cookies (for login-required content)
yt-dlp --cookies cookies.txt "https://www.bilibili.com/video/BV..."

# Best quality
yt-dlp -f "bestvideo+bestaudio" "URL"
```

### 3. lux (formerly annie)
```bash
# Install
go install github.com/iawia002/lux@latest

# Download
lux "https://www.bilibili.com/video/BV..."

# With cookies
lux -c cookies.txt "URL"
```

## Downloading Favorites - Method 1: Manual URL Extraction

1. Open your Bilibili favorites page in browser
2. Open browser DevTools (F12) -> Network tab
3. Refresh page and filter for "favlist" or "api"
4. Find the API request containing video list
5. Extract video URLs (BV IDs)
6. Use BBDown or yt-dlp with the list

## Downloading Favorites - Method 2: Python Script

Create a script using bilibili-api:

```python
# requirements: pip install bilibili-api-python

from bilibili_api import favorite_list, sync
import subprocess

async def download_favorites(fid):
    # fid = favorites folder ID from URL
    fav = favorite_list.FavoriteList(fid)
    contents = await fav.get_content_list()
    
    for item in contents['medias']:
        bvid = item['bvid']
        url = f"https://www.bilibili.com/video/{bvid}"
        print(f"Downloading: {item['title']}")
        # Use BBDown or yt-dlp
        subprocess.run(['BBDown', url])

# Run
sync(download_favorites(YOUR_FAV_ID))
```

## Downloading Favorites - Method 3: Browser Extension

1. Install "Bilibili Evolved" browser extension
2. Go to your favorites page
3. Use batch download feature
4. Select videos and quality
5. Generate download commands or download directly

## Important Notes

- Login/cookies required for:
  - Age-restricted content
  - Member-only videos
  - Higher quality options
  
- Cookies extraction:
  - Use browser extension "Get cookies.txt"
  - Or export from DevTools -> Application -> Cookies

- Rate limiting: Add delays between downloads to avoid being blocked

- Storage: HD videos are large (500MB-2GB each typical)

## Finding Your Favorites ID

Your favorites URL format:
`https://space.bilibili.com/YOUR_UID/favlist?fid=FAVORITES_ID`

- YOUR_UID: Your user ID
- FAVORITES_ID: Specific favorites folder ID
