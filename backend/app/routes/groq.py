import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


load_dotenv(Path(__file__).resolve().parents[3] / ".env")

router = APIRouter(prefix="/api", tags=["AI Chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str = Field(default="openai/gpt-oss-20b", min_length=1, max_length=120)
    messages: list[ChatMessage]
    temperature: float = Field(default=0.3, ge=0, le=2)
    max_tokens: int = Field(default=800, ge=1, le=8192)


@router.get("/chat/status")
def chat_status():
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    return {"configured": bool(api_key and api_key != "your_groq_api_key_here")}


@router.post("/chat/completions")
async def chat_completion(request: ChatCompletionRequest):
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key or api_key == "your_groq_api_key_here":
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured on the backend.")

    try:
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=request.model_dump(),
            )
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Unable to connect to the Groq API.")

    if response.is_error:
        try:
            detail = response.json()
        except ValueError:
            detail = {"error": {"message": "Groq returned an invalid error response."}}
        raise HTTPException(status_code=response.status_code, detail=detail)

    return response.json()
