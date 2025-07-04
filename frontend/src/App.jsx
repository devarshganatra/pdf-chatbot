import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Container, Paper, TextField, Typography, CircularProgress, List, ListItem, Alert, Fade } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import './App.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chat, setChat] = useState([]);
  const [question, setQuestion] = useState('');
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef();
  const chatEndRef = useRef();

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      uploadPDF(file);
    }
  };

  const uploadPDF = async (file) => {
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      setChat([]);
    } catch (e) {
      setError('Failed to upload PDF. Please try again.');
    }
    setUploading(false);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAnswering(true);
    setError('');
    setChat((prev) => [...prev, { type: 'user', text: question }]);
    const formData = new FormData();
    formData.append('question', question);
    try {
      const res = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        setChat((prev) => [...prev, { type: 'bot', text: err.error || 'Error answering question.' }]);
      } else {
        const data = await res.json();
        setChat((prev) => [...prev, { type: 'bot', text: data.answer }]);
      }
    } catch (e) {
      setChat((prev) => [...prev, { type: 'bot', text: 'Server error. Please try again.' }]);
    }
    setQuestion('');
    setAnswering(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600, letterSpacing: 1 }}>PDF QnA Chatbot</Typography>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mt: 2, flex: 1, alignItems: 'stretch' }}>
        <Paper elevation={2} sx={{ flex: 1, minWidth: 350, maxWidth: 600, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 600, maxHeight: 800, height: 800, overflow: 'hidden' }}>
          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mb: 2, fontWeight: 500, fontSize: 16 }}
          >
            Upload PDF
            <input
              type="file"
              accept="application/pdf"
              hidden
              ref={fileInput}
              onChange={handleFileChange}
            />
          </Button>
          {uploading && <CircularProgress size={24} sx={{ mt: 2 }} />}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {pdfFile && !uploading && (
            <Box sx={{ mt: 2, width: '100%', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: 700 }}>
              <Document
                file={pdfFile}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<CircularProgress />}
              >
                {Array.from(new Array(numPages), (el, idx) => (
                  <Page key={`page_${idx + 1}`} pageNumber={idx + 1} width={500} renderTextLayer={false} renderAnnotationLayer={false} />
                ))}
              </Document>
            </Box>
          )}
        </Paper>
        <Paper elevation={2} sx={{ flex: 1, minWidth: 350, maxWidth: 600, p: 0, display: 'flex', flexDirection: 'column', minHeight: 600, maxHeight: 800, height: 800, bgcolor: '#f7f9fa', position: 'relative' }}>
          <Box sx={{ flex: 1, p: 3, overflowY: 'auto', borderBottom: '1px solid #e0e0e0', bgcolor: '#f7f9fa', display: 'flex', flexDirection: 'column' }}>
            <List sx={{ display: 'flex', flexDirection: 'column' }}>
              {chat.map((msg, idx) => (
                <Fade in={true} timeout={500} key={idx}>
                  <ListItem alignItems={msg.type === 'user' ? 'right' : 'left'} sx={{ justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', border: 'none', background: 'none' }}>
                    <Box
                      sx={{
                        bgcolor: msg.type === 'user' ? 'primary.main' : 'grey.200',
                        color: msg.type === 'user' ? 'primary.contrastText' : 'text.primary',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        maxWidth: '80%',
                        boxShadow: 1,
                        fontSize: 16,
                        textAlign: msg.type === 'user' ? 'right' : 'left',
                        transition: 'background 0.3s',
                      }}
                    >
                      {msg.text}
                    </Box>
                  </ListItem>
                </Fade>
              ))}
            </List>
            <div ref={chatEndRef} />
            {answering && <CircularProgress size={20} sx={{ mt: 1 }} />}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, p: 2, bgcolor: '#f7f9fa', borderTop: '1px solid #e0e0e0', position: 'sticky', bottom: 0, zIndex: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask a question about the PDF..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              disabled={!pdfFile || uploading || answering}
              sx={{ fontSize: 16 }}
            />
            <Button
              variant="contained"
              onClick={handleAsk}
              disabled={!pdfFile || uploading || answering || !question.trim()}
              sx={{ fontWeight: 500, fontSize: 16 }}
            >
              Ask
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 