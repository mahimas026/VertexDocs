
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
from pypdf import PdfReader, PdfWriter


router = APIRouter()

MAX_FILE_SIZE = 20 * 1024 * 1024
MAX_FILES = 10


def read_pdf(content: bytes, filename: str):
    try:
        reader = PdfReader(BytesIO(content), strict=False)

        if reader.is_encrypted:
            raise HTTPException(
                status_code=400,
                detail=f"{filename} is password-protected"
            )

        if len(reader.pages) == 0:
            raise HTTPException(
                status_code=400,
                detail="PDF contains no pages"
            )

        return reader

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read {filename}: {str(error)}"
        )


# ---------------------------------
# PDF MERGE
# ---------------------------------

@router.post("/pdf/merge", summary="Merge PDFs", response_class=Response)
async def merge_pdfs(files: list[UploadFile] = File(...)):
    writer = PdfWriter()

    try:
        if len(files) < 2:
            raise HTTPException(
                status_code=400,
                detail="Please upload at least two PDF files"
            )

        if len(files) > MAX_FILES:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {MAX_FILES} PDF files are allowed"
            )

        for file in files:
            if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
                raise HTTPException(
                    status_code=400,
                    detail="Only PDF files are supported"
                )

            content = await file.read(MAX_FILE_SIZE + 1)

            if not content:
                raise HTTPException(
                    status_code=400,
                    detail=f"{file.filename} is empty"
                )

            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"{file.filename} exceeds 20 MB"
                )

            reader = read_pdf(content, file.filename)
            writer.append(reader)

        output = BytesIO()
        writer.write(output)

        return Response(
            content=output.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'attachment; filename="merged.pdf"'
            }
        )

    finally:
        writer.close()

        for file in files:
            await file.close()


# ---------------------------------
# PDF SPLIT
# ---------------------------------

@router.post(
    "/pdf/split",
    summary="Split PDF using custom page ranges",
    response_class=Response
)
async def split_pdf(
    file: UploadFile = File(...),
    page_ranges: str = Form(
        default="",
        description="Example: 1-3,4-6. Leave empty for one PDF per page."
    )
):
    try:
        if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported"
            )

        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        total_pages = len(reader.pages)
        ranges = []

        if page_ranges.strip():
            for part in page_ranges.split(","):
                part = part.strip()

                if not part:
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid page range"
                    )

                try:
                    if "-" in part:
                        pieces = part.split("-")

                        if len(pieces) != 2:
                            raise ValueError()

                        start = int(pieces[0].strip())
                        end = int(pieces[1].strip())
                    else:
                        start = int(part)
                        end = start

                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid page range: {part}"
                    )

                if start < 1 or end < start or end > total_pages:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"Invalid range {part}. "
                            f"PDF has {total_pages} pages."
                        )
                    )

                ranges.append((start, end))

        else:
            ranges = [
                (page, page)
                for page in range(1, total_pages + 1)
            ]

        zip_buffer = BytesIO()
        safe_name = Path(file.filename).stem

        with ZipFile(
            zip_buffer,
            mode="w",
            compression=ZIP_DEFLATED
        ) as zip_file:

            for index, (start, end) in enumerate(ranges, start=1):
                writer = PdfWriter()

                try:
                    for page_number in range(start - 1, end):
                        writer.add_page(reader.pages[page_number])

                    page_buffer = BytesIO()
                    writer.write(page_buffer)

                    zip_file.writestr(
                        f"{safe_name}_part_{index}_pages_{start}-{end}.pdf",
                        page_buffer.getvalue()
                    )

                finally:
                    writer.close()

        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition":
                    f'attachment; filename="{safe_name}_split.zip"'
            }
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF splitting failed: {str(error)}"
        )

    finally:
        await file.close()


# ---------------------------------
# PDF ROTATE
# ---------------------------------

