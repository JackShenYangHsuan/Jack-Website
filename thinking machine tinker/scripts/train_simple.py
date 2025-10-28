"""Simple fine-tuning script for RoastBot using Tinker API."""

import asyncio
import json
import os
from pathlib import Path

from tinker import ServiceClient, Datum


def load_dataset(dataset_path):
    """Load roast dataset and convert to simple text format."""
    examples = []

    with open(dataset_path) as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)

            # Format as conversation
            text_parts = []
            for msg in data["messages"]:
                role = msg["role"]
                content = msg["content"]
                if role == "system":
                    text_parts.append(f"System: {content}")
                elif role == "user":
                    text_parts.append(f"User: {content}")
                elif role == "assistant":
                    text_parts.append(f"Assistant: {content}")

            examples.append("\n".join(text_parts))

    return examples


async def train_async():
    """Train RoastBot with Tinker API."""

    # Configuration
    API_KEY = os.getenv("TINKER_API_KEY")
    if not API_KEY:
        raise ValueError("TINKER_API_KEY environment variable not set")

    BASE_MODEL = "meta-llama/Llama-3.1-8B-Instruct"
    DATASET_PATH = Path("datasets/roast/data/pilot.jsonl")
    BATCH_SIZE = 4
    NUM_EPOCHS = 2
    LEARNING_RATE = 1e-4
    LORA_RANK = 32

    print(f"Starting RoastBot training...")
    print(f"Model: {BASE_MODEL}")
    print(f"API Key: {API_KEY[:10]}...")
    print(f"Dataset: {DATASET_PATH}")

    # Load dataset
    print(f"\nLoading dataset...")
    examples = load_dataset(DATASET_PATH)
    print(f"Loaded {len(examples)} examples")

    # Create service client
    print(f"\nInitializing Tinker service...")
    try:
        service = ServiceClient(api_key=API_KEY)

        # Get server capabilities
        print("Checking server capabilities...")
        caps = service.get_server_capabilities()
        print(f"Server capabilities: {caps}")

        # Create training client
        print(f"\nCreating training client (LoRA rank={LORA_RANK})...")
        training_client = service.create_lora_training_client(
            base_model=BASE_MODEL,
            lora_rank=LORA_RANK,
        )

        print(f"Training client created successfully!")
        print(f"\nStarting training for {NUM_EPOCHS} epochs...")

        # Training loop
        adam_params = {
            "lr": LEARNING_RATE,
            "beta1": 0.9,
            "beta2": 0.999,
            "eps": 1e-8,
        }

        total_steps = 0

        for epoch in range(NUM_EPOCHS):
            print(f"\n=== Epoch {epoch + 1}/{NUM_EPOCHS} ===")

            # Simple batching
            for i in range(0, len(examples), BATCH_SIZE):
                batch_examples = examples[i:i+BATCH_SIZE]

                # Create simple training data
                # For now, just use dummy data to test the API
                batch_data = []
                for ex in batch_examples:
                    # Dummy tokenization - in real use, need proper tokenizer
                    tokens = list(range(100))  # Dummy tokens
                    weights = [1.0] * 100  # Uniform weights

                    datum = Datum(
                        input_ids=tokens,
                        loss_weights=weights,
                        loss_fn="cross_entropy",
                    )
                    batch_data.append(datum)

                # Forward-backward
                fb_future = training_client.forward_backward_async(
                    data=batch_data,
                    loss_fn="cross_entropy",
                )

                fb_result = await fb_future

                # Optimizer step
                optim_future = training_client.optim_step_async(adam_params)
                await optim_future

                total_steps += 1

                if total_steps % 5 == 0:
                    print(f"  Step {total_steps} completed")

        # Save model
        final_name = f"roastbot_simple_epoch_{NUM_EPOCHS}"
        print(f"\nSaving model: {final_name}")
        training_client.save_weights_for_sampler(final_name)

        print(f"\n✅ Training complete!")
        print(f"Model saved: tinker://.../{final_name}")

    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        import traceback
        traceback.print_exc()


def main():
    asyncio.run(train_async())


if __name__ == "__main__":
    main()
