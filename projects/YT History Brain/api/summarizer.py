"""Google Gemini-based video summarizer - analyzes YouTube videos directly."""
import json
import re
import httpx
from typing import Optional
from dataclasses import dataclass

import config


@dataclass
class VideoSummary:
    """Summarized video data."""
    video_id: str
    title: str
    url: str
    summary: str
    categories: list[str]
    transcript_available: bool
    takeaways: list[str] = None
    fun_facts: list[str] = None

    def __post_init__(self):
        if self.takeaways is None:
            self.takeaways = []
        if self.fun_facts is None:
            self.fun_facts = []


SUMMARIZE_PROMPT = '''Analyze this YouTube video and provide a detailed summary with key takeaways.

Your response should include:

1. **Summary**: A detailed, structured summary:
   - Start with an introductory paragraph (2-3 sentences) explaining what the video is about
   - List "Key aspects of the video include:" followed by 3-5 bullet points with detailed explanations
   - End with a concluding sentence

2. **Categories**: Pick 1-3 from: Technology, Programming, AI/ML, Business, Finance, Productivity, Self-Improvement, Health/Fitness, Entertainment, Education, News, Science, Design, Marketing, Career, Lifestyle, Gaming, Music, Travel, Food, Sports, Other

3. **Takeaways**: 3-5 specific, actionable key insights from the video. Be detailed and specific.

4. **Fun Facts**: 2-4 interesting, surprising, or memorable facts mentioned in the video. Be specific.

Respond ONLY in this exact JSON format:
{{"summary": "Your detailed summary here", "categories": ["Category1", "Category2"], "takeaways": ["Specific takeaway 1", "Specific takeaway 2", "Specific takeaway 3"], "fun_facts": ["Specific fact 1", "Specific fact 2"]}}

VIDEO URL: {url}
VIDEO TITLE: {title}
'''


