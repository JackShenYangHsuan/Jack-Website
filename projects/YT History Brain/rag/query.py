"""RAG query pipeline."""
from typing import Optional
import httpx

import config
from .vectorstore import VectorStore


class RAGQuery:
    """RAG-based query pipeline for YouTube transcripts."""

    def __init__(self, vectorstore: Optional[VectorStore] = None):
        self.vectorstore = vectorstore or VectorStore()
        self.api_key = config.OPENROUTER_API_KEY
        self.model = config.LLM_MODEL
        self.base_url = config.OPENROUTER_BASE_URL

    def _build_context(self, results: list[dict]) -> str:
        """Build context string from search results."""
        context_parts = []
        for i, result in enumerate(results, 1):
            meta = result["metadata"]
            title = meta.get("title", "Unknown")
            channel = meta.get("channel", "Unknown")
            text = result["text"]

            context_parts.append(
                f"[Source {i}] Video: \"{title}\" by {channel}\n{text}"
            )

        return "\n\n---\n\n".join(context_parts)

    def _build_prompt(self, query: str, context: str) -> str:
        """Build the prompt for the LLM."""
        return f"""You are a helpful assistant that answers questions based on the user's YouTube watch history transcripts.

Use the following transcript excerpts to answer the user's question. If the information isn't in the transcripts, say so.
Always cite which video(s) your answer comes from.

TRANSCRIPT EXCERPTS:
{context}

USER QUESTION: {query}

ANSWER:"""

    def _call_llm(self, prompt: str) -> str:
        """Call OpenRouter LLM API."""
        with httpx.Client() as client:
            response = client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:8000",
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1024,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()

        return data["choices"][0]["message"]["content"]

    def query(self, question: str, n_results: int = 5) -> dict:
        """
        Answer a question using RAG.

        Args:
            question: User's question
            n_results: Number of transcript chunks to retrieve

        Returns:
            Dict with answer, sources, and context used
        """
        # Search for relevant chunks
        results = self.vectorstore.search(question, n_results=n_results)

        if not results:
            return {
                "answer": "I couldn't find any relevant information in your YouTube history.",
                "sources": [],
                "context": "",
            }

        # Build context and prompt
        context = self._build_context(results)
        prompt = self._build_prompt(question, context)

        # Get LLM response
        answer = self._call_llm(prompt)

        # Extract unique sources
        seen_videos = set()
        sources = []
        for result in results:
            video_id = result["metadata"].get("video_id")
            if video_id and video_id not in seen_videos:
                seen_videos.add(video_id)
                sources.append({
                    "video_id": video_id,
                    "title": result["metadata"].get("title", "Unknown"),
                    "channel": result["metadata"].get("channel", "Unknown"),
                    "url": f"https://youtube.com/watch?v={video_id}",
                })

        return {
            "answer": answer,
            "sources": sources,
            "context": context,
        }
