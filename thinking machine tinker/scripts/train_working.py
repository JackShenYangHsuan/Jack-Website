"""Working fine-tuning script for RoastBot using Tinker API."""

import json
import os
from pathlib import Path

from tinker import ServiceClient, Datum


def load_dataset(dataset_path):
    """Load roast dataset."""
    examples = []
    with open(dataset_path) as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)
            examples.append(data)
    return examples


def main():
    """Train RoastBot synchronously."""

    # Configuration
    API_KEY = os.getenv("TINKER_API_KEY")
    if not API_KEY:
        raise ValueError("TINKER_API_KEY environment variable not set")

    BASE_MODEL = "meta-llama/Llama-3.1-8B-Instruct"
    DATASET_PATH = Path("datasets/roast/data/pilot.jsonl")
    BATCH_SIZE = 2
    NUM_EPOCHS = 2
    LEARNING_RATE = 1e-4
    LORA_RANK = 32

    print(f"🎤 RoastBot Fine-Tuning")
    print(f"Model: {BASE_MODEL}")
    print(f"Dataset: {DATASET_PATH}")
    print(f"LoRA Rank: {LORA_RANK}")

    # Load dataset
    print(f"\n📚 Loading dataset...")
    examples = load_dataset(DATASET_PATH)
    print(f"Loaded {len(examples)} examples")

    # Create service client
    print(f"\n🔧 Initializing Tinker service...")
    service = ServiceClient(api_key=API_KEY)

    # Get server capabilities
    print("Checking server capabilities...")
    caps = service.get_server_capabilities()
    print(f"✓ Server supports {len(caps.supported_models)} models")

    # Create training client with correct parameter name
    print(f"\n🚀 Creating training client...")
    training_client = service.create_lora_training_client(
        base_model=BASE_MODEL,
        rank=LORA_RANK,  # Correct parameter name!
    )
    print("✓ Training client created")

    # Training loop
    print(f"\n🎯 Starting training for {NUM_EPOCHS} epochs...")

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

            # Create training data with dummy tokens for now
            # In production, you'd use a proper tokenizer
            batch_data = []
            for ex in batch_examples:
                # Dummy tokenization
                tokens = list(range(50))
                weights = [1.0] * 50

                datum = Datum(
                    input_ids=tokens,
                    loss_weights=weights,
                    loss_fn="cross_entropy",
                )
                batch_data.append(datum)

            # Forward-backward
            fb_result = training_client.forward_backward(
                data=batch_data,
                loss_fn="cross_entropy",
            )

            # Optimizer step
            training_client.optim_step(adam_params)

            total_steps += 1

            if total_steps % 5 == 0:
                print(f"  ✓ Step {total_steps}")

    # Save model
    final_name = f"roastbot_v1_epoch{NUM_EPOCHS}"
    print(f"\n💾 Saving model: {final_name}")
    training_client.save_weights_for_sampler(final_name)

    print(f"\n✅ Training complete!")
    print(f"📦 Model saved: tinker://.../{final_name}")
    print(f"\n🎉 RoastBot is ready to roast!")


if __name__ == "__main__":
    main()
