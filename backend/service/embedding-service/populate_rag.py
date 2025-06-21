#!/usr/bin/env python3
"""
AI Content Consultant - RAG Population Script
Simple one-time script to populate ChromaDB with viral content for N8N GraphRAG
"""

import chromadb
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer
import pandas as pd
from datetime import datetime
import uuid

# Mock viral content data for TikTok and Instagram
VIRAL_POSTS = [
    {
        "content": "POV: You're getting ready for a night out but you're an introvert 😭 #introvert #relatable #nightout #makeup #transition",
        "platform": "tiktok",
        "category": "lifestyle",
        "hashtags": ["introvert", "relatable", "nightout", "makeup", "transition"],
        "views": 2500000,
        "engagement_rate": 0.185,
        "hook": "POV: You're getting ready for a night out but you're an introvert"
    },
    {
        "content": "This productivity hack changed my life! Start your day with the 3-2-1 rule: 3 things you're grateful for, 2 goals for today, 1 thing you'll do for yourself ✨ #productivity #morningroutine #selfcare #motivation",
        "platform": "tiktok",
        "category": "productivity",
        "hashtags": ["productivity", "morningroutine", "selfcare", "motivation"],
        "views": 1800000,
        "engagement_rate": 0.182,
        "hook": "This productivity hack changed my life!"
    },
    {
        "content": "Making the viral feta pasta but make it spicy 🌶️ Adding jalapeños and sriracha because we love flavor in this house! #fetapasta #spicy #cooking #viral #recipe",
        "platform": "tiktok",
        "category": "food",
        "hashtags": ["fetapasta", "spicy", "cooking", "viral", "recipe"],
        "views": 3200000,
        "engagement_rate": 0.195,
        "hook": "Making the viral feta pasta but make it spicy"
    },
    {
        "content": "Red flags in friendships that we need to talk about 🚩 1. They only text when they need something 2. They cancel plans last minute constantly 3. They never ask how you're doing #friendship #redflags #toxicfriends #boundaries",
        "platform": "tiktok",
        "category": "relationships",
        "hashtags": ["friendship", "redflags", "toxicfriends", "boundaries"],
        "views": 4100000,
        "engagement_rate": 0.206,
        "hook": "Red flags in friendships that we need to talk about"
    },
    {
        "content": "Outfit of the day! Thrifted this vintage blazer for $8 and paired it with these wide-leg trousers from Zara ✨ sustainable fashion is the way! #ootd #thrifted #sustainable #fashion #vintage",
        "platform": "instagram",
        "category": "fashion",
        "hashtags": ["ootd", "thrifted", "sustainable", "fashion", "vintage"],
        "views": 850000,
        "engagement_rate": 0.151,
        "hook": "Outfit of the day! Thrifted this vintage blazer for $8"
    },
    {
        "content": "Day in my life as a software engineer working from home 👩‍💻 6AM: coffee and meditation 7AM: gym 9AM: standups 10AM-6PM: coding with breaks 7PM: dinner and Netflix #dayinmylife #softwareengineer #wfh #tech",
        "platform": "tiktok",
        "category": "career",
        "hashtags": ["dayinmylife", "softwareengineer", "wfh", "tech"],
        "views": 1500000,
        "engagement_rate": 0.197,
        "hook": "Day in my life as a software engineer working from home"
    },
    {
        "content": "Things I wish I knew before starting my small business 💼 1. Save 6 months of expenses before quitting your job 2. Network is everything 3. Social media is your best friend 4. Don't be afraid to pivot #smallbusiness #entrepreneur #businesstips #startup",
        "platform": "instagram",
        "category": "business",
        "hashtags": ["smallbusiness", "entrepreneur", "businesstips", "startup"],
        "views": 920000,
        "engagement_rate": 0.208,
        "hook": "Things I wish I knew before starting my small business"
    },
    {
        "content": "My 5AM morning routine that actually changed my life ☀️ No snooze button, straight to journaling, then 20 min workout, healthy breakfast, and ready to conquer the day! #morningroutine #5amclub #productivity #selfcare",
        "platform": "tiktok",
        "category": "lifestyle",
        "hashtags": ["morningroutine", "5amclub", "productivity", "selfcare"],
        "views": 2800000,
        "engagement_rate": 0.199,
        "hook": "My 5AM morning routine that actually changed my life"
    },
    {
        "content": "Quick outfit transition from work to dinner date 💃 Same jeans, different top, add some jewelry and you're good to go! #outfittransition #fashion #datenight #worktoplay",
        "platform": "instagram",
        "category": "fashion",
        "hashtags": ["outfittransition", "fashion", "datenight", "worktoplay"],
        "views": 650000,
        "engagement_rate": 0.174,
        "hook": "Quick outfit transition from work to dinner date"
    },
    {
        "content": "Budget meal prep that actually tastes good! 🍱 Spent $30 and made 10 meals. Sharing my grocery list and recipes! #mealprep #budgetfriendly #cooking #healthyeating #savings",
        "platform": "tiktok",
        "category": "food",
        "hashtags": ["mealprep", "budgetfriendly", "cooking", "healthyeating", "savings"],
        "views": 1900000,
        "engagement_rate": 0.189,
        "hook": "Budget meal prep that actually tastes good!"
    }
]

