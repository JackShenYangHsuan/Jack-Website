"""Fine-tune RoastBot using Tinker API with async pipelining for better performance."""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path
from typing import List

# Add parent directory to path to import renderers_roast
sys.path.insert(0, str(Path(__file__).parent))

from tinker import Datum, ServiceClient
from renderers_roast import get_renderer, iter_records


async def train_async():
    """Async training loop with pipelined forward_backward and optim_step."""

    # Configuration
    API_KEY = os.getenv("TINKER_API_KEY")
    if not API_KEY:
        raise ValueError("TINKER_API_KEY environment variable not set")

    BASE_MODEL = "meta-llama/Llama-3.1-8B-Instruct"
    DATASET_PATH = Path("datasets/roast/data/pilot.jsonl")
    BATCH_SIZE = 8
    NUM_EPOCHS = 3
    LEARNING_RATE = 1e-4
    LORA_RANK = 64

    print(f"Initializing async training for {BASE_MODEL}...")
    print(f"API Key: {API_KEY[:20]}...")

    # Setup
    service = ServiceClient(api_key=API_KEY)
    training_client = service.create_lora_training_client(
        base_model=BASE_MODEL,
        lora_rank=LORA_RANK,
    )

    # Prepare data
    print(f"Loading dataset from {DATASET_PATH}...")
    renderer = get_renderer(BASE_MODEL)
    batches: List[List[Datum]] = []
    current_batch = []

    for record in iter_records(DATASET_PATH):
        messages = renderer.apply_metadata(record)
        tokens, weights = renderer.build_supervised_example(messages)

        datum = Datum(
            input_ids=tokens,
            loss_weights=weights,
            loss_fn="cross_entropy",
        )
        current_batch.append(datum)

        if len(current_batch) >= BATCH_SIZE:
            batches.append(current_batch)
            current_batch = []

    if current_batch:
        batches.append(current_batch)

    print(f"Prepared {len(batches)} batches")

    # Async training loop with pipelining
    adam_params = {
        "lr": LEARNING_RATE,
        "beta1": 0.9,
        "beta2": 0.999,
        "eps": 1e-8,
    }

    total_steps = 0

    for epoch in range(NUM_EPOCHS):
        print(f"\n=== Epoch {epoch + 1}/{NUM_EPOCHS} ===")

        # Pipeline: overlap forward_backward and optim_step
        pending_optim = None

        for batch_idx, batch in enumerate(batches):
            # Submit forward_backward asynchronously
            fb_future = training_client.forward_backward_async(
                data=batch,
                loss_fn="cross_entropy",
            )

            # Wait for previous optim_step to complete
            if pending_optim is not None:
                await pending_optim

            # Wait for forward_backward
            fb_result = await fb_future

            # Submit optim_step asynchronously (overlaps with next forward_backward)
            pending_optim = training_client.optim_step_async(adam_params)

            total_steps += 1

            # Log progress
            if total_steps % 10 == 0:
                avg_loss = fb_result.mean_loss if hasattr(fb_result, 'mean_loss') else 'N/A'
                print(f"  Step {total_steps}: loss={avg_loss}")

        # Wait for final optim step
        if pending_optim is not None:
            await pending_optim

    # Save final model
    final_name = f"roastbot_async_epoch_{NUM_EPOCHS}"
    print(f"\nSaving final model: {final_name}")
    sampling_client = training_client.save_weights_and_get_sampling_client(final_name)

    # Test
    print("\n=== Quick test ===")
    test_messages = [{"role": "user", "content": "Roast my friend who debugs with print statements."}]
    model_input = renderer.build_generation_prompt(test_messages)

    response = sampling_client.sample(
        prompt=model_input,
        sampling_params={"temperature": 0.8, "max_tokens": 100},
        num_samples=1,
    )

    print(f"Generated: {renderer.parse_response(response.samples[0])}")
    print(f"\nDone! Model: tinker://.../{final_name}")


def main():
    asyncio.run(train_async())


if __name__ == "__main__":
    main()
