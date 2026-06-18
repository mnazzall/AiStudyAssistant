import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle2, Settings, Loader2 } from 'lucide-react';
import './summary.css';
import { API_START_URL } from '../../config';

export default function Summary() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Grab the files passed from the Workspace sidebar
    const passedFiles = location.state?.selectedFiles || [];

    // --- APP STATES ---
    const [isConfiguring, setIsConfiguring] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [copied, setCopied] = useState(false);

    // --- FORM STATES ---
    const [coverage, setCoverage] = useState(0.7); // Default to General
    const [selectedFileId, setSelectedFileId] = useState(passedFiles.length > 0 ? passedFiles[0].id : "");

    // ==========================================
    // API CALL: GENERATE SUMMARY
    // ==========================================
    const handleGenerateSummary = async (e) => {
        e.preventDefault();
        
        if (!selectedFileId) {
            alert("Please select a document to summarize.");
            return;
        }

        setIsGenerating(true);
        try {
            const userJwt = localStorage.getItem("user_jwt");
            
            // Note: Using 'summaries' in the path. Adjust if your backend uses a different spelling.
            const response = await fetch(`${API_START_URL}summaries/${selectedFileId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userJwt}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    coverage: parseFloat(coverage)
                })
            });

            if (!response.ok) throw new Error("Backend failed to generate summary.");

            const data = await response.json();
            setSummaryData(data);
            setIsConfiguring(false); // Move to the summary view
            
        } catch (error) {
            console.error("Error generating summary:", error);
            alert("Failed to generate the summary. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // ==========================================
    // INTERACTION HANDLERS
    // ==========================================
    const handleCopy = () => {
        if (!summaryData) return;

        const textToCopy = `
${summaryData.title}

Overview:
${summaryData.content}

Key Takeaways:
${summaryData.keyTakeaways.map(point => `- ${point}`).join('\n')}
        `.trim();

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ==========================================
    // RENDER: CONFIGURATION SCREEN
    // ==========================================
    if (isConfiguring) {
        return (
            <div className="summary-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-main)' }}>
                <header className="sum-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h2>Summary Configuration</h2>
                    <div style={{width: '100px'}}></div>
                </header>

                <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', maxWidth: '500px', width: '100%', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <Settings size={48} color="#0ea5e9" />
                        </div>
                        <h2 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Setup Summary</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Adjust how the AI analyzes and condenses your document.</p>
                        
                        <form onSubmit={handleGenerateSummary} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>Target Document</label>
                                <select 
                                    value={selectedFileId} 
                                    onChange={(e) => setSelectedFileId(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}
                                    required
                                >
                                    <option value="" disabled>Select a file...</option>
                                    {passedFiles.map(file => (
                                        <option key={file.id} value={file.id}>{file.name}</option>
                                    ))}
                                </select>
                                {passedFiles.length === 0 && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '4px', display: 'block' }}>No files selected from the workspace.</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>Summary Coverage (Density)</label>
                                <select 
                                    value={coverage} 
                                    onChange={(e) => setCoverage(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}
                                >
                                    <option value={0.5}>Shallow (Quick Overview)</option>
                                    <option value={0.7}>General (Balanced Detail)</option>
                                    <option value={1.0}>Comprehensive (High Density)</option>
                                </select>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isGenerating || passedFiles.length === 0}
                                style={{ 
                                    marginTop: '10px', 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    gap: '8px',
                                    padding: '12px',
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    fontWeight: '600',
                                    cursor: (isGenerating || passedFiles.length === 0) ? 'not-allowed' : 'pointer',
                                    opacity: (isGenerating || passedFiles.length === 0) ? 0.7 : 1,
                                    transition: 'var(--transition)'
                                }}
                            >
                                {isGenerating ? <><Loader2 className="spinner" size={20} /> Analyzing Document...</> : 'Generate Summary'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    // ==========================================
    // RENDER: SUMMARY VIEW
    // ==========================================
    return (
        <div className="summary-page">
            <header className="sum-header">
                <button className="back-btn" onClick={() => setIsConfiguring(true)}>
                    <ArrowLeft size={16} /> New Summary
                </button>
                <h2>Document Summary</h2>
                
                <button className="copy-btn" onClick={handleCopy}>
                    {copied ? <><CheckCircle2 size={16} /> Copied!</> : <><Copy size={16} /> Copy Text</>}
                </button>
            </header>

            <main className="sum-main">
                <article className="sum-document">
                    <h1 className="sum-title">{summaryData.title}</h1>
                    
                    <section className="sum-section">
                        <h3>Overview</h3>
                        <p style={{ whiteSpace: 'pre-line' }}>{summaryData.content}</p>
                    </section>

                    <section className="sum-section">
                        <h3>Key Takeaways</h3>
                        <div className="sum-key-points">
                            {summaryData.keyTakeaways.map((point, idx) => (
                                <div key={idx} className="sum-point-card">
                                    <div className="point-bullet">{idx + 1}</div>
                                    <div className="point-content">
                                        <p style={{ margin: 0 }}>{point}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </article>
            </main>
        </div>
    );
}