def setup_chromadb(persist_directory="./viral_content_db"):
    """Initialize ChromaDB client and collection"""
    print(f"🚀 Setting up ChromaDB at {persist_directory}")
    
    # Initialize ChromaDB client
    client = chromadb.PersistentClient(path=persist_directory)
    
    # Create embedding function using sentence transformers
    embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Create or get collection
    collection = client.get_or_create_collection(
        name="viral_posts",
        embedding_function=embedding_function,
        metadata={"description": "Viral social media posts for content inspiration"}
    )
    
    print(f"✅ Collection 'viral_posts' ready")
    return client, collection

def populate_rag(collection):
    """Populate the RAG with viral content data"""
    print(f"📊 Adding {len(VIRAL_POSTS)} viral posts to RAG...")
    
    # Prepare data for ChromaDB
    documents = []
    metadatas = []
    ids = []
    
    for post in VIRAL_POSTS:
        # Use content as the document text
        documents.append(post["content"])
        
        # Store metadata (everything except content)
        metadata = {k: v for k, v in post.items() if k != "content"}
        metadata["added_at"] = datetime.now().isoformat()
        metadatas.append(metadata)
        
        # Generate unique ID
        ids.append(str(uuid.uuid4()))
    
    # Add to collection
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"✅ Successfully added {len(documents)} posts to RAG")
    return len(documents)

def test_search(collection):
    """Test the RAG with sample queries"""
    print("\n🔍 Testing RAG with sample queries...")
    
    test_queries = [
        "I want to share productivity tips and morning routines",
        "Looking for fashion and outfit inspiration",
        "Need cooking and recipe content ideas",
        "Want to create business and entrepreneurship content"
    ]
    
    for query in test_queries:
        print(f"\n Query: '{query}'")
        results = collection.query(
            query_texts=[query],
            n_results=2
        )
        
        if results['documents'] and results['documents'][0]:
            for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
                platform = metadata.get('platform', 'unknown')
                category = metadata.get('category', 'unknown')
                hook = metadata.get('hook', doc[:50] + '...')
                hashtags = metadata.get('hashtags', [])
                
                print(f"  {i+1}. [{platform.upper()}] {hook}")
                print(f"     Category: {category} | Hashtags: {hashtags[:3]}")

def main():
    """Main function to populate the RAG"""
    print("🎯 AI Content Consultant - RAG Population Script")
    print("=" * 50)
    
    try:
        # Setup ChromaDB
        client, collection = setup_chromadb()
        
        # Check if already populated
        existing_count = collection.count()
        if existing_count > 0:
            print(f"⚠️  Collection already has {existing_count} documents")
            response = input("Do you want to clear and repopulate? (y/N): ")
            if response.lower() == 'y':
                client.delete_collection("viral_posts")
                _, collection = setup_chromadb()
            else:
                print("Skipping population...")
                test_search(collection)
                return
        
        # Populate with viral content
        added_count = populate_rag(collection)
        
        # Test the RAG
        test_search(collection)
        
        print(f"\n🎉 RAG setup complete!")
        print(f"   Database location: ./viral_content_db")
        print(f"   Posts added: {added_count}")
        print(f"   Collection: viral_posts")
        print(f"   Model: all-MiniLM-L6-v2")
        
        # Instructions for N8N
        print(f"\n🔗 For N8N GraphRAG integration:")
        print(f"   1. Use ChromaDB client to connect to './viral_content_db'")
        print(f"   2. Query collection 'viral_posts' with user prompts")
        print(f"   3. Filter by platform using metadata: {{'platform': 'tiktok'}}")
        print(f"   4. Filter by category: {{'category': 'lifestyle'}}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 