# YT History Brain

RAG-powered search over your YouTube watch history. Ask questions about videos you've watched and get answers with source attribution.

## Quick Start

### 1. Install Dependencies

```bash
cd "YT History Brain"
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your OpenRouter API key
```

### 3. Export Your YouTube History

Go to [Google Takeout](https://takeout.google.com):
1. Click "Deselect all"
2. Select "YouTube and YouTube Music"
3. Click "All YouTube data included" → select only "history"
4. Export and download the zip
5. Extract `watch-history.json` from the zip

### 4. Run the Server

```bash
python main.py
```

Open http://localhost:8000

### 5. Upload & Index

1. Click "Upload History" and select your `watch-history.json`
2. Click "Sync & Index" to fetch transcripts and build the search index
3. Start asking questions!

## Features

- **Semantic Search**: Find relevant content across all your watched videos
- **Source Attribution**: Every answer links back to the source videos
- **Local Embeddings**: Uses sentence-transformers (no API costs for embeddings)
- **Transcript Caching**: Transcripts are cached locally to avoid re-fetching
- **Dark Mode UI**: Palantir-inspired interface

## Architecture

```
watch-history.json → Parser → Transcript Fetcher → ChromaDB → RAG Query → LLM
```

- **Parser**: Extracts video IDs from Google Takeout export
- **Transcript Fetcher**: Uses youtube-transcript-api (no API key needed)
- **ChromaDB**: Local vector database for semantic search
- **Embeddings**: Local sentence-transformers (all-MiniLM-L6-v2)
- **LLM**: OpenRouter for flexible model choice

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/query` | POST | Query the knowledge base |
| `/api/stats` | GET | Get indexing statistics |
| `/api/upload-history` | POST | Upload watch-history.json |
| `/api/sync` | POST | Fetch transcripts and index |

## Configuration

Edit `.env`:

```bash
OPENROUTER_API_KEY=your_key_here
EMBEDDING_PROVIDER=local  # or "openrouter"
LLM_MODEL=anthropic/claude-3.5-sonnet
SYNC_SCHEDULE=0 3 * * *  # Daily at 3am
```

## Limitations

- YouTube Data API no longer provides watch history access
- Some videos may not have transcripts available
- Google Takeout automation is fragile (manual export recommended)
- First-time embedding model download may be slow

## Development

```bash
# Run with auto-reload
uvicorn main:app --reload --port 8000
```

## License

Personal project for demonstration purposes.
