import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Container, Paper, TextField, Typography, CircularProgress, List, ListItem, Alert, Fade, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Switch, Tooltip } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QuizIcon from '@mui/icons-material/Quiz';
import SummarizeIcon from '@mui/icons-material/Summarize';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import './App.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PALETTE = {
  light: {
    green: '#748873',
    tan: '#D1A980',
    light: '#E5E0D8',
    lighter: '#F8F8F8',
    text: '#222',
    chatUser: '#748873',
    chatBot: '#D1A980',
    gradient: 'linear-gradient(135deg, #748873 0%, #E5E0D8 100%)',
  },
  dark: {
    green: '#A3B18A',
    tan: '#D1A980',
    light: '#222',
    lighter: '#2D2D2D',
    text: '#F8F8F8',
    chatUser: '#A3B18A',
    chatBot: '#D1A980',
    gradient: 'linear-gradient(135deg, #222 0%, #748873 100%)',
  }
};
const FONT_FAMILY = 'Inter, Segoe UI, Arial, sans-serif';
const MAX_MEMORY = 5;

export default function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chat, setChat] = useState([]);
  const [question, setQuestion] = useState('');
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showGradient, setShowGradient] = useState(true);
  const [summary, setSummary] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const fileInput = useRef();
  const chatEndRef = useRef();
  const palette = darkMode ? PALETTE.dark : PALETTE.light;

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
    setSummary('');
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
    const newChat = [...chat, { type: 'user', text: question }];
    setChat(newChat);
    const formData = new FormData();
    formData.append('question', question);
    const memory = newChat.slice(-MAX_MEMORY * 2).map(m => (m.type === 'user' ? `User: ${m.text}` : `Bot: ${m.text}`)).join('\n');
    formData.append('memory', memory);
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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleSummarize = async () => {
    setSummary('');
    setSummaryOpen(true);
    try {
      const res = await fetch('http://localhost:8000/summarize');
      const data = await res.json();
      setSummary(data.summary || data.error || 'No summary available.');
    } catch {
      setSummary('Error summarizing PDF.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', background: showGradient ? palette.gradient : palette.lighter, fontFamily: FONT_FAMILY, py: 0, m: 0, transition: 'background 0.5s' }}>
      <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Paper elevation={0} sx={{ mb: 4, background: 'none', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, letterSpacing: 1, color: palette.green, fontFamily: FONT_FAMILY, flex: 1 }}>PDF QnA Chatbot</Typography>
          <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
            <IconButton onClick={() => setDarkMode((d) => !d)} sx={{ ml: 2, color: palette.green }}>
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={showGradient ? 'Flat background' : 'Gradient background'}>
            <Switch checked={showGradient} onChange={() => setShowGradient((g) => !g)} color="default" sx={{ ml: 1 }} />
          </Tooltip>
        </Paper>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mt: 2, flex: 1, alignItems: 'stretch' }}>
          <Paper elevation={1} sx={{ flex: 1, minWidth: 350, maxWidth: 600, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 600, maxHeight: 800, height: 800, overflow: 'hidden', background: palette.light }}>
            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mb: 2, fontWeight: 600, fontSize: 17, background: palette.green, color: '#fff', letterSpacing: 1, boxShadow: 'none', borderRadius: 0 }}
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
            <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 2 }}>
              <Button variant="outlined" startIcon={<SummarizeIcon />} onClick={handleSummarize} disabled={!pdfFile || uploading} sx={{ color: palette.green, borderColor: palette.green, fontWeight: 600, borderRadius: 0, flex: 1 }}>
                Summarize PDF
              </Button>
            </Box>
            {uploading && <CircularProgress size={24} sx={{ mt: 2, color: palette.green }} />}
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
          <Paper elevation={1} sx={{ flex: 1, minWidth: 350, maxWidth: 600, p: 0, display: 'flex', flexDirection: 'column', minHeight: 600, maxHeight: 800, height: 800, bgcolor: palette.lighter, position: 'relative', boxShadow: 'none', borderRadius: 0 }}>
            <Box sx={{ flex: 1, p: 3, overflowY: 'auto', borderBottom: `1px solid ${palette.light}`, bgcolor: palette.lighter, display: 'flex', flexDirection: 'column' }}>
              <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {chat.map((msg, idx) => (
                  <Fade in={true} timeout={500} key={idx}>
                    <ListItem alignItems={msg.type === 'user' ? 'right' : 'left'} sx={{ justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', border: 'none', background: 'none', px: 0 }}>
                      <Box
                        sx={{
                          bgcolor: msg.type === 'user' ? palette.chatUser : palette.chatBot,
                          color: '#fff',
                          px: 2.5,
                          py: 1.5,
                          borderRadius: 0,
                          maxWidth: '80%',
                          boxShadow: 0,
                          fontSize: 17,
                          textAlign: msg.type === 'user' ? 'right' : 'left',
                          fontWeight: 500,
                          letterSpacing: 0.2,
                          transition: 'background 0.3s',
                          position: 'relative',
                        }}
                      >
                        {msg.text}
                        {msg.type === 'bot' && (
                          <Tooltip title="Copy answer">
                            <IconButton size="small" sx={{ ml: 1, color: palette.lighter, position: 'absolute', right: -36, top: 8 }} onClick={() => handleCopy(msg.text)}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItem>
                  </Fade>
                ))}
              </List>
              <div ref={chatEndRef} />
              {answering && <CircularProgress size={20} sx={{ mt: 1, color: palette.tan }} />}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, p: 2, bgcolor: palette.lighter, borderTop: `1px solid ${palette.light}`, position: 'sticky', bottom: 0, zIndex: 2, borderRadius: 0 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask a question about the PDF..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
                disabled={!pdfFile || uploading || answering}
                sx={{ fontSize: 17, background: '#fff', borderRadius: 0 }}
              />
              <Button
                variant="contained"
                onClick={handleAsk}
                disabled={!pdfFile || uploading || answering || !question.trim()}
                sx={{ fontWeight: 600, fontSize: 17, borderRadius: 0, background: palette.tan, color: '#fff', boxShadow: 'none' }}
              >
                Ask
              </Button>
            </Box>
          </Paper>
        </Box>
        <Dialog open={summaryOpen} onClose={() => setSummaryOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: palette.green, color: '#fff', fontWeight: 600 }}>PDF Summary</DialogTitle>
          <DialogContent sx={{ bgcolor: palette.lighter, color: palette.text, fontSize: 17 }}>
            {summary ? summary : <CircularProgress sx={{ color: palette.green }} />}
          </DialogContent>
          <DialogActions sx={{ bgcolor: palette.lighter }}>
            <Button onClick={() => setSummaryOpen(false)} sx={{ color: palette.green, fontWeight: 600 }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
} 