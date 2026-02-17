from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.1:8b")

response = llm.invoke("Explain OSI model in one sentence")
print(response)
