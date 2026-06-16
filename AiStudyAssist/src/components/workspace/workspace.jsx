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
    PanelLeft
} from 'lucide-react';
import './workspace.css';
import AiPdfViewer from './aiPdfViewer'; 
import Header from '../layout/Header'; 

export default function Workspace() {
    const { topicName, branchName } = useParams(); 
    const location = useLocation();
    const navigate = useNavigate();
    
    const passedFiles = location.state?.files || [];
    
    const formattedTopicName = topicName?.replace('-', ' ');
    const actualBranchName = location.state?.branchName || branchName?.replace('-', ' ') || "Branch";

    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfError, setPdfError] = useState(false);
    
    const pdfPanelRef = useRef(null);

    useEffect(() => {
        const initializedFiles = passedFiles.map(file => ({
            ...file,
            selectedForAi: false,
            url: file.url 
        }));
        setFiles(initializedFiles);
        if (initializedFiles.length > 0) {
            setActiveFileId(initializedFiles[0].id);
        }
    }, [passedFiles]);

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

    const handleGenerateAiTask = (taskType) => {
        const selectedFiles = files.filter(f => f.selectedForAi);
        if (selectedFiles.length === 0) {
            alert(`Please select at least one file to generate a ${taskType}.`);
            return;
        }
        
        if (taskType === 'Quiz') navigate('/quiz');
        if (taskType === 'Summary') navigate('/summary');
        if (taskType === 'Flashcards') navigate('/flashcards');
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
                                    className={`file-item ${activeFileId === file.id ? 'active' : ''}`}
                                    onClick={() => setActiveFileId(file.id)}
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
                        {activeFile?.url ? (
                            <AiPdfViewer 
                                fileUrl={activeFile.url} 
                                pageNumber={pageNumber} 
                                onDocumentLoadSuccess={handleDocumentLoadSuccess}
                                error={pdfError}
                                setError={setPdfError}
                            />
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
                            <div className="message user-message">
                                <div className="message-avatar user-avatar">S</div>
                                <div className="message-content">
                                    <h4>Sarah</h4>
                                    <p>What's the difference between butane and isobutane?</p>
                                </div>
                            </div>
                        </div>

                        <div className="chat-input-container">
                            <input 
                                type="text" 
                                placeholder="Ask a question..." 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="chat-input"
                            />
                            <button className="send-btn">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}