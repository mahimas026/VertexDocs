
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pypdf import PdfReader
from docx import Document
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape
import fitz

router = APIRouter()

MAX_FILE_SIZE = 20 * 1024 * 1024


async def read_file(file: UploadFile, allowed_extensions: list[str]):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is missing")

    extension = Path(file.filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Supported formats: {', '.join(allowed_extensions)}"
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(status_code=400, detail="File is empty")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB")

    return content


def create_download(content: bytes, filename: str, media_type: str):
    return StreamingResponse(
        BytesIO(content),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


# PDF → TXT (Existing endpoint preserved)
@router.post("/pdf-to-txt")
async def convert_pdf_to_txt(file: UploadFile = File(...)):
    content = await read_file(file, [".pdf"])

    try:
        reader = PdfReader(BytesIO(content))
        extracted_text = "\n\n".join(
            page.extract_text() or "" for page in reader.pages
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read PDF")

    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="No extractable text found. Scanned PDFs need OCR."
        )

    return {
        "filename": Path(file.filename).stem + ".txt",
        "text": extracted_text
    }


# DOCX → TXT
@router.post("/docx-to-txt")
async def convert_docx_to_txt(file: UploadFile = File(...)):
    content = await read_file(file, [".docx"])

    try:
        document = Document(BytesIO(content))
        extracted_text = "\n".join(
            paragraph.text for paragraph in document.paragraphs
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read DOCX")

    if not extracted_text.strip():
        raise HTTPException(status_code=422, detail="No text found in DOCX")

    return create_download(
        extracted_text.encode("utf-8"),
        Path(file.filename).stem + ".txt",
        "text/plain"
    )


# TXT → PDF
@router.post("/txt-to-pdf")
async def convert_txt_to_pdf(file: UploadFile = File(...)):
    content = await read_file(file, [".txt"])

    try:
        text_content = content.decode("utf-8")
        output = BytesIO()

        pdf = SimpleDocTemplate(output, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        for line in text_content.splitlines():
            story.append(Paragraph(escape(line) or " ", styles["Normal"]))
            story.append(Spacer(1, 6))

        pdf.build(story)
        output.seek(0)

        return create_download(
            output.getvalue(),
            Path(file.filename).stem + ".pdf",
            "application/pdf"
        )
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="TXT must use UTF-8 encoding")


# PNG/JPG → PDF
@router.post("/image-to-pdf")
async def convert_image_to_pdf(file: UploadFile = File(...)):
    content = await read_file(file, [".png", ".jpg", ".jpeg"])

    try:
        image_type = Path(file.filename).suffix.lower().replace(".", "")
        image_document = fitz.open(
            stream=content,
            filetype=image_type
        )
        pdf_bytes = image_document.convert_to_pdf()
        image_document.close()

        return create_download(
            pdf_bytes,
            Path(file.filename).stem + ".pdf",
            "application/pdf"
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to convert image")


# PDF → DOCX (Extracted text; original formatting is not preserved)
@router.post("/pdf-to-docx")
async def convert_pdf_to_docx(file: UploadFile = File(...)):
    content = await read_file(file, [".pdf"])

    try:
        reader = PdfReader(BytesIO(content))
        text_content = "\n".join(
            page.extract_text() or "" for page in reader.pages
        )

        if not text_content.strip():
            raise HTTPException(
                status_code=422,
                detail="No extractable text found. Scanned PDFs need OCR."
            )

        document = Document()

        for line in text_content.splitlines():
            document.add_paragraph(line)

        output = BytesIO()
        document.save(output)
        output.seek(0)

        return create_download(
            output.getvalue(),
            Path(file.filename).stem + ".docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to convert PDF")


# DOCX → PDF (Basic text conversion; original formatting is not preserved)
@router.post("/docx-to-pdf")
async def convert_docx_to_pdf(file: UploadFile = File(...)):
    content = await read_file(file, [".docx"])

    try:
        document = Document(BytesIO(content))
        output = BytesIO()

        pdf = SimpleDocTemplate(output, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        for paragraph in document.paragraphs:
            text = escape(paragraph.text) or " "
            story.append(Paragraph(text, styles["Normal"]))
            story.append(Spacer(1, 8))

        pdf.build(story)

        return create_download(
            output.getvalue(),
            Path(file.filename).stem + ".pdf",
            "application/pdf"
        )

    except Exception:
        raise HTTPException(status_code=400, detail="Unable to convert DOCX")
