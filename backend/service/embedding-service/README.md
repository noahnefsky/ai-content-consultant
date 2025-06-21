# AI Content Consultant - RAG Population

Simple one-time script to populate ChromaDB with viral content data for N8N GraphRAG integration.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the script to populate your RAG
python populate_rag.py
```

## What it does

1. **Creates ChromaDB database** at `./viral_content_db`
2. **Populates with 10 viral posts** from TikTok and Instagram
3. **Generates embeddings** using `all-MiniLM-L6-v2` model
4. **Tests semantic search** with sample queries
5. **Ready for N8N integration**

## Output

```
🎯 AI Content Consultant - RAG Population Script
==================================================
🚀 Setting up ChromaDB at ./viral_content_db
✅ Collection 'viral_posts' ready
📊 Adding 10 viral posts to RAG...
✅ Successfully added 10 posts to RAG

🔍 Testing RAG with sample queries...

Query: 'I want to share productivity tips and morning routines'
  1. [TIKTOK] This productivity hack changed my life!
     Category: productivity | Hashtags: ['productivity', 'morningroutine', 'selfcare']
  2. [TIKTOK] My 5AM morning routine that actually changed my life
     Category: lifestyle | Hashtags: ['morningroutine', '5amclub', 'productivity']

🎉 RAG setup complete!
   Database location: ./viral_content_db
   Posts added: 10
   Collection: viral_posts
   Model: all-MiniLM-L6-v2
```

## N8N Integration

Use the created ChromaDB in your N8N workflows:

```python
# In your N8N Python node
import chromadb

# Connect to the database
client = chromadb.PersistentClient(path="./viral_content_db")
collection = client.get_collection("viral_posts")

# Search for similar content
results = collection.query(
    query_texts=["your user prompt here"],
    n_results=5,
    where={"platform": "tiktok"}  # Optional filter
)
```

## Available Filters

- **Platform**: `tiktok`, `instagram`
- **Category**: `lifestyle`, `productivity`, `food`, `relationships`, `fashion`, `career`, `business`
- **Engagement**: Filter by `views` or `engagement_rate`

## Sample Viral Posts Included

- **Lifestyle**: Morning routines, introvert content, outfit transitions
- **Productivity**: Life hacks, business tips, daily routines  
- **Food**: Viral recipes, meal prep, cooking content
- **Fashion**: OOTD, thrifting, style transitions
- **Relationships**: Friendship advice, red flags
- **Career**: Software engineering, work from home
- **Business**: Entrepreneurship, startup advice

Perfect for your hackathon AI content consultant! 🚀 