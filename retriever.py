from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from pypdf import PdfReader

VECTOR_DIR = Path(__file__).resolve().parent / "vector_db"


class NoExtractableTextError(Exception):
    """Raised when a PDF has no extractable text (e.g. scanned pages, image-only)."""


def get_embeddings():
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


def get_retriever():
    VECTOR_DIR.mkdir(parents=True, exist_ok=True)
    vectordb = Chroma(
        persist_directory=str(VECTOR_DIR),
        embedding_function=get_embeddings(),
    )
    return vectordb


def _load_pdf_documents(path: str, source_label: str) -> list[Document]:
    """Extract text per page without langchain_community loaders (avoids importing spacy via text_splitters)."""
    reader = PdfReader(path)
    docs: list[Document] = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        docs.append(
            Document(
                page_content=text,
                metadata={"page": i + 1, "source": source_label},
            )
        )
    return docs


def _chunk_text(
    text: str,
    *,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> list[str]:
    """Overlapping fixed-size chunks (avoids langchain_text_splitters, which imports spacy in __init__)."""
    text = text.strip()
    if not text:
        return []
    chunks: list[str] = []
    i = 0
    while i < len(text):
        end = min(i + chunk_size, len(text))
        piece = text[i:end].strip()
        if piece:
            chunks.append(piece)
        if end >= len(text):
            break
        i = max(i + 1, end - chunk_overlap)
    return chunks


def ingest_pdf(path: str, *, source_label: str | None = None) -> int:
    """Load a PDF from disk, chunk it, and add chunks to the vector store. Returns number of chunks added."""
    label = source_label or path
    docs = _load_pdf_documents(path, label)
    merged = "\n\n".join(d.page_content for d in docs if d.page_content.strip())
    parts = _chunk_text(merged, chunk_size=1000, chunk_overlap=200)
    chunks = [
        Document(page_content=p, metadata={"source": label})
        for p in parts
    ]
    if not chunks:
        raise NoExtractableTextError(
            "No text could be extracted from this PDF. "
            "It may be scanned or image-only; try OCR or a text-based export."
        )
    store = get_retriever()
    store.add_documents(chunks)
    return len(chunks)


def retrieve_context(query, k=3):

    vectordb = get_retriever()
    docs = vectordb.similarity_search(query, k=k)

    context = "\n\n".join([d.page_content for d in docs])
    return context
