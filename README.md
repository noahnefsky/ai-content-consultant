# ai-content-consultant

Empowering content creators with an AI co-pilot for ideation, trend discovery, and smart media transformation.

---

## 🚀 Inspiration
Content creators face constant pressure to produce fresh, engaging, and viral content across multiple platforms. Our goal: build an AI co-pilot that acts as a personal content strategist, helping creators keep up with trends and brainstorm platform-optimized ideas.

## ✨ What It Does
- **AI Assistant:** Generates content ideas, video structures, captions, and hashtags through a simple chat interface.
- **Viral Trends Feed:** Updates in real-time based on the user's conversation, providing relevant video inspiration on the fly.
- **Smart Media Transforms:** Extracts key moments from long videos by running speech-to-text, then uses an LLM to identify the most relevant clip timestamps and generate captions optimized for social posts.

## 🛠️ How We Built It
- **Frontend:** React + TypeScript
- **Backend:** Python + FastAPI
- **AI Core:** Google's Gemini 2.5 Pro, LangGraph state machine
- **RAG Pipeline:** Qdrant/Cohere for real-time content retrieval
- **Multimodal Embeddings:** SentenceTransformer (text), CLIP (visual)

## 🧩 Architecture
- Robust multimodal RAG system for embedding and querying both video transcripts and visual content
- Cohere reranking for improved retrieval quality
- LangGraph-based stateful conversation agent for multi-turn, context-aware interactions

- **backend/infra/**: Infrastructure as Code (Terraform)
- **backend/service/api-service/**: FastAPI app, LLM, RAG logic
- **backend/service/scraping-service/**: Scrapers for trends/content
- **backend/service/embedding-service/**: RAG population scripts
- **frontend/src/components/**: UI components (Chat, Dashboard, Media, etc.)
- **frontend/src/hooks/**: Custom React hooks
- **frontend/src/services/**: API service clients
- **frontend/src/pages/**: App pages/routes
- **frontend/src/data/**: Sample/mock data
- **frontend/src/lib/**: Utility functions

## ⚡ Challenges We Overcame
- **Multimodal RAG:** Integrating multiple embedding models and ensuring semantic search across modalities
- **Cohere Reranking:** Improving retrieval quality and handling edge cases in embedding generation
- **LangGraph Agent:** Managing conversation context, intent detection, and dynamic response generation in a graph-based workflow

## 🏁 Getting Started
1. **Clone the repo:**
   ```bash
   git clone https://github.com/yourusername/ai-content-consultant.git
   cd ai-content-consultant
   ```
2. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in required values
3. **Install dependencies:**
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend/service/api-service && pip install -r requirements.txt`
4. **Run the app:**
   - Start backend and frontend as described in their respective READMEs

## 📄 License
MIT