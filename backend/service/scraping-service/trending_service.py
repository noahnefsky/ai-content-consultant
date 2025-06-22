#!/usr/bin/env python3
"""Trending TikTok video fetcher (one-shot)

Scrapes ~100 trending TikTok clips (sorted by likes) via the public
`lexis-solutions/tiktok-trending-videos-scraper` actor, ranks them by our
engagement heuristic, then downloads the top 20 to the local `data/`
folder and writes a single JSON manifest with rich metadata for later
processing.

Run once:
    $ APIFY_API_TOKEN=... python trending_service.py
"""
from __future__ import annotations

import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

from apify_client import ApifyClient

from tiktok_scraper import TikTokScraper, TrendingVideo


DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)


def fetch_trending_raw(client: ApifyClient, max_items: int = 100) -> List[Dict[str, Any]]:
    """Call the trending actor and return raw dataset items."""
    run_input = {
        "countryCode": "US",  # global enough, adjust if needed
        "sortBy": "like",     # highest likes first
        "maxItems": max_items,
        "period": "7",        # last 7 days
    }
    run = client.actor("lexis-solutions/tiktok-trending-videos-scraper").call(run_input=run_input)
    return client.dataset(run["defaultDatasetId"]).list_items().items


def main() -> None:
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        raise SystemExit("Set APIFY_API_TOKEN env var")

    client = ApifyClient(token)
    print("Fetching trending feed …")
    raw_items = fetch_trending_raw(client)
    
    # Use TikTokScraper for batch enrichment instead of individual processing
    scraper = TikTokScraper(token, download_dir="/tmp")
    enriched_items = scraper._enrich_items_batch(raw_items)
    videos: List[TrendingVideo] = [scraper._item_to_video(item) for item in enriched_items if item]
    videos = [v for v in videos if v]

    if not videos:
        print("No videos parsed, aborting.")
        return

    # Rank by engagement_score then views
    videos.sort(key=lambda v: (v.engagement_score, v.views), reverse=True)
    top = videos[:20]

    scraper_download = TikTokScraper(token, download_dir="data")
    print(f"Downloading top {len(top)} clips …")
    downloads = scraper_download.download_trending_videos(top, max_downloads=20, min_engagement=0, enriched_items=enriched_items)

    manifest_path = DATA_DIR / f"trending_manifest_{int(time.time())}.json"
    with open(manifest_path, "w") as fh:
        json.dump(downloads, fh, indent=2)

    print("Saved manifest to", manifest_path)


if __name__ == "__main__":
    main() 