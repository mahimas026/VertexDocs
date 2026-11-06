
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.translation_service import (
    translate_text,
    get_supported_languages
)

router = APIRouter(tags=["Language Translation"])


# Translation request model
class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1)
    source_lang: str = Field(..., min_length=2, max_length=10)
    target_lang: str = Field(..., min_length=2, max_length=10)


# Translate document text
@router.post("/translate")
def translate_document_text(request: TranslationRequest):

    try:
        translated_text = translate_text(
            request.text,
            request.source_lang,
            request.target_lang
        )

        return {
            "success": True,
            "source_language": request.source_lang,
            "target_language": request.target_lang,
            "original_text": request.text,
            "translated_text": translated_text
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Translation failed due to an internal server error."
        )


# Get supported languages and translation availability
@router.get("/languages")
def supported_languages():

    try:
        return get_supported_languages()

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve supported languages."
        )
