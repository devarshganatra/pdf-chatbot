import os
import tempfile
from fastapi import FastAPI, File, UploadFile, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langchain_community.document_loaders import PyMuPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from dotenv import load_dotenv
import logging
import re
import json
load_dotenv()

# --- Config ---
CHROMA_PATH = "./chroma_db"
EMBED_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 300
TOP_K = 3

# --- Gemini API Key ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

# --- App Setup ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Embedding Model ---
embedder = SentenceTransformer(EMBED_MODEL)

# --- ChromaDB Setup ---
chroma_client = chromadb.Client(Settings(persist_directory=CHROMA_PATH))
collection = chroma_client.get_or_create_collection("pdf_chunks")

# --- Store last uploaded PDF text globally for fallback
last_pdf_text = ""

# --- PDF Upload Endpoint ---
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global last_pdf_text
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        logging.info(f"Saved uploaded PDF to {tmp_path}")
        loader = PyMuPDFLoader(tmp_path)
        docs = loader.load()
        logging.info(f"Loaded {len(docs)} documents from PDF")
        # Combine all text for small PDF logic
        full_text = "\n".join([doc.page_content for doc in docs])
        last_pdf_text = full_text  # Save for fallback
        if len(full_text) < 2000:
            texts = [full_text]
            metadatas = [{"source": file.filename, "chunk": 0}]
        else:
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=300)
            chunks = text_splitter.split_documents(docs)
            texts = [chunk.page_content for chunk in chunks]
            metadatas = [{"source": file.filename, "chunk": i} for i in range(len(texts))]
        embeddings = embedder.encode(texts).tolist()
        # Clear previous collection
        collection.delete()
        collection.add(
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=[f"{file.filename}_{i}" for i in range(len(texts))]
        )
        os.remove(tmp_path)
        logging.info(f"Processed and indexed {len(texts)} chunks.")
        # Log all documents in ChromaDB
        all_docs = collection.get()["documents"]
        print("==== All documents in ChromaDB after upload ====")
        print(all_docs)
        print("================================================")
        return {"message": "PDF processed and indexed.", "chunks": len(texts)}
    except Exception as e:
        logging.exception("Error processing PDF upload")
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- Ask Endpoint ---
@app.post("/ask")
async def ask_question(question: str = Form(...), memory: str = Form(None)):
    global last_pdf_text
    try:
        # Embed question
        q_emb = embedder.encode([question]).tolist()[0]
        # Query Chroma
        results = collection.query(query_embeddings=[q_emb], n_results=TOP_K)
        retrieved = results["documents"][0] if results["documents"] else []
        context = "\n---\n".join(retrieved)
        # Log the context
        print("==== Retrieved context for question ====")
        print(context)
        print("========================================")
        # Log all documents in ChromaDB before answering
        all_docs = collection.get()["documents"]
        print("==== All documents in ChromaDB before answering ====")
        print(all_docs)
        print("==================================================")
        # If no context found, fallback to whole PDF
        if not context.strip():
            context = last_pdf_text
        prompt = (
            (f"Conversation history:\n{memory}\n\n" if memory else "") +
            "You are a helpful assistant. Use the following PDF content to answer the user's question as concisely and accurately as possible. "
            "If the answer is not present, say 'I could not find the answer in the PDF.'\n\n"
            "PDF Content:\n"
            f"{context}\n\n"
            "Question:\n"
            f"{question}\n"
            "Answer:"
        )
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        response = model.generate_content(prompt)
        answer = response.text.strip() if hasattr(response, "text") else str(response)
        return JSONResponse({"answer": answer, "context": context})
    except Exception as e:
        logging.exception("Error answering question")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/summarize")
async def summarize_pdf(words: int = Query(200, description="Approximate number of words for the summary")):
    global last_pdf_text
    try:
        if not last_pdf_text.strip():
            return JSONResponse(status_code=400, content={"error": "No PDF uploaded."})
        prompt = (
            f"Summarize the following PDF content in about {words} words. Be detailed and descriptive.\n\nPDF Content:\n"
            f"{last_pdf_text}\n\nSummary:"
        )
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        response = model.generate_content(prompt)
        summary = response.text.strip() if hasattr(response, "text") else str(response)
        return JSONResponse({"summary": summary})
    except Exception as e:
        logging.exception("Error summarizing PDF")
        return JSONResponse(status_code=500, content={"error": str(e)}) 