@router.post(
    "/pdf/rotate",
    summary="Rotate all pages in a PDF",
    response_class=Response
)
async def rotate_pdf(
    file: UploadFile = File(...),
    rotation: int = Form(
        default=90,
        description="Rotation angle: 90, 180, or 270 degrees clockwise"
    )
):
    try:
        if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported"
            )

        if rotation not in (90, 180, 270):
            raise HTTPException(
                status_code=400,
                detail="Rotation must be 90, 180, or 270 degrees"
            )

        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        writer = PdfWriter()

        try:
            for page in reader.pages:
                page.rotate(rotation)
                writer.add_page(page)

            output = BytesIO()
            writer.write(output)

            safe_name = Path(file.filename).stem

            return Response(
                content=output.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_rotated.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF rotation failed: {str(error)}"
        )

    finally:
        await file.close()


# ---------------------------------
# PDF EXTRACT PAGES
# ---------------------------------

@router.post(
    "/pdf/extract",
    summary="Extract selected pages from a PDF",
    response_class=Response
)
async def extract_pdf_pages(
    file: UploadFile = File(...),
    pages: str = Form(
        ...,
        description="Enter page numbers separated by commas. Example: 1,3,5"
    )
):
    try:
        if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported"
            )

        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        total_pages = len(reader.pages)
        selected_pages = []

        for part in pages.split(","):
            part = part.strip()

            try:
                page_number = int(part)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid page number: {part}"
                )

            if page_number < 1 or page_number > total_pages:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Page {page_number} does not exist. "
                        f"PDF has {total_pages} pages."
                    )
                )

            if page_number in selected_pages:
                raise HTTPException(
                    status_code=400,
                    detail=f"Duplicate page number: {page_number}"
                )

            selected_pages.append(page_number)

        if not selected_pages:
            raise HTTPException(
                status_code=400,
                detail="Please select at least one page"
            )

        writer = PdfWriter()

        try:
            for page_number in selected_pages:
                writer.add_page(reader.pages[page_number - 1])

            output = BytesIO()
            writer.write(output)

            safe_name = Path(file.filename).stem

            return Response(
                content=output.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_extracted.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF extraction failed: {str(error)}"
        )

    finally:
        await file.close()


# ---------------------------------
# PDF DELETE PAGES
# ---------------------------------

@router.post(
    "/pdf/delete-pages",
    summary="Delete selected pages from a PDF",
    response_class=Response
)
async def delete_pdf_pages(
    file: UploadFile = File(...),
    pages: str = Form(
        ...,
        description="Enter page numbers to delete, separated by commas. Example: 2,4"
    )
):
    try:
        if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported"
            )

        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        total_pages = len(reader.pages)
        pages_to_delete = set()

        for part in pages.split(","):
            part = part.strip()

            try:
                page_number = int(part)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid page number: {part}"
                )

            if page_number < 1 or page_number > total_pages:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Page {page_number} does not exist. "
                        f"PDF has {total_pages} pages."
                    )
                )

            if page_number in pages_to_delete:
                raise HTTPException(
                    status_code=400,
                    detail=f"Duplicate page number: {page_number}"
                )

            pages_to_delete.add(page_number)

        if len(pages_to_delete) == total_pages:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete all pages. Keep at least one page."
            )

        writer = PdfWriter()

        try:
            for page_index, page in enumerate(reader.pages, start=1):
                if page_index not in pages_to_delete:
                    writer.add_page(page)

            output = BytesIO()
            writer.write(output)

            safe_name = Path(file.filename).stem

            return Response(
                content=output.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_pages_deleted.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF page deletion failed: {str(error)}"
        )

    finally:
        await file.close()


# ---------------------------------
# PDF REORDER PAGES
# ---------------------------------

