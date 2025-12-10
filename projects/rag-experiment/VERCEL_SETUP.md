# Vercel Deployment Setup

## Required Environment Variables

The backend requires the following environment variables to be set in **Vercel Project Settings → Environment Variables**:

### Required Variables

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `PINECONE_API_KEY` | Your Pinecone API key | `pcsk_xxxxx` |
| `PINECONE_INDEX_NAME` | Name of your Pinecone index | `rag-experiment` |
| `PINECONE_ENVIRONMENT` | Pinecone environment/region | `gcp-starter` or `us-east-1` |
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-xxxxx` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `https://your-app.vercel.app` |

### Optional Variables (have defaults)

| Variable Name | Default Value | Description |
|--------------|---------------|-------------|
| `EMBEDDING_MODEL` | `text-embedding-3-large` | OpenAI embedding model |
| `GPT_MODEL` | `gpt-4o-mini` | OpenAI GPT model |
| `CHUNK_SIZE` | `800` | Text chunk size for embeddings |
| `CHUNK_OVERLAP` | `120` | Overlap between chunks |
| `MAX_CONTEXT_CHUNKS` | `6` | Max chunks to retrieve |
| `MAX_UPLOAD_SIZE_MB` | `25` | Max PDF upload size in MB |

## Setup Instructions

### 1. Set up Pinecone

1. Create a Pinecone account at [pinecone.io](https://www.pinecone.io/)
2. Create a new index with:
   - **Name**: `rag-experiment` (or your preferred name)
   - **Dimensions**: `3072` (for `text-embedding-3-large`)
   - **Metric**: `cosine`
3. Get your API key from the Pinecone dashboard

### 2. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Create an API key under API Keys section

### 3. Configure Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each required variable:
   - Click "Add New"
   - Enter the variable name
   - Enter the variable value
   - Select which environments (Production, Preview, Development)
   - Click "Save"

4. For `CORS_ORIGINS`, use your Vercel app URL:
   ```
   https://your-project.vercel.app
   ```
   Or for multiple origins:
   ```
   https://your-project.vercel.app,https://custom-domain.com
   ```

### 4. Redeploy

After setting all environment variables, trigger a new deployment:
- Push a new commit, OR
- Go to Deployments → Click "..." → "Redeploy"

## Troubleshooting

### Error: "Internal Server Error" or "not valid JSON"

This usually means the backend is crashing due to missing environment variables. Check:

1. All required environment variables are set in Vercel
2. The values are correct (no extra spaces, quotes, etc.)
3. Pinecone index exists and has the correct dimensions
4. API keys are valid and not expired

### Check Backend Logs

1. Go to your Vercel project
2. Click on a deployment
3. Click "Functions" tab
4. Click on the Python function to see logs
5. Look for error messages about missing environment variables

### Test Locally First

Before deploying, test locally:

1. Copy `.env.example` to `.env` in the backend folder
2. Fill in your actual values
3. Run the backend:
   ```bash
   cd "RAG experiement/backend"
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
4. Test the upload endpoint at `http://localhost:8000/docs`
