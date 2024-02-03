import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field
from angle_emb import AnglE, Prompts
import uvicorn

MODEL_NAME = os.getenv('MODEL', 'WhereIsAI/UAE-Large-V1')
API_KEY = f'Bearer {os.getenv("API_KEY")}'

model = AnglE.from_pretrained(MODEL_NAME, pooling_strategy='cls').cuda()

app = FastAPI()

class EmbeddingBody(BaseModel):
  inputs: list[str] = Field(description='Separate texts to embed')

@app.post('/embeddings')
# Note the lack of async: we want FastAPI to schedule this CPU/GPU-bound task in another thread!
def root(body: EmbeddingBody, Authorization: Optional[str] = Header(None)):
  if API_KEY != Authorization:
    raise HTTPException(
        status_code=401,
        detail='Authorization: Bearer YOUR_KEY must be provided',
    )

  vecs = model.encode(body.inputs, to_numpy=True).tolist()
  return {'embeddings': vecs}

if __name__ == '__main__':
  uvicorn.run(app, host='0.0.0.0', port=8000)
