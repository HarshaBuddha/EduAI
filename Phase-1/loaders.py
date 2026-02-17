from langchain_community.document_loaders import PyPDFLoader

def load_syllabus(path):
    loader = PyPDFLoader(path)
    return loader.load()

docs = load_syllabus("data/syllabus.pdf")
print(docs[0].page_content[:200])
