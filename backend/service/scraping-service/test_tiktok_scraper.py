#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from tiktok_scraper import TikTokScraper

load_dotenv()

def main():
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        print("Set APIFY_API_TOKEN in .env first")
        return

    scraper = TikTokScraper(token, download_dir="data")
    videos = scraper.scrape_user_videos("charlidamelio", limit=1)
    if not videos:
        print("No videos fetched")
        return

    v = videos[0]
    print("Title:", v.title)
    print("Likes:", v.likes)

    dl = scraper.download_trending_videos(videos, max_downloads=1, min_engagement=0)
    if dl:
        print("Downloaded to", dl[0]["file_path"])
    else:
        print("Download failed")

if __name__ == "__main__":
    main() 