#!/usr/bin/env python3
"""
Setup script to create the Pinecone index for the RAG experiment.
Run this once before using the application.
"""
import os
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "rag-experiment")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
DIMENSION = 3072  # text-embedding-3-large dimension

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY not found in .env file")

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)

# Check if index already exists
existing_indexes = pc.list_indexes()
index_names = [idx.name for idx in existing_indexes]

if INDEX_NAME in index_names:
    print(f"✓ Index '{INDEX_NAME}' already exists!")
    index = pc.Index(INDEX_NAME)
    stats = index.describe_index_stats()
    print(f"  Vectors: {stats.total_vector_count}")
    print(f"  Dimension: {stats.dimension}")
else:
    print(f"Creating index '{INDEX_NAME}'...")
    print(f"  Dimension: {DIMENSION}")
    print(f"  Metric: cosine")

    # Create the index with serverless spec (free tier)
    pc.create_index(
        name=INDEX_NAME,
        dimension=DIMENSION,
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region="us-east-1"  # Free tier region
        )
    )

    print(f"✓ Index '{INDEX_NAME}' created successfully!")
    print("\nYou can now upload PDFs and ask questions.")
