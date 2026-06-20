import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
    FileText, 
    CheckSquare, 
    Copy, 
    Send, 
    ChevronDown, 
    ChevronLeft, 
    ChevronRight, 
    SkipBack, 
    SkipForward, 
    Maximize,
    ArrowLeft,
    PanelLeftClose,
    PanelLeft,
    Loader2,
    AlertCircle
} from 'lucide-react';
import './workspace.css';
import AiPdfViewer from './aiPdfViewer'; 
import Header from '../layout/Header'; 
import { API_START_URL, SUPABASE_BUCKET_URL } from '../../config';

// --- JWT Helper to Extract User ID ---
function parseJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        console.error("Failed to parse JWT");
        return null;
    }
}

function getUserIdFromJwt(token) {
    if (!token) return null;
    const payload = parseJwtPayload(token);
    return payload?.sub || null;
}

export default function Workspace() {
    const { topicName, branchName } = useParams(); 
    const location = useLocation();
    const navigate = useNavigate();
    
    const passedFiles = location.state?.files || [];
    const formattedTopicName = topicName?.replace('-', ' ');
    const actualBranchName = location.state?.branchName || branchName?.replace('-', ' ') || "Branch";
    const branchId = location.state?.branchId;
    const topicId = location.state?.topicId; 

    // --- APP STATES ---
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // --- PDF STATES ---
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfError, setPdfError] = useState(false);
    const pdfPanelRef = useRef(null);

    // --- CHAT STATES ---
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'ai', answer: "Hi! Select a document from the left and ask me anything about it.", details: [], followUpConcept: null }
    ]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    const getFullUrl = (urlOrPath) => {
        if (!urlOrPath) return '';
        if (urlOrPath.startsWith('http')) return urlOrPath;
        return `${SUPABASE_BUCKET_URL}${urlOrPath}`;
    };

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isChatLoading]);

    // ==========================================
    // BACKEND INTEGRATION: Fetch Branch Resources
    // ==========================================
    useEffect(() => {
        const fetchBranchResources = async () => {
            if (!branchId) return;

            try {
                const userJwt = localStorage.getItem("user_jwt");
                const response = await fetch(`${API_START_URL}resources/branch/${branchId}`, {
                    headers: {
                        'Authorization': `Bearer ${userJwt}`,
                        'ngrok-skip-browser-warning': 'true'
                    }
                });

                if (!response.ok) throw new Error("Failed to fetch branch resources");
                
                const data = await response.json();
                console.log("Backend Response Data:", data);
                
                // Extract userId from JWT for URL construction
                const userId = getUserIdFromJwt(userJwt);
                console.log("Extracted userId from JWT:", userId);
                
                const formattedFiles = data.map(res => {
                    const resourceName = res.title || res.name || res.fileName || "Unnamed Document";
                    const resourceId = res.id;
                    
                    // Get file extension
                    const fileExtension = resourceName.split('.').pop()?.toLowerCase() || '';
                    const isPdf = fileExtension === 'pdf';
                    
                    // Construct file URL using the pattern:
                    // SUPABASE_BUCKET_URL + /userId/topicId/branchId/resourceId-resourceName
                    const constructedUrl = topicId && userId 
                        ? `${SUPABASE_BUCKET_URL}${userId}/${topicId}/${branchId}/${resourceId}-${resourceName.replace(/[^a-zA-Z0-9.-]/g, "_")}`
                        : '';
                    
                    console.log("File Object:", { 
                        id: resourceId, 
                        name: resourceName,
                        fileExtension,
                        isPdf,
                        constructedUrl 
                    });

                    return {
                        id: resourceId,
                        name: resourceName, 
                        url: constructedUrl,
                        fileExtension,
                        isPdf,
                        selectedForAi: false
                    };
                });

                console.log("Formatted Files:", formattedFiles);
                setFiles(formattedFiles);
                if (formattedFiles.length > 0) setActiveFileId(formattedFiles[0].id);

            } catch (err) {
                console.error("Failed to load files from Backend:", err);
            }
        };

        fetchBranchResources();
    }, [branchId, topicId]);

    useEffect(() => {
        setPageNumber(1);
        setPdfError(false);
    }, [activeFileId]);

    const activeFile = files.find(f => f.id === activeFileId);

    const toggleAiSelection = (fileId) => {
        setFiles(files.map(file => 
            file.id === fileId ? { ...file, selectedForAi: !file.selectedForAi } : file
        ));
    };

    // Handle file click with debugging
    const handleFileClick = (fileId) => {
        console.log("File clicked, id:", fileId); // DEBUG
        console.log("Available files:", files); // DEBUG
        setActiveFileId(fileId);
    };

    const handleGenerateAiTask = (taskType) => {
        const selectedFiles = files.filter(f => f.selectedForAi);
        if (selectedFiles.length === 0) {
            alert(`Please select at least one file to generate a ${taskType}.`);
            return;
        }
        
        if (taskType === 'Quiz') navigate('/quiz', { state: { selectedFiles } });
        if (taskType === 'Summary') navigate('/summary', { state: { selectedFiles } });
        if (taskType === 'Flashcards') navigate('/flashcards', { state: { selectedFiles } });
    };

    // ==========================================
    // CHAT API INTEGRATION
    // ==========================================
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        
        if (!chatInput.trim()) return;
        if (!activeFileId) {
            alert("Please select a document to chat about.");
            return;
        }

        const userMessage = chatInput.trim();
        setChatInput('');
        
        // Add user message to UI immediately
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsChatLoading(true);

        try {
            const userJwt = localStorage.getItem("user_jwt");
            const response = await fetch(`${API_START_URL}chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userJwt}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    message: userMessage,
                    resourceId: activeFileId
                })
            });

            if (!response.ok) throw new Error("Chat request failed");

            const data = await response.json();
            
            // Add the AI response directly mapping your schema
            setMessages(prev => [...prev, {
                role: 'ai',
                answer: data.answer,
                details: data.details || [],
                followUpConcept: data.followUpConcept
            }]);

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                role: 'ai',
                answer: "Sorry, I encountered an error trying to process that. Please try again.",
                details: [],
                followUpConcept: null
            }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleDocumentLoadSuccess = (pages) => setNumPages(pages);
    const handlePrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
    const handleFirstPage = () => setPageNumber(1);
    const handleLastPage = () => setPageNumber(numPages || 1);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            pdfPanelRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div className="workspace-app">
            <Header branchName={`${formattedTopicName} - ${actualBranchName}`} />

            <main className="workspace-main">
                <div className={`file-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-header">
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            <ArrowLeft size={16} /> Back to Topics
                        </button>
                    </div>

                    <div className="sidebar-content">
                        <div className="sidebar-title-row">
                            <h4>Branch Documents</h4>
                            <span className="file-count">{files.length}</span>
                        </div>
                        
                        <ul className="file-list">
                            {files.map(file => (
                                <li 
                                    key={file.id} 
                                    className={`file-item ${activeFileId === file.id ? 'active' : ''} ${!file.isPdf ? 'unsupported' : ''}`}
                                    onClick={() => handleFileClick(file.id)}
                                    title={!file.isPdf ? `${file.fileExtension.toUpperCase()} files cannot be displayed in the PDF viewer` : 'Click to view'}
                                >
                                    <input 
                                        type="checkbox" 
                                        className="file-checkbox"
                                        checked={file.selectedForAi}
                                        onChange={(e) => {
                                            e.stopPropagation(); 
                                            toggleAiSelection(file.id);
                                        }}
                                    />
                                    <span className="file-name">
                                        {file.name || "Unnamed Document"}
                                    </span>
                                    {!file.isPdf && (
                                        <span style={{ 
                                            fontSize: '0.65rem', 
                                            backgroundColor: '#fca5a5', 
                                            color: '#7f1d1d', 
                                            padding: '2px 6px', 
                                            borderRadius: '3px', 
                                            marginLeft: 'auto',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {file.fileExtension.toUpperCase()}
                                        </span>
                                    )}
                                </li>
                            ))}
                            {files.length === 0 && (
                                <div className="empty-files">No documents available</div>
                            )}
                        </ul>
                    </div>
                </div>

                <div className={`pdf-panel ${document.fullscreenElement ? 'fullscreen' : ''}`} ref={pdfPanelRef}>
                    <button 
                        className="sidebar-toggle-btn"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                    >
                        {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
                    </button>

                    <div className="pdf-content-area">
                        {activeFile ? (
                            <>
                                {activeFile.url ? (
                                    activeFile.isPdf ? (
                                        <AiPdfViewer 
                                            fileUrl={activeFile.url} 
                                            pageNumber={pageNumber} 
                                            onDocumentLoadSuccess={handleDocumentLoadSuccess}
                                            error={pdfError}
                                            setError={setPdfError}
                                        />
                                    ) : (
                                        <div className="mock-pdf-pages">
                                            <AlertCircle size={48} style={{ opacity: 0.6, color: '#ef4444', marginBottom: '16px' }} />
                                            <h3 style={{ color: '#ef4444' }}>Unsupported File Format</h3>
                                            <p>This viewer only supports PDF files.</p>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>File type: <strong>{activeFile.fileExtension.toUpperCase()}</strong></p>
                                            <p style={{ fontSize: '0.85rem', marginTop: '16px', color: '#666' }}>Convert this file to PDF to view it here.</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="mock-pdf-pages">
                                        <AlertCircle size={48} style={{ opacity: 0.4, marginBottom: '16px' }} />
                                        <p>File selected but URL is missing. Please check console for details.</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>File: {activeFile.name}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="mock-pdf-pages">
                                <p>Select a valid document from the sidebar.</p>
                            </div>
                        )}
                    </div>

                    <div className="pdf-bottom-nav">
                        <div className="nav-controls">
                            <button onClick={handleFirstPage} disabled={pageNumber <= 1}><SkipBack size={16} /></button>
                            <button onClick={handlePrevPage} disabled={pageNumber <= 1}><ChevronLeft size={16} /></button>
                            
                            <div className="page-indicator">
                                <input type="text" value={pageNumber} readOnly />
                                <span>of {numPages || '--'}</span>
                            </div>
                            
                            <button onClick={handleNextPage} disabled={pageNumber >= numPages}><ChevronRight size={16} /></button>
                            <button onClick={handleLastPage} disabled={pageNumber >= numPages}><SkipForward size={16} /></button>
                        </div>
                        <button className="fullscreen-btn" onClick={toggleFullScreen}>
                            <Maximize size={16} />
                        </button>
                    </div>
                </div>

                <aside className="chat-sidebar">
                    <h2 className="sidebar-title">Aura AI Tutor Chat</h2>
                    
                    <div className="ai-tools-grid">
                        <button className="ai-tool-btn tool-summary" onClick={() => handleGenerateAiTask('Summary')}>
                            <div className="tool-icon"><FileText size={24} /></div>
                            <span>Summarize Document</span>
                        </button>
                        <button className="ai-tool-btn tool-quiz" onClick={() => handleGenerateAiTask('Quiz')}>
                            <div className="tool-icon"><CheckSquare size={24} /></div>
                            <span>Generate Quiz</span>
                        </button>
                        <button className="ai-tool-btn tool-flashcards" onClick={() => handleGenerateAiTask('Flashcards')}>
                            <div className="tool-icon"><Copy size={24} /></div>
                            <span>Create Flashcards</span>
                        </button>
                    </div>

                    <div className="chat-interface">
                        <div className="chat-header">
                            <div className="chat-header-title">
                                <span className="logo-icon-small">A</span>
                                <h3>Aura AI</h3>
                            </div>
                            <ChevronDown size={16} color="#64748b" />
                        </div>
                        
                        <div className="messages-area">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}>
                                    <div className={`message-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                                        {msg.role === 'user' ? 'U' : 'A'}
                                    </div>
                                    <div className="message-content">
                                        <h4>{msg.role === 'user' ? 'You' : 'Aura AI'}</h4>
                                        
                                        {/* User Text */}
                                        {msg.role === 'user' && <p>{msg.content}</p>}
                                        
                                        {/* AI Response Schema */}
                                        {msg.role === 'ai' && (
                                            <div className="ai-structured-response">
                                                <p style={{ whiteSpace: 'pre-wrap', marginBottom: '8px' }}>{msg.answer}</p>
                                                
                                                {msg.details && msg.details.length > 0 && (
                                                    <ul style={{ paddingLeft: '20px', marginBottom: '12px', color: 'var(--text-muted)' }}>
                                                        {msg.details.map((detail, dIdx) => (
                                                            <li key={dIdx} style={{ marginBottom: '4px' }}>{detail}</li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {msg.followUpConcept && (
                                                    <div style={{ marginTop: '12px', padding: '8px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                                                        <strong style={{ color: 'var(--primary)' }}>Next up: </strong> 
                                                        <span style={{ cursor: 'pointer' }} onClick={() => setChatInput(`Tell me about ${msg.followUpConcept}`)}>
                                                            {msg.followUpConcept}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            {isChatLoading && (
                                <div className="message ai-message">
                                    <div className="message-avatar ai-avatar">A</div>
                                    <div className="message-content">
                                        <h4>Aura AI</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                            <Loader2 size={16} className="spinner" /> 
                                            <span>Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Invisible div to scroll to */}
                            <div ref={chatEndRef} />
                        </div>

                        <form className="chat-input-container" onSubmit={handleSendMessage}>
                            <input 
                                type="text" 
                                placeholder={activeFileId ? "Ask a question..." : "Select a document to chat"} 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="chat-input"
                                disabled={!activeFileId || isChatLoading}
                            />
                            <button type="submit" className="send-btn" disabled={!activeFileId || isChatLoading || !chatInput.trim()}>
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </aside>
            </main>
        </div>
    );
}