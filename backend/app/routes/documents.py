
from pathlib import Path
from uuid import uuid4
import json

import fitz
from docx import Document

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/documents", tags=["Documents"])

# Storage directory
STORAGE_DIR = Path(__file__).resolve().parents[2] / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# Metadata file
METADATA_FILE = STORAGE_DIR / "metadata.json"

# Supported formats
ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx",
    ".xls", ".xlsx",
    ".png", ".jpg", ".jpeg", ".txt"
}

MAX_FILE_SIZE = 20 * 1024 * 1024


class RenameRequest(BaseModel):
    new_name: str


# Read metadata
def read_metadata():
    if not METADATA_FILE.exists():
        return []

    try:
        return json.loads(
            METADATA_FILE.read_text(encoding="utf-8")
        )
    except (json.JSONDecodeError, OSError):
        raise HTTPException(
            status_code=500,
            detail="Could not read document metadata"
        )


# Save metadata
def save_metadata(documents):
    METADATA_FILE.write_text(
        json.dumps(documents, indent=4),
        encoding="utf-8"
    )


# Find document
def find_document(document_id):
    documents = read_metadata()

    for document in documents:
        if document["document_id"] == document_id:
            return document, documents

    raise HTTPException(
        status_code=404,
        detail="Document not found"
    )


# 1. Upload Document
@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is missing"
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="File format is not supported"
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds 20 MB"
        )

    document_id = str(uuid4())
    stored_filename = f"{document_id}{extension}"
    file_path = STORAGE_DIR / stored_filename

    file_path.write_bytes(content)

    document = {
        "document_id": document_id,
        "original_filename": Path(file.filename).name,
        "stored_filename": stored_filename,
        "file_size": len(content),
        "file_type": extension
    }

    documents = read_metadata()
    documents.append(document)
    save_metadata(documents)

    return {
        "message": "Document uploaded successfully",
        **document
    }


# 2. List Documents
@router.get("/")
def list_documents():

    documents = read_metadata()

    available_documents = [
        document for document in documents
        if (STORAGE_DIR / document["stored_filename"]).is_file()
    ]

    return {
        "total_documents": len(available_documents),
        "documents": available_documents
    }


# 3. Get Document Details
@router.get("/{document_id}")
def get_document(document_id: str):

    document, _ = find_document(document_id)

    file_path = STORAGE_DIR / document["stored_filename"]

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Document file is missing"
        )

    return {
        "message": "Document details retrieved successfully",
        "document": document
    }


# 4. Rename Document
@router.put("/{document_id}/rename")
def rename_document(
    document_id: str,
    request: RenameRequest
):

    document, documents = find_document(document_id)

    new_name = request.new_name.strip()

    if not new_name:
        raise HTTPException(
            status_code=400,
            detail="New filename cannot be empty"
        )

    if Path(new_name).name != new_name or new_name in {".", ".."}:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename"
        )

    old_extension = Path(
        document["original_filename"]
    ).suffix.lower()

    new_extension = Path(new_name).suffix.lower()

    if new_extension != old_extension:
        raise HTTPException(
            status_code=400,
            detail="File extension cannot be changed"
        )

    document["original_filename"] = new_name

    save_metadata(documents)

    return {
        "message": "Document renamed successfully",
        "document": document
    }


# 5. Delete Document
@router.delete("/{document_id}")
def delete_document(document_id: str):

    document, documents = find_document(document_id)

    file_path = STORAGE_DIR / document["stored_filename"]

    if file_path.exists():
        file_path.unlink()

    documents.remove(document)
    save_metadata(documents)

    return {
        "message": "Document deleted successfully",
        "document_id": document_id
    }


# 6. Download Document
@router.get("/{document_id}/download")
def download_document(document_id: str):

    document, _ = find_document(document_id)

    file_path = STORAGE_DIR / document["stored_filename"]

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Document file is missing"
        )

    return FileResponse(
        path=file_path,
        filename=document["original_filename"]
    )


# 7. Extract Document Text
@router.post("/{document_id}/extract")
def extract_document_text(document_id: str):

    document, _ = find_document(document_id)

    file_path = STORAGE_DIR / document["stored_filename"]

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Document file is missing"
        )

    extension = Path(
        document["original_filename"]
    ).suffix.lower()

    try:

        extracted_text = ""

        # PDF extraction
        if extension == ".pdf":

            with fitz.open(file_path) as pdf:

                extracted_text = "\n".join(
                    page.get_text("text")
                    for page in pdf
                )

        # DOCX extraction
        elif extension == ".docx":

            doc = Document(file_path)

            extracted_text = "\n".join(
                paragraph.text
                for paragraph in doc.paragraphs
            )

        # TXT extraction
        elif extension == ".txt":

            extracted_text = file_path.read_text(
                encoding="utf-8-sig",
                errors="replace"
            )

        else:
            raise HTTPException(
                status_code=400,
                detail="Extraction supports PDF, DOCX and TXT only. Legacy DOC files are not supported."
            )

        if not extracted_text.strip():
            raise HTTPException(
                status_code=422,
                detail="No readable text found. Scanned PDFs may require OCR."
            )

        return {
            "success": True,
            "document_id": document_id,
            "filename": document["original_filename"],
            "extracted_text": extracted_text,
            "character_count": len(extracted_text)
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Document extraction failed: {str(error)}"
        )