@router.post(
    "/pdf/reorder",
    summary="Reorder PDF pages",
    response_class=Response
)
async def reorder_pdf_pages(
    file: UploadFile = File(...),
    pages: str = Form(
        ...,
        description="Enter the complete new page order. Example: 3,1,2,5,4"
    )
):
    try:
        if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported"
            )

        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        total_pages = len(reader.pages)

        page_order = []

        for part in pages.split(","):
            part = part.strip()

            try:
                page_number = int(part)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid page number: {part}"
                )

            if page_number < 1 or page_number > total_pages:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Page {page_number} does not exist. "
                        f"PDF has {total_pages} pages."
                    )
                )

            if page_number in page_order:
                raise HTTPException(
                    status_code=400,
                    detail=f"Duplicate page number: {page_number}"
                )

            page_order.append(page_number)

        expected_pages = set(range(1, total_pages + 1))

        if len(page_order) != total_pages or set(page_order) != expected_pages:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Enter every page exactly once. "
                    f"This PDF has {total_pages} pages."
                )
            )

        writer = PdfWriter()

        try:
            for page_number in page_order:
                writer.add_page(reader.pages[page_number - 1])

            output = BytesIO()
            writer.write(output)

            safe_name = Path(file.filename).stem

            return Response(
                content=output.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_reordered.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF page reordering failed: {str(error)}"
        )

    finally:
        await file.close()

# ---------------------------------
# PDF INSERT PAGES
# ---------------------------------

@router.post(
    "/pdf/insert-pages",
    summary="Insert pages from another PDF",
    response_class=Response
)
async def insert_pdf_pages(
    file: UploadFile = File(...),
    insert_file: UploadFile = File(...),
    position: int = Form(
        ...,
        description="Insert after this page number. Use 0 to insert at the beginning."
    )
):
    try:
        # Validate both filenames
        if (
            not file.filename
            or Path(file.filename).suffix.lower() != ".pdf"
            or not insert_file.filename
            or Path(insert_file.filename).suffix.lower() != ".pdf"
        ):
            raise HTTPException(
                status_code=400,
                detail="Both uploaded files must be PDFs"
            )

        # Read original PDF
        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Original PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Original PDF exceeds 20 MB"
            )

        # Read PDF containing pages to insert
        insert_content = await insert_file.read(MAX_FILE_SIZE + 1)

        if not insert_content:
            raise HTTPException(
                status_code=400,
                detail="PDF to insert is empty"
            )

        if len(insert_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF to insert exceeds 20 MB"
            )

        original_reader = read_pdf(content, file.filename)
        insert_reader = read_pdf(insert_content, insert_file.filename)

        total_pages = len(original_reader.pages)

        # Position must be between 0 and the original page count
        if position < 0 or position > total_pages:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid insertion position. "
                    f"Enter a value between 0 and {total_pages}."
                )
            )

        writer = PdfWriter()

        try:
            # Add original pages before the insertion position
            for page_index in range(position):
                writer.add_page(original_reader.pages[page_index])

            # Insert all pages from the second PDF
            for page in insert_reader.pages:
                writer.add_page(page)

            # Add remaining original pages
            for page_index in range(position, total_pages):
                writer.add_page(original_reader.pages[page_index])

            output = BytesIO()
            writer.write(output)

            safe_name = Path(file.filename).stem

            return Response(
                content=output.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_inserted.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF page insertion failed: {str(error)}"
        )

    finally:
        await file.close()
        await insert_file.close()

# ---------------------------------
# PDF WATERMARK
# ---------------------------------

from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color


@router.post(
    "/pdf/watermark",
    summary="Add a text watermark to a PDF",
    response_class=Response
)
async def watermark_pdf(
    file: UploadFile = File(...),
    watermark_text: str = Form(...)
):
    try:
        # Validate PDF filename
        if (
            not file.filename
            or Path(file.filename).suffix.lower() != ".pdf"
        ):
            raise HTTPException(
                status_code=400,
                detail="Please upload a valid PDF file"
            )

        # Validate watermark text
        watermark_text = watermark_text.strip()

        if not watermark_text:
            raise HTTPException(
                status_code=400,
                detail="Watermark text cannot be empty"
            )

        if len(watermark_text) > 100:
            raise HTTPException(
                status_code=400,
                detail="Watermark text cannot exceed 100 characters"
            )

        # Read uploaded PDF
        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        writer = PdfWriter()

        try:
            # Add watermark to every page
            for page in reader.pages:

                width = float(page.mediabox.width)
                height = float(page.mediabox.height)

                watermark_buffer = BytesIO()

                watermark_canvas = canvas.Canvas(
                    watermark_buffer,
                    pagesize=(width, height)
                )

                watermark_canvas.saveState()

                watermark_canvas.translate(
                    width / 2,
                    height / 2
                )

                watermark_canvas.rotate(45)

                watermark_canvas.setFillColor(
                    Color(0.5, 0.5, 0.5, alpha=0.25)
                )

                watermark_canvas.setFont(
                    "Helvetica-Bold",
                    36
                )

                watermark_canvas.drawCentredString(
                    0,
                    0,
                    watermark_text
                )

                watermark_canvas.restoreState()
                watermark_canvas.save()

                watermark_buffer.seek(0)

                watermark_reader = PdfReader(watermark_buffer)

                page.merge_page(
                    watermark_reader.pages[0]
                )

                writer.add_page(page)

            # Generate output PDF
            output = BytesIO()
            writer.write(output)

            safe_name = Path(file.filename).stem

            return Response(
                content=output.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_watermarked.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF watermark failed: {str(error)}"
        )

    finally:
        await file.close()

