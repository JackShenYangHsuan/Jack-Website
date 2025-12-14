import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
TAKEOUT_DIR = DATA_DIR / "takeout"
TRANSCRIPTS_DIR = DATA_DIR / "transcripts"
CHROMA_DIR = DATA_DIR / "chroma"

# Ensure directories exist
for dir_path in [TAKEOUT_DIR, TRANSCRIPTS_DIR, CHROMA_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# API Keys
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_EMAIL = os.getenv("GOOGLE_EMAIL", "")

# Embedding config
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "local")
LOCAL_EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# LLM config
LLM_MODEL = os.getenv("LLM_MODEL", "anthropic/claude-3.5-sonnet")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Sync schedule
SYNC_SCHEDULE = os.getenv("SYNC_SCHEDULE", "0 3 * * *")

# Chunking config
CHUNK_SIZE = 500  # tokens
CHUNK_OVERLAP = 50  # tokens

# ChromaDB collection names
COLLECTION_NAME = "youtube_transcripts"
SUMMARY_COLLECTION_NAME = "video_summaries"
