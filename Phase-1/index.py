from loaders import load_syllabus
from rag_pipeline import chunk_documents, create_vector_store

docs = load_syllabus("data/syllabus.pdf")
chunks = chunk_documents(docs)
create_vector_store(chunks)

print("Syllabus indexed successfully!")