# ---------------------------------
# PDF PASSWORD PROTECTION
# ---------------------------------

@router.post(
    "/pdf/protect",
    summary="Protect a PDF with a password",
    response_class=Response
)
async def protect_pdf(
    file: UploadFile = File(...),
    password: str = Form(...)
):
    try:
        # Validate filename
        if (
            not file.filename
            or Path(file.filename).suffix.lower() != ".pdf"
        ):
            raise HTTPException(
                status_code=400,
                detail="Please upload a valid PDF file"
            )

        # Validate password
        if not password or not password.strip():
            raise HTTPException(
                status_code=400,
                detail="Password cannot be empty"
            )

        if len(password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Password must contain at least 8 characters"
            )

        if len(password) > 128:
            raise HTTPException(
                status_code=400,
                detail="Password cannot exceed 128 characters"
            )

        # Read uploaded PDF
        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)

        writer = PdfWriter()

        try:
            # Copy all pages into a new PDF
            for page in reader.pages:
                writer.add_page(page)

            # Encrypt the PDF
            writer.encrypt(
                user_password=password,
                algorithm="AES-256"
            )

            # Generate protected PDF
            output = BytesIO()
            writer.write(output)

            safe_name = Path(file.filename).stem

            return Response(
                content=output.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_protected.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF password protection failed: {str(error)}"
        )

    finally:
        await file.close()

# ---------------------------------
# PDF PAGE NUMBERING
# ---------------------------------

from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color


@router.post(
    "/pdf/page-numbers",
    summary="Add page numbers to a PDF",
    response_class=Response
)
async def add_page_numbers(
    file: UploadFile = File(...),
    start_number: int = Form(1)
):
    try:
        # Validate PDF filename
        if (
            not file.filename
            or Path(file.filename).suffix.lower() != ".pdf"
        ):
            raise HTTPException(
                status_code=400,
                detail="Please upload a valid PDF file"
            )

        # Validate starting number
        if start_number < 1 or start_number > 100000:
            raise HTTPException(
                status_code=400,
                detail="Starting number must be between 1 and 100000"
            )

        # Read uploaded PDF
        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        writer = PdfWriter()

        try:
            # Add page numbers to every page
            for index, page in enumerate(reader.pages):

                width = float(page.mediabox.width)
                height = float(page.mediabox.height)

                number = str(start_number + index)

                number_buffer = BytesIO()

                number_canvas = canvas.Canvas(
                    number_buffer,
                    pagesize=(width, height)
                )

                number_canvas.saveState()

                number_canvas.setFillColor(
                    Color(0, 0, 0, alpha=0.85)
                )

                number_canvas.setFont(
                    "Helvetica",
                    10
                )

                number_canvas.drawCentredString(
                    width / 2,
                    25,
                    number
                )

                number_canvas.restoreState()
                number_canvas.save()

                number_buffer.seek(0)

                number_reader = PdfReader(number_buffer)

                page.merge_page(
                    number_reader.pages[0]
                )

                writer.add_page(page)

            # Generate output PDF
            output = BytesIO()
            writer.write(output)

            safe_name = Path(file.filename).stem

            return Response(
                content=output.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_numbered.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF page numbering failed: {str(error)}"
        )

    finally:
        await file.close()

