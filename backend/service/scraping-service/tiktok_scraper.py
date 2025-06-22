"""
TikTok Scraper using ScrapingDog General API
Focuses on discovering trending videos and viral content
"""

import logging, os, re, json, requests, uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from apify_client import ApifyClient
import yt_dlp

from base_scraper import TrendingVideo

logger = logging.getLogger(__name__)


class TikTokScraper:
    def __init__(self, token: str | None = None, download_dir: str = "downloaded_videos"):
        self.token = token or os.getenv("APIFY_API_TOKEN")
        if not self.token:
            raise ValueError("Set APIFY_API_TOKEN or pass token param.")
        self.client = ApifyClient(self.token)
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(exist_ok=True)
        self.ydl_opts = {
            "outtmpl": str(self.download_dir / "%(id)s.%(ext)s"),
            "format": "bestvideo+bestaudio/best",
            "quiet": True,
            "ignoreerrors": True,
        }

    # ----- data collection --------------------------------------------------
    def scrape_user_videos(self, username: str, limit: int = 20) -> List[TrendingVideo]:
        inp = {"profiles": [username], "resultsPerPage": limit, "shouldDownloadVideos": False}
        run = self.client.actor("clockworks/tiktok-profile-scraper").call(run_input=inp)
        items = self.client.dataset(run["defaultDatasetId"]).list_items().items[:limit]
        
        # Batch enrich items with missing metadata
        enriched_items = self._enrich_items_batch(items)
        return [self._item_to_video(i) for i in enriched_items if i]

    def scrape_hashtag_videos(self, hashtag: str, limit: int = 20) -> List[TrendingVideo]:
        inp = {"hashtags": [hashtag], "resultsPerPage": limit, "shouldDownloadVideos": False}
        run = self.client.actor("clockworks/tiktok-scraper").call(run_input=inp)
        items = self.client.dataset(run["defaultDatasetId"]).list_items().items[:limit]
        
        # Batch enrich items with missing metadata
        enriched_items = self._enrich_items_batch(items)
        return [self._item_to_video(i) for i in enriched_items if i]

    # ----- utils ------------------------------------------------------------
    def _item_to_video(self, item: Dict[str, Any]) -> Optional[TrendingVideo]:
        try:
            vid = str(item.get("id"))
            desc = item.get("text", "")
            stats = {
                "likes": item.get("diggCount", 0),
                "comments": item.get("commentCount", 0),
                "shares": item.get("shareCount", 0),
                "views": item.get("playCount", 0),
            }

            if stats["views"] == 0 and item.get("item_url"):
                try:
                    enriched = self._fetch_video_details(item["item_url"])
                    if enriched:
                        desc = enriched.get("text", desc)
                        for k, src in (
                            ("diggCount", "likes"),
                            ("commentCount", "comments"),
                            ("shareCount", "shares"),
                            ("playCount", "views"),
                        ):
                            stats[src] = enriched.get(k, stats[src])

                        # merge additional useful fields
                        item.setdefault("hashtags", enriched.get("hashtags", []))
                        item.setdefault("authorMeta", enriched.get("authorMeta", {}))
                        vm = enriched.get("videoMeta", {})
                        if vm:
                            item["videoMeta"] = vm
                        item.setdefault("videoUrl", enriched.get("videoUrl"))
                        item.setdefault("webVideoUrl", enriched.get("webVideoUrl"))
                        item.setdefault("mediaUrls", enriched.get("mediaUrls"))
                except Exception as e:
                    logger.debug(f"enrich fail {vid}: {e}")

            engagement = stats["likes"] + stats["comments"] * 3 + stats["shares"] * 2
            author = item.get("authorMeta", {})
            video_meta = item.get("videoMeta", {})
            return TrendingVideo(
                platform="tiktok",
                video_id=vid,
                title=(desc[:97] + "...") if len(desc) > 100 else desc,
                description=desc,
                url=item.get("webVideoUrl", ""),
                thumbnail_url=video_meta.get("coverUrl", ""),
                video_url=(
                    (item.get("mediaUrls") or [None])[0]
                    or item.get("videoUrl")
                    or video_meta.get("downloadAddr")
                    or item.get("webVideoUrl")
                    or item.get("item_url")
                    or ""
                ),
                creator=f"@{author.get('name', '')}",
                creator_followers=author.get("fans", 0),
                views=stats["views"],
                likes=stats["likes"],
                comments=stats["comments"],
                shares=stats["shares"],
                engagement_score=engagement,
                hashtags=[h.get("name") for h in item.get("hashtags", [])] or re.findall(r"#(\w+)", desc),
                created_at=datetime.fromtimestamp(item.get("createTime", 0)) if item.get("createTime") else datetime.now(),
                duration=video_meta.get("duration"),
                is_video=True,
            )
        except Exception as e:
            logger.warning(f"item parse error: {e}")
            return None

    def _enrich_items_batch(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch enrich items that are missing view data to reduce API calls."""
        # Separate items that need enrichment
        items_needing_enrichment = []
        enrichment_urls = []
        
        for item in items:
            if item.get("playCount", 0) == 0 and item.get("item_url"):
                items_needing_enrichment.append(item)
                enrichment_urls.append(item["item_url"])
        
        if not enrichment_urls:
            return items
        
        logger.info(f"Batch enriching {len(enrichment_urls)} videos with missing metadata")
        
        # Make single batch API call for all URLs
        try:
            inp = {"postURLs": enrichment_urls, "shouldDownloadVideos": False}
            run = self.client.actor("clockworks/tiktok-video-scraper").call(run_input=inp)
            enriched_items = self.client.dataset(run["defaultDatasetId"]).list_items().items
            
            # Create lookup map by URL
            enriched_map = {}
            for enriched in enriched_items:
                if enriched.get("item_url"):
                    enriched_map[enriched["item_url"]] = enriched
            
            # Apply enrichment to original items
            for item in items_needing_enrichment:
                url = item.get("item_url")
                if url in enriched_map:
                    enriched = enriched_map[url]
                    # Update stats
                    for k, src in (
                        ("diggCount", "diggCount"),
                        ("commentCount", "commentCount"), 
                        ("shareCount", "shareCount"),
                        ("playCount", "playCount"),
                    ):
                        if enriched.get(k):
                            item[k] = enriched[k]
                    
                    # Update other fields
                    item.setdefault("text", enriched.get("text", item.get("text", "")))
                    item.setdefault("hashtags", enriched.get("hashtags", []))
                    item.setdefault("authorMeta", enriched.get("authorMeta", {}))
                    if enriched.get("videoMeta"):
                        item["videoMeta"] = enriched["videoMeta"]
                    item.setdefault("videoUrl", enriched.get("videoUrl"))
                    item.setdefault("webVideoUrl", enriched.get("webVideoUrl"))
                    item.setdefault("mediaUrls", enriched.get("mediaUrls"))
                        
        except Exception as e:
            logger.warning(f"Batch enrichment failed: {e}")
        
        return items

    # ----- download ---------------------------------------------------------
    def download_video(self, url: str, video_id: str | None = None) -> Optional[str]:
        if not url:
            return None

        vid = video_id or str(uuid.uuid4())
        self.ydl_opts["outtmpl"] = str(self.download_dir / f"{vid}.%(ext)s")

        # ---------- try yt-dlp first
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                ydl.download([url])
            for ext in ("mp4", "webm", "mkv"):
                fp = self.download_dir / f"{vid}.{ext}"
                if fp.exists():
                    return str(fp)
        except Exception as e:
            logger.debug(f"yt-dlp failed for {url}: {e}")

        # ---------- fallback: direct HTTP GET (TikTok CDN link)
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
                "Referer": "https://www.tiktok.com/",
            }
            resp = requests.get(url, headers=headers, stream=True, timeout=60)
            if resp.status_code == 200:
                # Guess extension from content-type
                ct = resp.headers.get("Content-Type", "video/mp4")
                ext = "mp4" if "mp4" in ct else "webm"
                fp = self.download_dir / f"{vid}.{ext}"
                with open(fp, "wb") as fh:
                    for chunk in resp.iter_content(chunk_size=1 << 14):
                        if chunk:
                            fh.write(chunk)
                return str(fp)
        except Exception as e:
            logger.warning(f"direct download failed: {e}")

        return None

    def _extract_hashtags(self, text: str) -> List[str]:
        """Extract hashtags from text."""
        if not text:
            return []
        hashtags = re.findall(r'#(\w+)', text)
        return [tag.lower() for tag in hashtags]

    def _calculate_engagement_score(self, likes: int, comments: int, shares: int) -> int:
        """Calculate engagement score using the same formula as TikTokScraper."""
        return likes + comments * 3 + shares * 2

    def _convert_to_data_format(self, video_id: str, rich_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Convert rich metadata to the data/*.json format."""
        
        # Extract stats (they're directly in the root object)
        likes = rich_metadata.get("diggCount", 0)
        comments = rich_metadata.get("commentCount", 0) 
        shares = rich_metadata.get("shareCount", 0)
        views = rich_metadata.get("playCount", 0)
        
        # Extract author info
        author_meta = rich_metadata.get("authorMeta", {})
        creator_name = author_meta.get("name", "")
        creator_followers = author_meta.get("fans", 0)
        
        # Extract video info
        text = rich_metadata.get("text", "")
        hashtags = self._extract_hashtags(text)
        
        # Get video metadata
        video_meta = rich_metadata.get("videoMeta", {})
        thumbnail_url = video_meta.get("coverUrl", "")
        duration = video_meta.get("duration")
        
        # Convert timestamp
        create_time = rich_metadata.get("createTime")
        if create_time:
            created_at = datetime.fromtimestamp(create_time).isoformat()
        else:
            created_at = datetime.now().isoformat()
        
        # Build URLs
        web_url = rich_metadata.get("webVideoUrl", "")
        if not web_url and video_id:
            web_url = f"https://www.tiktok.com/@{creator_name}/video/{video_id}"
        
        return {
            "video_id": video_id,
            "title": (text[:97] + "...") if len(text) > 100 else text,
            "description": text,
            "creator": f"@{creator_name}" if creator_name else "@",
            "creator_followers": creator_followers,
            "url": web_url,
            "thumbnail_url": thumbnail_url,
            "views": views,
            "likes": likes,
            "comments": comments,
            "shares": shares,
            "engagement_score": self._calculate_engagement_score(likes, comments, shares),
            "hashtags": hashtags,
            "created_at": created_at,
            "duration": duration,
            "file_path": f"data/{video_id}.mp4"
        }

    def download_trending_videos(
        self,
        videos: List[TrendingVideo],
        max_downloads: int = 5,
        min_engagement: int = 10000,
        enriched_items: List[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Download videos and save rich metadata if available."""
        out: List[Dict[str, Any]] = []
        
        # Create lookup map for enriched metadata
        enriched_map = {}
        if enriched_items:
            for item in enriched_items:
                video_id = str(item.get("id", ""))
                if video_id:
                    enriched_map[video_id] = item
        
        for v in sorted(videos, key=lambda x: x.engagement_score, reverse=True)[:max_downloads]:
            if v.engagement_score < min_engagement or not v.video_url:
                continue
            path = self.download_video(v.video_url, v.video_id)
            if path:
                # Use rich metadata if available, otherwise fallback to TrendingVideo data
                if v.video_id in enriched_map:
                    rich_metadata = enriched_map[v.video_id]
                    meta = self._convert_to_data_format(v.video_id, rich_metadata)
                    meta["file_path"] = path  # Update with actual download path
                else:
                    # Fallback to original format
                    meta = {
                        "video_id": v.video_id,
                        "title": v.title,
                        "description": v.description,
                        "creator": v.creator,
                        "creator_followers": v.creator_followers,
                        "url": v.url,
                        "thumbnail_url": v.thumbnail_url,
                        "views": v.views,
                        "likes": v.likes,
                        "comments": v.comments,
                        "shares": v.shares,
                        "engagement_score": v.engagement_score,
                        "hashtags": v.hashtags,
                        "created_at": v.created_at.isoformat(),
                        "duration": v.duration,
                        "file_path": path,
                    }
                
                out.append(meta)
                with open(Path(path).with_suffix(".json"), "w") as f:
                    json.dump(meta, f, indent=2, ensure_ascii=False)
        return out

    # analytics helper -------------------------------------------------------
    def get_video_analytics(self, url: str) -> Optional[Dict[str, Any]]:
        try:
            with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
                info = ydl.extract_info(url, download=False)
            return {
                "id": info.get("id"),
                "title": info.get("title"),
                "views": info.get("view_count"),
                "likes": info.get("like_count"),
                "duration": info.get("duration"),
            }
        except Exception:
            return None