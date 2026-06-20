import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FileText, Download, Eye, Clock, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BuilderService } from '../../services/builderService';
import type { GeneratedDocument } from '../../services/builderService';
import { generateDocxBlob } from '../../utils/docxExport';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<GeneratedDocument | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const docs = await BuilderService.fetchGeneratedDocuments(user.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (doc: GeneratedDocument) => {
    try {
      const blob = await generateDocxBlob(doc.content, "D69E2E", doc.document_type);
      const element = document.createElement('a');
      element.href = URL.createObjectURL(blob);
      element.download = `${doc.title.replace(/\s+/g, '_')}_v${doc.version}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDelete = async (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        await BuilderService.deleteGeneratedDocument(docId);
        setDocuments(documents.filter(d => d.id !== docId));
      } catch (error) {
        console.error('Failed to delete document:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>My Documents</h1>
        <p style={subtitleStyle}>View and export all your generated CVs, cover letters, and grants.</p>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>No documents found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            You haven't generated any documents yet. Use the CV Builder or Cover Letter tool to get started.
          </p>
        </Card>
      ) : (
        <div style={gridStyle}>
          {documents.map((doc) => (
            <Card key={doc.id} style={docCardStyle}>
              <div style={docCardHeaderStyle}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge variant={doc.document_type === 'cv' ? 'primary' : 'secondary'}>
                    {doc.document_type.toUpperCase().replace('_', ' ')}
                  </Badge>
                  {doc.is_current && <Badge variant="info">Latest Version</Badge>}
                </div>
                <button 
                  onClick={() => handleDelete(doc.id)}
                  style={deleteBtnStyle}
                  title="Delete Document"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 style={docTitleStyle}>{doc.title}</h3>
              
              <div style={docMetaStyle}>
                <Clock size={14} />
                <span>{new Date(doc.created_at!).toLocaleDateString()}</span>
                <span>•</span>
                <span>Version {doc.version}</span>
              </div>
              
              <div style={docActionsStyle}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedDoc(doc)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Eye size={16} style={{ marginRight: '6px' }} /> View
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => handleExport(doc)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Download size={16} style={{ marginRight: '6px' }} /> Export
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Document View Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div style={modalOverlayStyle}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={modalContentStyle}
            >
              <div style={modalHeaderStyle}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{selectedDoc.title}</h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Badge variant="outline">{selectedDoc.document_type.toUpperCase().replace('_', ' ')}</Badge>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      v{selectedDoc.version} • {new Date(selectedDoc.created_at!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button variant="primary" onClick={() => handleExport(selectedDoc)}>
                    <Download size={16} style={{ marginRight: '8px' }} /> Export DOCX
                  </Button>
                  <button onClick={() => setSelectedDoc(null)} style={closeBtnStyle}>
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div style={modalBodyStyle}>
                <div className="markdown-preview" style={markdownWrapperStyle}>
                  <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  maxWidth: '1000px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '1.1rem',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '24px',
};

const docCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '20px',
};

const docCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '16px',
};

const docTitleStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  marginBottom: '12px',
  flex: 1,
};

const docMetaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  color: 'var(--text-muted)',
  fontSize: '0.875rem',
  marginBottom: '20px',
};

const docActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginTop: 'auto',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  borderRadius: 'var(--radius-xl)',
  width: '100%',
  maxWidth: '800px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '24px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  backgroundColor: 'var(--bg-secondary)',
};

const closeBtnStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  transition: 'background-color 0.2s',
};

const modalBodyStyle: React.CSSProperties = {
  padding: '32px',
  overflowY: 'auto',
  backgroundColor: 'white',
  color: 'black', // Markdown preview looks best on white
};

const markdownWrapperStyle: React.CSSProperties = {
  maxWidth: '100%',
  fontFamily: 'Arial, sans-serif',
  lineHeight: 1.6,
};

const deleteBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  transition: 'color 0.2s',
};
