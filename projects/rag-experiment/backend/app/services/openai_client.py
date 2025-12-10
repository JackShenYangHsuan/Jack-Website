from __future__ import annotations

from openai import OpenAI

from ..config import get_settings

_settings = get_settings()
_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=_settings.openai_api_key)
    return _client
