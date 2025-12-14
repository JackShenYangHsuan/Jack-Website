# YT History Brain

RAG-powered search over your YouTube watch history. Import videos, get AI-generated summaries, discover connections between content, and ask questions about what you've watched.

## Quick Start

### 1. Install Backend Dependencies

```bash
cd "YT History Brain"
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your OpenRouter API key
```

Required environment variables:
- `OPENROUTER_API_KEY`: For AI summaries via Gemini

Optional:
- `EMBEDDING_PROVIDER`: "local" (default) or "openrouter"
- `TAKEOUT_HTML_PATH`: Path to Google Takeout watch-history.html

### 4. Run the Application

Terminal 1 - Backend:
```bash
python main.py
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Open http://localhost:5173

## Features

- **AI Video Summaries**: Gemini API analyzes videos and generates summaries, categories, takeaways, and fun facts
- **Semantic Search**: Find relevant content across all your watched videos with AI synthesis
- **Knowledge Graph**: Visualize connections between videos based on content similarity
- **Connection Discovery**: See how your watched content relates to each other
- **Category Filtering**: Filter by auto-detected categories (Technology, Business, AI/ML, etc.)
- **Local Embeddings**: Uses sentence-transformers (no API costs for embeddings)
- **Dark Mode UI**: Palantir-inspired interface

## Architecture

```
Video Import → Gemini Summarization → ChromaDB Indexing → Semantic Search & Graph
```

### Components

- **Backend (FastAPI)**
  - Video processing with Gemini API
  - ChromaDB for vector storage
  - Connection discovery and graph generation
  - RESTful API endpoints

- **Frontend (React + TypeScript)**
  - Video table with filtering and search
  - Knowledge graph visualization (react-force-graph-2d)
  - Real-time processing status
  - Category and channel statistics

### Data Flow

1. **Import**: Upload watch history or import individual YouTube URLs
2. **Summarize**: Gemini API analyzes each video (title, content)
3. **Index**: Summaries embedded and stored in ChromaDB
4. **Connect**: Compute similarity between video embeddings
5. **Query**: Semantic search with AI-synthesized answers

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/videos` | GET | List all processed videos |
| `/api/videos/{id}` | DELETE | Delete a video |
| `/api/videos/{id}/process` | POST | Process a single video |
| `/api/import-videos` | POST | Import videos from URLs |
| `/api/process-pending` | POST | Process all pending videos |
| `/api/search` | POST | Semantic search with synthesis |
| `/api/connections/graph` | GET | Get connection graph data |
| `/api/connections/compute` | POST | Compute video connections |
| `/api/connections/similar/{id}` | GET | Get similar videos |
| `/api/category-stats` | GET | Category distribution |
| `/api/channel-stats` | GET | Channel distribution |
| `/api/insights` | GET/POST | Global insights from all videos |

## Configuration

### Backend (.env)

```bash
OPENROUTER_API_KEY=your_key_here
EMBEDDING_PROVIDER=local  # or "openrouter"
LLM_MODEL=anthropic/claude-3.5-sonnet
TAKEOUT_HTML_PATH=/path/to/watch-history.html  # Optional
```

### Frontend (frontend/.env)

```bash
VITE_API_BASE=http://localhost:8000/api  # Optional, defaults to localhost
```

## Data Storage

All data is stored locally in the `data/` directory:

- `processed_videos.json`: Video metadata and summaries
- `connections.json`: Precomputed video connections graph
- `chroma/`: ChromaDB vector database
- `channel_cache.json`: Cached channel names
- `global_insights.json`: Generated insights
- `saved_insights.json`: User-saved insights

## Development

### Backend

```bash
# Run with auto-reload
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm run dev  # Development server with HMR
npm run build  # Production build
npm run lint  # Run ESLint
```

## Tech Stack

- **Backend**: Python, FastAPI, ChromaDB, sentence-transformers
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **AI**: Gemini API via OpenRouter
- **Visualization**: react-force-graph-2d

## Limitations

- YouTube transcripts may not be available for all videos
- Gemini API processes videos by title/URL (not full content analysis)
- First-time embedding model download (~100MB)
- Connection computation is O(n²) - may be slow for large libraries

## License

Personal project for demonstration purposes.
