# PDF QnA Chatbot

A full-stack RAG-based PDF question-answering chatbot with advanced features including document summarization and interactive chat with memory.

## Features

- **PDF Upload & Processing**: Upload PDF documents and extract text using PyMuPDF
- **RAG-based QnA**: Ask questions about uploaded PDFs using semantic search and Gemini 2.5
- **Document Summarization**: Generate comprehensive summaries of PDF content
- **Chat Memory**: Maintains conversation context across multiple questions
- **Dark Mode Toggle**: Switch between light and dark themes
- **Modern UI**: Responsive design with custom color palette and animations
- **Clipboard Integration**: Copy chat responses with one click
- **Real-time Processing**: Live feedback during document processing

## Technical Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with async support
- **PDF Processing**: PyMuPDF for text extraction and metadata handling
- **Vector Database**: ChromaDB for semantic search and document storage
- **Embeddings**: Sentence-transformers for text vectorization
- **LLM Integration**: Google Gemini 2.5 Flash for text generation
- **Memory Management**: In-memory storage with conversation history
- **Error Handling**: Comprehensive error handling with detailed logging

### Frontend (React + Vite)
- **Framework**: React 18 with functional components and hooks
- **Build Tool**: Vite for fast development and optimized builds
- **PDF Viewer**: react-pdf for document display and navigation
- **UI Library**: Material-UI (MUI) with custom theming
- **Styling**: CSS-in-JS with custom color palette and animations
- **State Management**: React useState and useEffect for local state
- **HTTP Client**: Fetch API for backend communication

### RAG Implementation
- **Document Chunking**: Adaptive chunking based on document size
- **Semantic Search**: Vector similarity search using ChromaDB
- **Context Retrieval**: Intelligent context selection with fallback mechanisms
- **Prompt Engineering**: Optimized prompts for better response quality
- **Memory Integration**: Conversation history included in context

## How It Works

### 1. PDF Upload & Processing
- User uploads PDF through drag-and-drop or file picker
- Backend extracts text using PyMuPDF with metadata preservation
- Text is chunked into smaller segments for efficient processing
- Chunks are embedded using sentence-transformers and stored in ChromaDB

### 2. Question Answering
- User submits question through chat interface
- Question is embedded and used for semantic search in ChromaDB
- Most relevant document chunks are retrieved based on similarity
- Retrieved context, question, and conversation history are sent to Gemini 2.5
- Response is generated and displayed with source context

### 3. Document Summarization
- Full document text is sent to Gemini 2.5 with summarization prompt
- AI generates comprehensive summary covering key points and structure
- Summary is displayed in a dedicated modal with copy functionality

### 4. Memory System
- Conversation history is maintained in backend memory
- Last N messages are included in context for each new question

## Installation & Setup

### Prerequisites
- Python 3.10 or 3.11 (for compatibility with dependencies)
- Node.js 16+ and npm
- Google Gemini API key

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the backend directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`

## API Endpoints

- `POST /upload`: Upload and process PDF documents
- `POST /ask`: Ask questions about uploaded documents
- `POST /summarize`: Generate document summaries
- `GET /health`: Health check endpoint

## Configuration

### Backend Configuration
- **Chunk Size**: Configurable text chunking (default: 1000 characters)
- **Chunk Overlap**: Overlap between chunks for better context (default: 200 characters)
- **Retrieval Count**: Number of chunks to retrieve for context (default: 5)
- **Memory Size**: Number of conversation messages to remember (default: 5)

### Frontend Configuration
- **Theme**: Custom color palette with dark/light mode support
- **PDF Viewer**: Configurable zoom and navigation options
- **Chat Interface**: Responsive design with mobile support

## Challenges Faced & Solutions

### 1. API Model Compatibility
**Challenge**: Initial use of `gemini-pro` model resulted in 404 errors
**Solution**: Switched to `models/gemini-1.5-flash` which is available in the free tier

### 2. RAG Response Quality
**Challenge**: AI responses often claimed information was "not in the PDF"
**Solution**: 
- Implemented adaptive chunking (single chunk for small files)
- Added fallback to full document text when retrieval fails
- Improved prompt engineering with better context instructions
- Increased retrieval count and chunk overlap

### 3. Backend Hanging Issues
**Challenge**: Frontend would hang during PDF upload and question processing
**Solution**: 
- Added comprehensive error handling and logging
- Implemented timeout mechanisms
- Added progress indicators and user feedback
- Improved async/await patterns

### 4. Frontend State Management
**Challenge**: Complex state management for multiple features (chat, PDF viewer, modals)
**Solution**: 
- Organized state into logical groups
- Used React hooks effectively for state updates
- Implemented proper cleanup and error boundaries

### 5. PDF Processing Edge Cases
**Challenge**: Handling various PDF formats, corrupted files, and empty documents
**Solution**: 
- Added robust error handling for PDF extraction
- Implemented file validation and size limits
- Added fallback mechanisms for processing failures

### 6. UI/UX Design
**Challenge**: Creating an intuitive interface for complex functionality
**Solution**: 
- Implemented modern, flat design with custom color palette
- Added smooth animations and transitions
- Created responsive layout with mobile support
- Integrated dark mode for better accessibility

### 7. Memory Management
**Challenge**: Maintaining conversation context without overwhelming the AI
**Solution**: 
- Implemented sliding window memory (last N messages)
- Added context length management
- Optimized prompt structure for better memory usage

### 8. Cross-Platform Compatibility
**Challenge**: Ensuring consistent behavior across different operating systems
**Solution**: 
- Used cross-platform Python and Node.js packages
- Tested on multiple operating systems
- Added platform-specific instructions in documentation

## Performance Optimizations

- **Lazy Loading**: PDF pages loaded on demand
- **Caching**: Vector embeddings cached in ChromaDB
- **Async Processing**: Non-blocking operations for better responsiveness
- **Memory Management**: Efficient state management and cleanup
- **Error Recovery**: Graceful handling of API failures and timeouts

## Security Considerations

- **API Key Protection**: Environment variable storage for sensitive data
- **File Validation**: PDF file type and size validation
- **Input Sanitization**: Proper handling of user inputs
- **CORS Configuration**: Proper cross-origin resource sharing setup

## Future Enhancements

- **Multi-document Support**: Handle multiple PDFs simultaneously
- **Advanced Search**: Full-text search with filters
- **Export Features**: Export summaries and glossaries
- **User Authentication**: Multi-user support with document sharing
- **Advanced Analytics**: Usage statistics and performance metrics
- **Mobile App**: Native mobile application development

## Troubleshooting

### Common Issues
1. **Backend Connection Errors**: Ensure backend is running on port 8000
2. **PDF Upload Failures**: Check file size and format
3. **API Key Errors**: Verify Gemini API key in .env file
4. **Memory Issues**: Restart backend if memory usage is high
5. **UI Rendering Issues**: Clear browser cache and restart frontend

### Debug Mode
Enable detailed logging by setting environment variables:
```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 