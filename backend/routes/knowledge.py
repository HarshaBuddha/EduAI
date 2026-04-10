import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from retriever import NoExtractableTextError, ingest_pdf

router = APIRouter()


@router.post("/knowledge/upload")
async def upload_knowledge(file: UploadFile = File(...)):
    """
    Ingest a PDF into the Chroma vector store used by /ai/chat (RAG).
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    suffix = os.path.splitext(file.filename)[1] or ".pdf"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        try:
            n_chunks = ingest_pdf(tmp_path, source_label=file.filename)
        except NoExtractableTextError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
    finally:
        if tmp_path and os.path.isfile(tmp_path):
            os.unlink(tmp_path)

    return {
        "filename": file.filename,
        "chunks_indexed": n_chunks,
        "message": "Document added to knowledge base.",
    }
