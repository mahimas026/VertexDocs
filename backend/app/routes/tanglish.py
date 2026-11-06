
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.tanglish_service import to_tamil, to_roman

router = APIRouter(tags=["Tanglish"])

class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

@router.post("/tanglish/to-tamil")
def tanglish_to_tamil(request: TextRequest):
    try:
        return {"input": request.text, "output": to_tamil(request.text)}
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))

@router.post("/tanglish/to-roman")
def tamil_to_tanglish(request: TextRequest):
    try:
        return {"input": request.text, "output": to_roman(request.text)}
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