class VideoSummarizer:
    """Summarize videos using Google Gemini API with direct YouTube access."""

    def __init__(self):
        self.google_api_key = config.GOOGLE_API_KEY
        self.openrouter_api_key = config.OPENROUTER_API_KEY
        self.openrouter_base_url = config.OPENROUTER_BASE_URL
        self.openrouter_model = config.LLM_MODEL

    async def summarize_video(
        self,
        video_id: str,
        title: str,
        url: str = None
    ) -> Optional[VideoSummary]:
        """
        Summarize a YouTube video using Gemini's direct video analysis.

        Args:
            video_id: YouTube video ID
            title: Video title
            url: Video URL

        Returns:
            VideoSummary object or None on failure
        """
        if not url:
            url = f"https://www.youtube.com/watch?v={video_id}"

        # Use OpenRouter API (Gemini via OpenRouter)
        if self.openrouter_api_key:
            result = await self._summarize_with_openrouter(video_id, title, url)
            if result:
                return result

        return None

    async def _summarize_with_google_gemini(
        self,
        video_id: str,
        title: str,
        url: str
    ) -> Optional[VideoSummary]:
        """Use Google's Gemini API to analyze YouTube video directly."""
        try:
            prompt = SUMMARIZE_PROMPT.format(url=url, title=title)

            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={self.google_api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{
                            "parts": [
                                {"text": prompt},
                                {"file_data": {"file_uri": url, "mime_type": "video/mp4"}}
                            ]
                        }],
                        "generationConfig": {
                            "temperature": 0.3,
                            "maxOutputTokens": 2000
                        }
                    }
                )

                if response.status_code != 200:
                    print(f"Gemini API error: {response.status_code} - {response.text}")
                    return None

                data = response.json()
                content = data["candidates"][0]["content"]["parts"][0]["text"]

                return self._parse_response(video_id, title, url, content)

        except Exception as e:
            print(f"Error with Google Gemini API for {video_id}: {e}")
            return None

    async def _summarize_with_openrouter(
        self,
        video_id: str,
        title: str,
        url: str
    ) -> Optional[VideoSummary]:
        """Use OpenRouter with Gemini to analyze YouTube video directly."""
        try:
            prompt = SUMMARIZE_PROMPT.format(url=url, title=title)

            # Use multimodal format with video_url for direct YouTube analysis
            # Gemini on OpenRouter can analyze YouTube videos directly
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.openrouter_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openrouter_api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:8000",
                        "X-Title": "YT History Brain"
                    },
                    json={
                        "model": self.openrouter_model,
                        "messages": [{
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "video_url", "video_url": {"url": url}}
                            ]
                        }],
                        "temperature": 0.3,
                        "max_tokens": 2000
                    }
                )

                if response.status_code != 200:
                    print(f"OpenRouter API error: {response.status_code} - {response.text[:500]}")
                    return None

                data = response.json()

                # Check for API errors in response
                if "error" in data:
                    print(f"OpenRouter returned error for {video_id}: {data['error']}")
                    return None

                content = data["choices"][0]["message"]["content"]
                print(f"OpenRouter response for {video_id}: {content[:200]}...")

                return self._parse_response(video_id, title, url, content)

        except Exception as e:
            import traceback
            print(f"Error with OpenRouter API for {video_id}: {e}")
            print(f"Traceback: {traceback.format_exc()}")
            return None

    def _parse_response(
        self,
        video_id: str,
        title: str,
        url: str,
        content: str
    ) -> Optional[VideoSummary]:
        """Parse JSON response from LLM."""
        try:
            # Try to extract JSON from response
            result = None

            # Method 1: Code blocks
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0]
                result = json.loads(json_str.strip())
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0]
                result = json.loads(json_str.strip())
            else:
                # Method 2: Find JSON object directly
                json_match = re.search(r'\{[^{}]*"summary"[^{}]*\}', content, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    # Method 3: Try parsing entire content
                    result = json.loads(content.strip())

            if result:
                return VideoSummary(
                    video_id=video_id,
                    title=title,
                    url=url,
                    summary=result.get("summary", ""),
                    categories=result.get("categories", ["Other"]),
                    transcript_available=True,
                    takeaways=result.get("takeaways", []),
                    fun_facts=result.get("fun_facts", [])
                )

        except json.JSONDecodeError as e:
            print(f"JSON parse error for {video_id}: {e}")
            print(f"Content was: {content[:500]}")

        return None

    # Keep old method for backwards compatibility
    async def summarize(
        self,
        video_id: str,
        title: str,
        transcript_text: str = None,
        url: str = None
    ) -> Optional[VideoSummary]:
        """Legacy method - now just calls summarize_video."""
        return await self.summarize_video(video_id, title, url)

    async def generate_global_insights(
        self,
        videos: list,
        num_insights: int = 10,
        num_fun_facts: int = 10
    ) -> dict:
        """Generate global insights from all videos."""
        if not self.openrouter_api_key:
            raise ValueError("OpenRouter API key not configured")

        # Build context from video summaries
        video_context = []
        for v in videos[:50]:  # Limit to 50 videos for context
            if v.get("summary") and v["summary"] != "Not yet processed":
                video_context.append({
                    "id": v["video_id"],
                    "title": v["title"],
                    "summary": v["summary"][:500],
                    "categories": v.get("categories", [])
                })

        if not video_context:
            return {"insights": [], "fun_facts": []}

        prompt = f'''Analyze these video summaries and extract global insights.

Generate:
1. {num_insights} KEY INSIGHTS - patterns, learnings, or actionable advice that appear across multiple videos
2. {num_fun_facts} FUN FACTS - interesting, surprising facts mentioned in the videos

For each insight/fact, include which video IDs it came from.

Respond in this JSON format:
{{"insights": [{{"text": "insight text", "source_ids": ["id1", "id2"]}}], "fun_facts": [{{"text": "fact text", "source_ids": ["id1"]}}]}}

VIDEO SUMMARIES:
{json.dumps(video_context, indent=2)}
'''

        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    f"{self.openrouter_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openrouter_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.openrouter_model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.5,
                        "max_tokens": 3000
                    }
                )

                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]

                # Parse JSON
                if "```json" in content:
                    json_str = content.split("```json")[1].split("```")[0]
                    return json.loads(json_str.strip())
                elif "```" in content:
                    json_str = content.split("```")[1].split("```")[0]
                    return json.loads(json_str.strip())
                else:
                    return json.loads(content.strip())

        except Exception as e:
            print(f"Error generating insights: {e}")
            return {"insights": [], "fun_facts": []}
