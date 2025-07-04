# PDF QnA Chatbot

A simple, modern web application that lets you upload a PDF, view it in your browser, and ask natural language questions about its content. Answers are generated using Google Gemini (via the free API) and are based only on the PDF you upload.

## Features
- Upload and view any PDF in the browser
- Ask questions about the PDF and get AI-generated answers
- Modern, clean UI with side-by-side PDF viewer and chat
- Uses Retrieval-Augmented Generation (RAG) to ensure answers are grounded in the PDF

## Tech Stack
- **Frontend:** React (Vite), Material UI, react-pdf
- **Backend:** FastAPI, PyMuPDF, sentence-transformers, ChromaDB, google-generativeai

## How It Works
1. **Upload PDF:**
   - The backend extracts text from the PDF.
   - If the PDF is small (less than 2000 characters), the entire text is embedded and used as context.
   - If the PDF is large, it is split into overlapping chunks, each chunk is embedded, and all are stored in ChromaDB for retrieval.
2. **Ask a Question:**
   - The backend retrieves the top 3 most relevant chunks (or the whole PDF if small) using vector search.
   - These chunks are sent, along with your question, to Gemini for answer generation.
   - The answer is returned and displayed in the chat interface.

## Installation & Running

### 1. Backend
- Go to the `backend` directory:
  ```bash
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  ```
- Create a `.env` file in the `backend` directory with your Gemini API key:
  ```
  GEMINI_API_KEY=your-gemini-api-key-here
  ```
- Start the backend server:
  ```bash
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
  ```

### 2. Frontend
- Go to the `frontend` directory:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- Open [http://localhost:5173](http://localhost:5173) in your browser.

## What Happens When You Upload a PDF?
- **Small PDF:**
  - The entire PDF is embedded as a single chunk. All questions are answered using the full text.
- **Large PDF:**
  - The PDF is split into overlapping chunks (1200 characters with 300 overlap). Only the top 3 most relevant chunks are used to answer each question, making answers more focused and concise.

## Notes
- The app uses the free Gemini API (via `google-generativeai`) with the model `models/gemini-1.5-flash`. You need an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- All answers are generated based only on the content of the uploaded PDF.
- The UI is designed for clarity and ease of use, with a persistent chat input and animated chat bubbles. 