# 🚀 AI Content Consultant - Scraping Service

A powerful social media scraping service built for hackathons using ScrapingDog APIs to discover trending videos across TikTok, Instagram, and Twitter/X.

## 🌟 Features

- **Multi-Platform Support**: Scrape trending videos from TikTok, Instagram, and Twitter/X
- **ScrapingDog Integration**: Uses ScrapingDog's robust APIs to bypass rate limits and anti-bot measures
- **Trending Discovery**: Find viral content with advanced engagement filtering
- **Video Downloads**: Download viral TikTok videos for deeper analysis
- **Hashtag Analysis**: Research trending hashtags across platforms
- **Competitor Analysis**: Analyze competitor content strategies
- **Data Export**: Export findings to JSON for further analysis
- **Hackathon Ready**: Optimized for quick deployment and testing

## 🔧 Quick Setup (5 Minutes)

### 1. Get ScrapingDog API Key
1. Visit [ScrapingDog](https://scrapingdog.com) and sign up
2. Get **1000 free credits** for testing
3. Copy your API key from the dashboard

### 2. Install Dependencies
```bash
cd backend/service/scraping-service
pip install -r requirements.txt
```

### 3. Configure Environment
Create a `.env` file:
```bash
# ScrapingDog API Configuration
SCRAPINGDOG_API_KEY=your_api_key_here
```

### 4. Test the Setup
```bash
python test_scrapers.py
```

## 🚀 Usage Examples

### Quick Test - Individual Scrapers
```python
from instagram_scraper import InstagramScraper
from twitter_scraper import TwitterScraper
from tiktok_scraper import TikTokScraper

# Instagram - Get posts from popular accounts
instagram = InstagramScraper()
posts = instagram.scrape_profile_posts('instagram', limit=10)
print(f"Found {len(posts)} Instagram posts")

# Twitter - Get tweets from trending accounts
twitter = TwitterScraper()
tweets = twitter.scrape_profile_posts('elonmusk', limit=10)
print(f"Found {len(tweets)} tweets")

# TikTok - Get videos from viral creators
tiktok = TikTokScraper()
videos = tiktok.scrape_user_videos('charlidamelio', limit=10)
print(f"Found {len(videos)} TikTok videos")
```

### Discover Trending Content Across All Platforms
```python
from trending_discovery import TrendingDiscoveryManager

# Initialize the manager
manager = TrendingDiscoveryManager(api_key="your_api_key")

# Discover trending content across all platforms
trending = manager.discover_all_trending(
    hashtags=['ai', 'tech', 'viral', 'trending'],
    limit_per_platform=20
)

# Print results
for platform, videos in trending.items():
    print(f"\n{platform.upper()}: {len(videos)} trending videos")
    for video in videos[:3]:
        print(f"  - {video.title[:50]}... (Engagement: {video.engagement_score})")
```

### Download Viral TikTok Videos
```python
from tiktok_scraper import TikTokScraper

tiktok = TikTokScraper()

# Discover trending videos
trending_videos = tiktok.discover_trending_videos(limit=20)

# Download the top 5 most engaging videos
downloads = tiktok.download_trending_videos(
    trending_videos, 
    max_downloads=5,
    min_engagement=10000
)

print(f"Downloaded {len(downloads)} viral TikTok videos!")
```

### Analyze Trending Hashtags
```python
from trending_discovery import TrendingDiscoveryManager

manager = TrendingDiscoveryManager(api_key="your_api_key")

# Analyze hashtag trends across platforms
hashtag_analysis = manager.analyze_trending_hashtags(limit=20)

print("Top Cross-Platform Hashtags:")
for hashtag in hashtag_analysis['cross_platform_hashtags'][:5]:
    print(f"  #{hashtag['hashtag']}: {hashtag['count']} posts across {len(hashtag['platforms'])} platforms")
```

### Export Data for Analysis
```python
from trending_discovery import TrendingDiscoveryManager

manager = TrendingDiscoveryManager(api_key="your_api_key")

# Export all trending data to JSON
export_file = manager.export_trending_data("trending_analysis.json")
print(f"Data exported to: {export_file}")
```

## 📊 API Credit Usage

ScrapingDog provides **1000 free credits** for new users:

| Platform | API Type | Credits per Request | Estimated Requests |
|----------|----------|-------------------|-------------------|
| Instagram | Instagram Profile Scraper | 15 credits | ~66 requests |
| Twitter | X Profile Scraper | 5 credits | ~200 requests |
| TikTok | General Web Scraper | 1-25 credits | ~40-1000 requests |

**💡 Tip**: Start with the test script to verify everything works before running large discovery operations.

## 🔍 Troubleshooting

### "No trending videos found" (Returns 0 results)

**Most Common Causes:**
1. **Invalid API Key**: Double-check your ScrapingDog API key
2. **No Credits**: Check your ScrapingDog dashboard for remaining credits
3. **Rate Limiting**: Wait a few minutes between large requests

**Quick Fixes:**
```bash
# Test your API key
python test_scrapers.py

# Check if environment variable is set
python -c "import os; print(os.getenv('SCRAPINGDOG_API_KEY'))"

# Verify your credits on ScrapingDog dashboard
```

### "Request failed" or "403 Forbidden"
- **Solution**: Check your ScrapingDog API key and credit balance
- **Backup**: Use the mock data mode for testing without API calls

### "Import Error" or "Module not found"
```bash
# Ensure you're in the right directory
cd backend/service/scraping-service

# Install dependencies
pip install -r requirements.txt

# Run from the correct directory
python example_usage.py
```

### TikTok Videos Not Downloading
- **Requirements**: TikTok video download requires `yt-dlp`
- **Solution**: Ensure `yt-dlp>=2023.12.30` is installed
- **Note**: Some TikTok videos may be geo-restricted

## 📁 File Structure

```
scraping-service/
├── base_scraper.py          # Common ScrapingDog functionality
├── instagram_scraper.py     # Instagram Profile Scraper API
├── twitter_scraper.py       # X/Twitter Profile Scraper API  
├── tiktok_scraper.py        # TikTok scraper + video downloads
├── trending_discovery.py    # Multi-platform trending discovery
├── test_scrapers.py         # Quick verification script
├── example_usage.py         # Complete usage examples
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🎯 Hackathon Tips

1. **Start Small**: Use `test_scrapers.py` to verify your setup
2. **Monitor Credits**: Check ScrapingDog dashboard regularly
3. **Cache Results**: Save trending data to JSON to avoid re-scraping
4. **Focus Platforms**: Start with one platform, then expand
5. **Use Filters**: Apply engagement thresholds to get quality content

## 🆘 Support

- **ScrapingDog Issues**: Check [ScrapingDog Documentation](https://docs.scrapingdog.com/)
- **Code Issues**: Review the example files and error logs
- **Rate Limits**: Implement delays between requests

---

**Ready to discover viral content? Start with `python test_scrapers.py` and happy scraping! 🎉** 