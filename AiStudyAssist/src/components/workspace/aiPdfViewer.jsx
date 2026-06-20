import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import './aiPdfViewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function AiPdfViewer({ fileUrl, file, url, pageNumber, onDocumentLoadSuccess, error, setError }) {
  const [pdfBlob, setPdfBlob] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [internalError, setInternalError] = useState(null);
  
  const [numPages, setNumPages] = useState(null);
  const [currPage, setCurrPage] = useState(pageNumber || 1);
  const [scale, setScale] = useState(1.2);

  // Extract raw URL string from whichever prop the workspace passed down
  const targetUrl = fileUrl || url || (typeof file === 'object' ? (file?.url || file?.fileUrl || file?.file_url) : file);

  useEffect(() => { 
    console.log("AiPdfViewer Props - fileUrl:", fileUrl, "url:", url, "file:", file); // DEBUG
    console.log("Final targetUrl:", targetUrl); // DEBUG
    setCurrPage(pageNumber || 1);
  }, [pageNumber, fileUrl, url, file]);

  useEffect(() => {
    if (!targetUrl) return;

    let isMounted = true;
    setIsDownloading(true);
    if (setError) setError(false);
    setInternalError(null);

    async function fetchPdfAsBlob() {
      try {
        if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(targetUrl)) {
          throw new Error(`Document link is incomplete. Received raw ID: ${targetUrl}`);
        }

        // CRITICAL FIX: Omit 'Authorization' header entirely for public Supabase storage.
        // Attaching a Spring Boot JWT causes Supabase Kong gateway to block access with a 401.
        const response = await fetch(targetUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: Failed to retrieve document stream.`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          throw new Error("Routing error: Received dev server HTML webpage bundle instead of PDF binary.");
        }

        const blob = await response.blob();
        if (isMounted) {
          setPdfBlob(blob);
          if (setError) setError(false);
        }
      } catch (err) {
        console.error("PDF Download Error:", err);
        if (isMounted) {
          setInternalError(err.message);
          if (setError) setError(true);
        }
      } finally {
        if (isMounted) setIsDownloading(false);
      }
    }

    fetchPdfAsBlob();

    return () => { isMounted = false; };
  }, [targetUrl, setError]);

  function handleLoadSuccess(doc) {
    if (setError) setError(false);
    setInternalError(null);
    setNumPages(doc.numPages);
    if (onDocumentLoadSuccess) onDocumentLoadSuccess(doc.numPages);
  }

  function handleLoadError(err) {
    console.error("PDF Render Error:", err);
    setInternalError("The PDF binary could not be rendered.");
    if (setError) setError(true);
  }

  if (!targetUrl) return (
    <div className="pdf-loading-container" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
      <FileText size={48} style={{ opacity: 0.4 }} />
      <p>Select a document from the left sidebar to view it here.</p>
    </div>
  );

  // Check if file is a PDF
  const isPdf = targetUrl.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return (
      <div className="pdf-loading-container" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <AlertCircle size={48} style={{ opacity: 0.6, color: '#ef4444', marginBottom: '16px' }} />
        <h3 style={{ color: '#ef4444' }}>Unsupported File Format</h3>
        <p style={{ marginBottom: '12px' }}>This viewer only supports PDF files.</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>File type detected: <strong>{targetUrl.split('.').pop().toUpperCase()}</strong></p>
        <p style={{ fontSize: '0.85rem', marginTop: '16px', color: '#666' }}>Please convert PowerPoint, Word, or other document formats to PDF to view them here.</p>
      </div>
    );
  }

  const hasError = error || internalError !== null;

  return (
    <div className="pdf-viewer-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
      {hasError ? (
        <div className="pdf-error-container">
          <AlertCircle size={48} className="pdf-error-icon" />
          <h3>Unable to display document</h3>
          <p style={{ marginBottom: '12px', fontSize: '0.9rem' }}>{internalError || "Could not connect to document stream."}</p>
          <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '6px', borderRadius: '4px', wordBreak: 'break-all', maxHeight: '100px', overflow: 'auto' }}>
            <strong>URL:</strong> {targetUrl || "No URL provided"}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>Check browser console for detailed error logs.</p>
        </div>
      ) : (
        <>
          {pdfBlob && !isDownloading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '6px 16px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)', marginBottom: '16px', border: '1px solid var(--border-light)', zIndex: 10 }}>
              <button onClick={() => setCurrPage(p => Math.max(1, p - 1))} disabled={currPage <= 1} style={{ border: 'none', background: 'none', cursor: currPage <= 1 ? 'default' : 'pointer', opacity: currPage <= 1 ? 0.4 : 1 }}>
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'var(--font-family)' }}>Page {currPage} of {numPages || '-'}</span>
              <button onClick={() => setCurrPage(p => Math.min(numPages || 1, p + 1))} disabled={currPage >= (numPages || 1)} style={{ border: 'none', background: 'none', cursor: currPage >= numPages ? 'default' : 'pointer', opacity: currPage >= numPages ? 0.4 : 1 }}>
                <ChevronRight size={20} />
              </button>
              <div style={{ height: '16px', width: '1px', background: 'var(--border-light)', margin: '0 4px' }} />
              <button onClick={() => setScale(s => Math.max(0.6, s - 0.2))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-strong)' }} title="Zoom Out"><ZoomOut size={18} /></button>
              <span style={{ fontSize: '0.8rem', width: '40px', textAlign: 'center', fontWeight: '500', fontFamily: 'var(--font-family)' }}>{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(2.2, s + 0.2))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-strong)' }} title="Zoom In"><ZoomIn size={18} /></button>
            </div>
          )}

          <div style={{ flex: 1, width: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
            <Document 
              file={pdfBlob} 
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              className="pdf-document-wrapper"
              loading={
                <div className="pdf-loading-container">
                  <Loader2 className="spinner" size={36} />
                  <p>{isDownloading ? "Downloading Secure PDF..." : "Rendering Canvas..."}</p>
                </div>
              }
            >
              <Page 
                pageNumber={currPage} 
                renderTextLayer={true} 
                renderAnnotationLayer={true} 
                scale={scale} 
                className="pdf-page"
              />
            </Document>
          </div>
        </>
      )}
    </div>
  );
}