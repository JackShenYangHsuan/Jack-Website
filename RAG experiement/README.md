# RAG Experiment

This project demonstrates a simple retrieval augmented generation (RAG) workflow for querying PDF documents. Users can upload PDFs, ingest them into Pinecone for vector search, and ask questions that are answered with GPT using retrieved context.

## Project Layout

```
RAG experiement/
├── backend/        # FastAPI service powering ingestion and Q&A
│   ├── app/        # FastAPI application package
│   ├── requirements.txt
│   └── .env.example
└── frontend/       # Static web client for uploads and chat
    ├── index.html
    ├── styles.css
    └── app.js
```

## Backend (FastAPI)

### Features
- `/api/uploads/pdf` — accepts a PDF upload, extracts text, chunks it, creates embeddings with OpenAI, and stores vectors in Pinecone under a document namespace.
- `/api/chat/qa` — takes a question and document identifiers, retrieves relevant context from Pinecone, and calls GPT to craft an answer with citations.

### Running Locally
1. Navigate to the backend folder and create a virtual environment.
   ```bash
   cd "RAG experiement/backend"
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Copy `.env.example` to `.env` and fill in your keys.
   ```bash
   cp .env.example .env
   ```
3. Start the API server.
   ```bash
   uvicorn app.main:app --reload
   ```

### Pinecone Setup Notes
- Create a Pinecone index (e.g., name `rag-experiment`) with a dimension that matches the embedding model (`text-embedding-3-large` → 3,072 dimensions).
- Update `PINECONE_INDEX_NAME` and ensure the environment/region matches your index.

## Frontend (Static Web Client)

The frontend is a lightweight HTML/CSS/JS client that assumes the backend is running on `http://localhost:8000`. It supports drag-and-drop uploads, shows upload status, and renders a simple chat transcript with citations.

### Running Locally
Open the `index.html` file in a browser or serve it via a simple static server:
```bash
cd "RAG experiement/frontend"
python3 -m http.server 3000
```
Then visit `http://localhost:3000` and interact with the UI.

## Next Steps
- Add authentication and storage for uploaded PDF binaries (e.g., S3) if persisting uploads is required.
- Persist chat history and per-user document namespaces.
- Implement better chunking (semantic or layout aware) and metadata filters.
- Add streaming responses and UI indicators for pending answers.
