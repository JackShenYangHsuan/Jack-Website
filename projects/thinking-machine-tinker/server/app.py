import os
import uuid
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Tinker SDK
import tinker
from tinker import types

app = FastAPI(title="Tinker Backend", version="0.1.0")

# Allow local dev from file:// or any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store (for demo; replace with DB for prod)
RUNS: Dict[str, Dict[str, Any]] = {}

# ---------- Schemas ----------
class TuneRequest(BaseModel):
    jsonl: str = Field(..., description="Training data, one JSON object per line")
    base_model: str = Field("meta-llama/Llama-3.2-1B", description="Base model to fine-tune")
    steps: int = Field(4, ge=1, le=64, description="Number of training update steps")

class TuneResponse(BaseModel):
    run_id: str
    sampling_path: Optional[str]
    model_id: Optional[str]
    steps: int

class ChatRequest(BaseModel):
    run_id: str
    message: str
    max_tokens: int = 256
    temperature: float = 0.2

class ChatResponse(BaseModel):
    response: str

# ---------- Helpers ----------

def parse_jsonl(text: str) -> List[Any]:
    items = []
    for i, line in enumerate(l for l in text.splitlines() if l.strip()):
        try:
            import json
            items.append(json.loads(line))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSONL at line {i+1}: {e}")
    return items


def make_datum_from_pair(prompt: str, completion: str, tokenizer) -> types.Datum:
    prompt_tokens = tokenizer.encode(prompt, add_special_tokens=True)
    prompt_weights = [0] * len(prompt_tokens)
    comp_tokens = tokenizer.encode(f" {completion}\n\n", add_special_tokens=False)
    comp_weights = [1] * len(comp_tokens)

    tokens = prompt_tokens + comp_tokens
    weights = prompt_weights + comp_weights

    input_tokens = tokens[:-1]
    target_tokens = tokens[1:]
    weights = weights[1:]

    return types.Datum(
        model_input=types.ModelInput.from_ints(tokens=input_tokens),
        loss_fn_inputs=dict(weights=weights, target_tokens=target_tokens),
    )


def build_training_batch(items: List[Any], tokenizer) -> List[types.Datum]:
    batch: List[types.Datum] = []
    for it in items:
        if isinstance(it, dict):
            if "prompt" in it and "completion" in it:
                prompt = str(it["prompt"]).rstrip("\n")
                completion = str(it["completion"]).rstrip("\n")
                datum = make_datum_from_pair(prompt, completion, tokenizer)
            elif "input" in it and "output" in it:
                prompt = f"Input: {str(it['input']).rstrip('\n')}\nOutput:"
                completion = str(it["output"]).rstrip("\n")
                datum = make_datum_from_pair(prompt, completion, tokenizer)
            else:
                # Fallback: stringified object
                prompt = f"Instruction: {it}\nResponse:"
                completion = ""
                datum = make_datum_from_pair(prompt, completion, tokenizer)
        else:
            prompt = f"Instruction: {it}\nResponse:"
            completion = ""
            datum = make_datum_from_pair(prompt, completion, tokenizer)
        batch.append(datum)
    return batch


# ---------- Endpoints ----------
@app.post("/api/tune", response_model=TuneResponse)
def tune(req: TuneRequest):
    if not os.getenv("TINKER_API_KEY"):
        raise HTTPException(status_code=500, detail="TINKER_API_KEY is not set on server")

    items = parse_jsonl(req.jsonl)

    service_client = tinker.ServiceClient()
    training_client = service_client.create_lora_training_client(base_model=req.base_model)
    tokenizer = training_client.get_tokenizer()

    batch = build_training_batch(items, tokenizer)

    import numpy as np

    for _ in range(req.steps):
        fwb = training_client.forward_backward(batch, "cross_entropy")
        opt = training_client.optim_step(types.AdamParams(learning_rate=1e-4))
        # block until applied
        _ = fwb.result()
        _ = opt.result()

    # Save weights for sampling and get a client
    save_resp = training_client.save_weights_for_sampler(name="final").result()
    sampling_path = save_resp.path
    sampling_client = service_client.create_sampling_client(model_path=sampling_path)

    run_id = str(uuid.uuid4())
    RUNS[run_id] = {
        "sampling_path": sampling_path,
        "sampling_client": sampling_client,
        "base_model": req.base_model,
    }

    return TuneResponse(run_id=run_id, sampling_path=sampling_path, model_id=run_id, steps=req.steps)


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    run = RUNS.get(req.run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Unknown run_id. Fine-tune first.")

    sampling_client = run["sampling_client"]

    # Build a simple prompt
    prompt_text = f"User: {req.message}\nAssistant:"

    tokenizer = sampling_client.get_tokenizer()
    prompt = types.ModelInput.from_ints(tokenizer.encode(prompt_text, add_special_tokens=True))

    params = types.SamplingParams(max_tokens=req.max_tokens, temperature=req.temperature, stop=["\n\n", "\nUser:"])
    future = sampling_client.sample(prompt=prompt, sampling_params=params, num_samples=1)
    result = future.result()

    seq = result.sequences[0].tokens
    text = tokenizer.decode(seq)
    return ChatResponse(response=text.strip())
