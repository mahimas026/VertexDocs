from fastapi import APIRouter, UploadFile, File, HTTPException
from pypdf import PdfReader
from io import BytesIO
from pathlib import Path

# Create API router
router = APIRouter()

# Maximum file size: 20 MB
MAX_FILE_SIZE = 20 * 1024 * 1024


@router.post("/pdf-to-txt")
async def convert_pdf_to_txt(file: UploadFile = File(...)):

    # Check file extension
    if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    # Read uploaded file
    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )

    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File exceeds 20 MB"
        )

    # Extract text from PDF
    try:
        reader = PdfReader(BytesIO(content))

        extracted_text = "\n\n".join(
            page.extract_text() or ""
            for page in reader.pages
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read PDF"
        )

    # Check extracted text
    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="No extractable text found. Scanned PDFs need OCR."
        )

    # Return extracted text
    return {
        "filename": Path(file.filename).stem + ".txt",
        "text": extracted_text
    }