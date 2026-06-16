import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, AlertCircle } from 'lucide-react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import './aiPdfViewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function AiPdfViewer({ fileUrl, pageNumber, onDocumentLoadSuccess, error, setError }) {
  
  function handleLoadSuccess(doc) {
    setError(false);
    if (onDocumentLoadSuccess) {
        onDocumentLoadSuccess(doc.numPages);
    }
  }

  function onDocumentLoadError(err) {
    console.error("PDF Load Error:", err.message);
    setError(true);
  }

  if (!fileUrl) return null;

  return (
    <div className="pdf-viewer-container">
      {error ? (
        <div className="pdf-error-container">
            <AlertCircle size={48} className="pdf-error-icon" />
            <h3>Failed to load PDF</h3>
            <p>
                Ensure <strong>{fileUrl}</strong> is accessible and the URL is correct.
            </p>
        </div>
      ) : (
        <Document 
          file={fileUrl} 
          onLoadSuccess={handleLoadSuccess}
          onLoadError={onDocumentLoadError}
          className="pdf-document-wrapper"
          loading={
            <div className="pdf-loading-container">
                <Loader2 className="spinner" size={36} />
                <p>Rendering Document...</p>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={true} 
            renderAnnotationLayer={true} 
            scale={1.2} 
            className="pdf-page"
          />
        </Document>
      )}
    </div>
  );
}