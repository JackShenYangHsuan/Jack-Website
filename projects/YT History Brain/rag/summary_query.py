"""Query pipeline for summary-based semantic search."""
from typing import Optional
import httpx

import config
from .summary_store import SummaryStore


class SummaryQuery:
    """Generate AI synthesis from summary search results."""

    def __init__(self, store: Optional[SummaryStore] = None):
        self.store = store or SummaryStore()
        self.api_key = config.OPENROUTER_API_KEY
        self.model = config.LLM_MODEL
        self.base_url = config.OPENROUTER_BASE_URL

    def _build_synthesis_prompt(self, query: str, results: list[dict]) -> str:
        """Build prompt for synthesizing search results."""
        context_parts = []
        for i, r in enumerate(results, 1):
            categories = ", ".join(r.get("categories", [])) if r.get("categories") else "Uncategorized"
            context_parts.append(
                f"[{i}] \"{r['title']}\" (Categories: {categories})\n{r['summary']}"
            )
        context = "\n\n---\n\n".join(context_parts)

        return f"""Based on the following video summaries from the user's YouTube watch history,
answer their question. Reference specific videos by number when citing information.

QUESTION: {query}

VIDEO SUMMARIES:
{context}

Provide a concise synthesis that:
1. Directly answers the question
2. References which videos ([1], [2], etc.) support your answer
3. Highlights any patterns or themes across videos

SYNTHESIS:"""

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
                    "temperature": 0.3,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()

        return data["choices"][0]["message"]["content"]

    def query(self, question: str, n_results: int = 10) -> dict:
        """
        Search and synthesize results from video summaries.

        Args:
            question: User's search query
            n_results: Number of videos to retrieve

        Returns:
            Dict with synthesis and matching videos
        """
        # Search for relevant summaries
        results = self.store.search(question, n_results=n_results)

        if not results:
            return {
                "synthesis": "No relevant videos found for your query.",
                "results": [],
            }

        # Generate synthesis
        prompt = self._build_synthesis_prompt(question, results)
        synthesis = self._call_llm(prompt)

        return {
            "synthesis": synthesis,
            "results": results,
        }