# ---------------------------------
# PDF UNLOCK / REMOVE PASSWORD
# ---------------------------------

@router.post(
    "/pdf/unlock",
    summary="Remove password protection from a PDF",
    response_class=Response
)
async def unlock_pdf(
    file: UploadFile = File(...),
    password: str = Form(...)
):
    try:
        # Validate PDF filename
        if (
            not file.filename
            or Path(file.filename).suffix.lower() != ".pdf"
        ):
            raise HTTPException(
                status_code=400,
                detail="Please upload a valid PDF file"
            )

        # Validate password input
        if not password:
            raise HTTPException(
                status_code=400,
                detail="PDF password is required"
            )

        # Read uploaded PDF
        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        # Read PDF
        try:
            reader = PdfReader(BytesIO(content), strict=False)

            if not reader.is_encrypted:
                raise HTTPException(
                    status_code=400,
                    detail="This PDF is not password-protected"
                )

            # Authenticate using the supplied password
            result = reader.decrypt(password)

            if not result:
                raise HTTPException(
                    status_code=401,
                    detail="Incorrect PDF password"
                )

        except HTTPException:
            raise

        except Exception as error:
            raise HTTPException(
                status_code=400,
                detail=f"Unable to read PDF: {str(error)}"
            )

        # Create an unprotected copy
        writer = PdfWriter()

        try:
            for page in reader.pages:
                writer.add_page(page)

            output = BytesIO()
            writer.write(output)

            safe_name = Path(file.filename).stem

            return Response(
                content=output.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_unlocked.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF unlocking failed: {str(error)}"
        )

    finally:
        await file.close()


# ---------------------------------
# PDF COMPRESSION
# ---------------------------------

@router.post(
    "/pdf/compress",
    summary="Compress and optimize a PDF",
    response_class=Response
)
async def compress_pdf(
    file: UploadFile = File(...)
):
    try:
        # Validate PDF filename
        if (
            not file.filename
            or Path(file.filename).suffix.lower() != ".pdf"
        ):
            raise HTTPException(
                status_code=400,
                detail="Please upload a valid PDF file"
            )

        # Read uploaded PDF
        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        writer = PdfWriter()

        try:
            # Add pages first, then compress
            for page in reader.pages:
                writer.add_page(page)

            for page in writer.pages:
                page.compress_content_streams()

            # Generate compressed PDF
            output = BytesIO()
            writer.write(output)

            compressed_content = output.getvalue()

            safe_name = Path(file.filename).stem

            return Response(
                content=compressed_content,
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_compressed.pdf"',
                    "X-Original-Size": str(len(content)),
                    "X-Compressed-Size": str(len(compressed_content))
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF compression failed: {str(error)}"
        )

    finally:
        await file.close()

# ---------------------------------
# PDF CROP
# ---------------------------------

@router.post(
    "/pdf/crop",
    summary="Crop PDF page margins",
    response_class=Response
)
async def crop_pdf(
    file: UploadFile = File(...),
    left: float = Form(20),
    right: float = Form(20),
    top: float = Form(20),
    bottom: float = Form(20)
):
    try:
        # Validate filename
        if (
            not file.filename
            or Path(file.filename).suffix.lower() != ".pdf"
        ):
            raise HTTPException(
                status_code=400,
                detail="Please upload a valid PDF file"
            )

        # Validate crop values
        margins = [left, right, top, bottom]

        if any(value < 0 for value in margins):
            raise HTTPException(
                status_code=400,
                detail="Crop values cannot be negative"
            )

        # Read uploaded PDF
        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        writer = PdfWriter()

        try:
            # Add pages to writer
            for page in reader.pages:
                writer.add_page(page)

            # Crop each page
            for page in writer.pages:
                box = page.cropbox

                x1 = float(box.left) + left
                y1 = float(box.bottom) + bottom
                x2 = float(box.right) - right
                y2 = float(box.top) - top

                if x1 >= x2 or y1 >= y2:
                    raise HTTPException(
                        status_code=400,
                        detail="Crop values are too large for the page size"
                    )

                page.cropbox.lower_left = (x1, y1)
                page.cropbox.upper_right = (x2, y2)

            # Generate cropped PDF
            output = BytesIO()
            writer.write(output)

            cropped_content = output.getvalue()

            safe_name = Path(file.filename).stem

            return Response(
                content=cropped_content,
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_cropped.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF cropping failed: {str(error)}"
        )

    finally:
        await file.close()

