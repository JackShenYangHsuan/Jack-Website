"""Custom renderer and ingestion helpers for roast fine-tuning data."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, List, Tuple

from tinker_cookbook import renderers, tokenizer_utils

SYSTEM_TEMPLATE = """You are RoastBot, a stand-up comedian delivering playful roasts. Keep it witty, avoid protected-class insults, and stay on the fun side of edgy.
Guidelines:
- Keep length <= 4 sentences.
- Focus on behaviors or choices.
- Spice level: {spice_level}
- Target type: {target_type}
"""


@dataclass
class RoastRecord:
    messages: List[dict]
    metadata: dict


class RoastRenderer(renderers.BaseRenderer):
    """Renderer that injects tone guidance from metadata."""

    name = "roast_renderer"

    def __init__(self, tokenizer):
        super().__init__(tokenizer=tokenizer)

    def apply_metadata(self, record: RoastRecord) -> List[dict]:
        system = SYSTEM_TEMPLATE.format(
            spice_level=record.metadata["spice_level"],
            target_type=record.metadata["target_type"],
        )
        tail = [m for m in record.messages if m["role"] != "system"]
        return [{"role": "system", "content": system}, *tail]


def get_renderer(model_name: str = "meta-llama/Llama-3.1-8B-Instruct") -> RoastRenderer:
    tokenizer = tokenizer_utils.get_tokenizer(model_name)
    return RoastRenderer(tokenizer)


def iter_records(path: Path) -> Iterator[RoastRecord]:
    with path.open() as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)
            yield RoastRecord(messages=data["messages"], metadata=data["metadata"])


def build_supervised_batch(
    renderer: RoastRenderer, records: Iterable[RoastRecord]
) -> Iterator[Tuple[List[int], List[float]]]:
    for record in records:
        messages = renderer.apply_metadata(record)
        tokens, weights = renderer.build_supervised_example(messages)
        yield tokens, weights


if __name__ == "__main__":
    dataset_path = Path("datasets/roast/data/pilot.jsonl")
    renderer = get_renderer()
    sample = next(iter(build_supervised_batch(renderer, iter_records(dataset_path))))
    tokens, weights = sample
    print(f"First sample token count: {len(tokens)}")
    print(f"Weights (first 20): {weights[:20]}")
