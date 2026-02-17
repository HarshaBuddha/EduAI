from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

vectordb = Chroma(
    persist_directory="vector_db",
    embedding_function=embeddings
)

retriever = vectordb.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={
        "k": 3,
        "score_threshold": 0.5
    }
)

query = "What is Docker"
results = retriever.invoke(query)

if not results:
    print("Not covered in the provided syllabus.")
else:
    for r in results:
        print("----")
        print(r.page_content)