# ---------------------------------
# PDF HEADER AND FOOTER
# ---------------------------------

@router.post(
    "/pdf/header-footer",
    summary="Add header or footer to PDF",
    response_class=Response
)
async def add_header_footer(
    file: UploadFile = File(...),
    text: str = Form(...),
    position: str = Form("footer"),
    font_size: int = Form(10)
):
    try:
        # Validate filename
        if (
            not file.filename
            or Path(file.filename).suffix.lower() != ".pdf"
        ):
            raise HTTPException(
                status_code=400,
                detail="Please upload a valid PDF file"
            )

        # Validate input
        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Header or footer text cannot be empty"
            )

        position = position.lower().strip()

        if position not in ["header", "footer"]:
            raise HTTPException(
                status_code=400,
                detail="Position must be header or footer"
            )

        if font_size < 6 or font_size > 24:
            raise HTTPException(
                status_code=400,
                detail="Font size must be between 6 and 24"
            )

        # Read PDF
        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        writer = PdfWriter()

        try:
            for original_page in reader.pages:
                writer.add_page(original_page)

            # Add header/footer to each page
            for page in writer.pages:
                width = float(page.mediabox.width)
                height = float(page.mediabox.height)

                overlay_buffer = BytesIO()

                pdf_canvas = canvas.Canvas(
                    overlay_buffer,
                    pagesize=(width, height)
                )

                pdf_canvas.setFont("Helvetica", font_size)

                if position == "header":
                    y_position = height - 30
                else:
                    y_position = 20

                pdf_canvas.drawCentredString(
                    width / 2,
                    y_position,
                    text
                )

                pdf_canvas.save()
                overlay_buffer.seek(0)

                overlay_reader = PdfReader(overlay_buffer)
                page.merge_page(overlay_reader.pages[0])

            # Generate output
            output = BytesIO()
            writer.write(output)

            result = output.getvalue()

            safe_name = Path(file.filename).stem

            return Response(
                content=result,
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_{position}.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Header/footer operation failed: {str(error)}"
        )

    finally:
        await file.close()

# ---------------------------------
# PDF BOOKMARK
# ---------------------------------

@router.post(
    "/pdf/bookmark",
    summary="Add a bookmark to a PDF",
    response_class=Response
)
async def add_pdf_bookmark(
    file: UploadFile = File(...),
    title: str = Form(...),
    page_number: int = Form(...)
):
    try:
        # Validate filename
        if (
            not file.filename
            or Path(file.filename).suffix.lower() != ".pdf"
        ):
            raise HTTPException(
                status_code=400,
                detail="Please upload a valid PDF file"
            )

        # Validate bookmark title
        if not title.strip():
            raise HTTPException(
                status_code=400,
                detail="Bookmark title cannot be empty"
            )

        # Read uploaded PDF
        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds 20 MB"
            )

        reader = read_pdf(content, file.filename)
        writer = PdfWriter()

        try:
            # Copy all pages
            for page in reader.pages:
                writer.add_page(page)

            # Validate page number
            if page_number < 1 or page_number > len(writer.pages):
                raise HTTPException(
                    status_code=400,
                    detail=f"Page number must be between 1 and {len(writer.pages)}"
                )

            # Add bookmark
            writer.add_outline_item(
                title=title.strip(),
                page_number=page_number - 1
            )

            # Generate bookmarked PDF
            output = BytesIO()
            writer.write(output)

            result = output.getvalue()

            safe_name = Path(file.filename).stem

            return Response(
                content=result,
                media_type="application/pdf",
                headers={
                    "Content-Disposition":
                        f'attachment; filename="{safe_name}_bookmarked.pdf"'
                }
            )

        finally:
            writer.close()

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF bookmark creation failed: {str(error)}"
        )

    finally:
        await file.close()
