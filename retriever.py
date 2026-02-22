from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

def get_retriever():

    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

    vectordb = Chroma(
        persist_directory="../vector_db",
        embedding_function=embeddings
    )

    return vectordb

def retrieve_context(query, k=3):

    vectordb = get_retriever()
    docs = vectordb.similarity_search(query, k=k)

    context = "\n\n".join([d.page_content for d in docs])
    return context
