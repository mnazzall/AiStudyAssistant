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

  const targetUrl = fileUrl || url || (typeof file === 'object' ? (file?.url || file?.fileUrl || file?.file_url) : file);

  useEffect(() => { 
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
    <div className="pdf-loading-container pdf-loading-placeholder">
      <FileText size={48} className="pdf-icon-low-opacity" />
      <p>Select a document from the left sidebar to view it here.</p>
    </div>
  );

  const isPdf = targetUrl.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return (
      <div className="pdf-loading-container pdf-loading-placeholder">
        <AlertCircle size={48} className="pdf-icon-error-opacity" />
        <h3 className="pdf-unsupported-title">Unsupported File Format</h3>
        <p className="pdf-unsupported-message">This viewer only supports PDF files.</p>
        <p className="pdf-file-type-text">File type detected: <strong>{targetUrl.split('.').pop().toUpperCase()}</strong></p>
        <p className="pdf-conversion-hint">Please convert PowerPoint, Word, or other document formats to PDF to view them here.</p>
      </div>
    );
  }

  const hasError = error || internalError !== null;

  return (
    <div className="pdf-viewer-container">
      {hasError ? (
        <div className="pdf-error-container">
          <AlertCircle size={48} className="pdf-error-icon" />
          <h3>Unable to display document</h3>
          <p className="pdf-error-message">{internalError || "Could not connect to document stream."}</p>
          <div className="pdf-error-detail-box">
            <strong>URL:</strong> {targetUrl || "No URL provided"}
          </div>
          <p className="pdf-error-footer">Check browser console for detailed error logs.</p>
        </div>
      ) : (
        <>
          {pdfBlob && !isDownloading && (
            <div className="pdf-controls-bar">
              <button onClick={() => setCurrPage(p => Math.max(1, p - 1))} disabled={currPage <= 1} className="pdf-control-button">
                <ChevronLeft size={20} />
              </button>
              <span className="pdf-page-counter">Page {currPage} of {numPages || '-'}</span>
              <button onClick={() => setCurrPage(p => Math.min(numPages || 1, p + 1))} disabled={currPage >= (numPages || 1)} className="pdf-control-button">
                <ChevronRight size={20} />
              </button>
              <div className="pdf-divider" />
              <button onClick={() => setScale(s => Math.max(0.6, s - 0.2))} className="pdf-control-button" title="Zoom Out"><ZoomOut size={18} /></button>
              <span className="pdf-zoom-display">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(2.2, s + 0.2))} className="pdf-control-button" title="Zoom In"><ZoomIn size={18} /></button>
            </div>
          )}

          <div className="pdf-content-wrapper">
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