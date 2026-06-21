
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle2, Settings, Loader2 } from 'lucide-react';
import './summary.css';
import { API_START_URL } from '../../config';

export default function Summary() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const passedFiles = location.state?.selectedFiles || [];

    const [isConfiguring, setIsConfiguring] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [copied, setCopied] = useState(false);

    const [coverage, setCoverage] = useState(0.7);
    const [selectedFileId, setSelectedFileId] = useState(passedFiles.length > 0 ? passedFiles[0].id : "");

    const handleGenerateSummary = async (e) => {
        e.preventDefault();
        
        if (!selectedFileId) {
            alert("Please select a document to summarize.");
            return;
        }

        setIsGenerating(true);
        try {
            const userJwt = localStorage.getItem("user_jwt");
            
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
            setIsConfiguring(false);
            
        } catch (error) {
            console.error("Error generating summary:", error);
            alert("Failed to generate the summary. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

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

    if (isConfiguring) {
        return (
            <div className="summary-page">
                <header className="sum-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h2>Summary Configuration</h2>
                    <div className="sum-header-spacer"></div>
                </header>

                <main className="sum-config-main">
                    <div className="sum-config-card">
                        <div className="sum-config-icon-wrapper">
                            <Settings size={48} className="sum-config-icon" />
                        </div>
                        <h2 className="sum-config-title">Setup Summary</h2>
                        <p className="sum-config-subtitle">Adjust how the AI analyzes and condenses your document.</p>
                        
                        <form onSubmit={handleGenerateSummary} className="sum-config-form">
                            <div className="form-group">
                                <label className="sum-config-label">Target Document</label>
                                <select 
                                    className="sum-config-select"
                                    value={selectedFileId} 
                                    onChange={(e) => setSelectedFileId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select a file...</option>
                                    {passedFiles.map(file => (
                                        <option key={file.id} value={file.id}>{file.name}</option>
                                    ))}
                                </select>
                                {passedFiles.length === 0 && (
                                    <span className="sum-config-error">No files selected from workspace.</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="sum-config-label">Summary Coverage (Density)</label>
                                <select 
                                    className="sum-config-select"
                                    value={coverage} 
                                    onChange={(e) => setCoverage(e.target.value)}
                                >
                                    <option value={0.5}>Shallow (Quick Overview)</option>
                                    <option value={0.7}>General (Balanced Detail)</option>
                                    <option value={1.0}>Comprehensive (High Density)</option>
                                </select>
                            </div>

                            <button 
                                type="submit" 
                                className="sum-config-submit-btn"
                                disabled={isGenerating || passedFiles.length === 0}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="spinner" size={20} /> Analyzing Document...
                                    </>
                                ) : (
                                    'Generate Summary'
                                )}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

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
                        <p className="sum-content-text">{summaryData.content}</p>
                    </section>

                    <section className="sum-section">
                        <h3>Key Takeaways</h3>
                        <div className="sum-key-points">
                            {summaryData.keyTakeaways.map((point, idx) => (
                                <div key={idx} className="sum-point-card">
                                    <div className="point-bullet">{idx + 1}</div>
                                    <div className="point-content">
                                        <p className="point-text">{point}</p>
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