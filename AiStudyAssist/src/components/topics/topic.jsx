import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    BookOpen, 
    FileText, 
    Trash2, 
    Edit2, 
    CloudUpload, 
    ChevronDown, 
    ChevronUp,
    X,
    Loader2
} from "lucide-react";
import SideBar from "../layout/SideBar";
import Header from "../layout/Header";
import './topic.css';
import { API_START_URL, SUPABASE_BUCKET_NAME } from '../../config';

function parseJwtPayload(token) {
    if (!token) return null;
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (payload.length % 4) payload += "=";
        const decoded = atob(payload);
        return JSON.parse(decoded);
    } catch (e) {
        return null;
    }
}

function getUserIdFromJwt(token) {
    const payload = parseJwtPayload(token);
    if (!payload) return null;
    return (
        payload.sub ||
        payload.userId ||
        payload.uid ||
        payload.id ||
        (payload.user && payload.user.id) ||
        null
    );
}

const FileDropZone = ({ onFilesAdded, isUploading }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (isUploading) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesAdded(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };
    const handleBrowseClick = () => {
        if (!isUploading) fileInputRef.current.click();
    };
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) onFilesAdded(Array.from(e.target.files));
    };

    return (
        <div className={`drag-drop-zone ${isDragging ? 'drag-active' : ''} ${isUploading ? 'uploading' : ''}`} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} disabled={isUploading} />
            <div style={{ pointerEvents: 'none' }}>
                {isUploading ? (
                    <Loader2 size={24} className="spinner" style={{ margin: '0 auto 8px', color: 'var(--primary)' }} />
                ) : (
                    <CloudUpload size={24} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
                )}
                <p>
                    {isUploading ? 'Registering & uploading securely...' : (
                        <>Drag & drop files here, or <span className="browse-link" style={{ pointerEvents: 'auto', cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }} onClick={handleBrowseClick}>browse</span></>
                    )}
                </p>
            </div>
        </div>
    );
};

export default function Topic() {
    const navigate = useNavigate();
    const [searchTopics, setSearchTopics] = useState("");
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingBranchId, setUploadingBranchId] = useState(null);
    
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [newTopicData, setNewTopicData] = useState({ title: "", description: "" });
    const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [activeTopicForBranch, setActiveTopicForBranch] = useState(null);
    const [newBranchData, setNewBranchData] = useState({ title: "", description: "" });
    const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);

    const [isEditTopicModalOpen, setIsEditTopicModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [editTopicData, setEditTopicData] = useState({ title: "", description: "" });
    const [isSubmittingEditTopic, setIsSubmittingEditTopic] = useState(false);

    const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [editingTopicIdForBranch, setEditingTopicIdForBranch] = useState(null);
    const [editBranchData, setEditBranchData] = useState({ title: "", description: "" });
    const [isSubmittingEditBranch, setIsSubmittingEditBranch] = useState(false);

    const handleSearchChange = (e) => setSearchTopics(e.target.value);

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("user_jwt")}`,
        'ngrok-skip-browser-warning': 'true'
    });

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        setIsLoading(true);
        try {
            const userJwt = localStorage.getItem("user_jwt");
            if (!userJwt) return navigate('/signin');

            const response = await fetch(`${API_START_URL}topics`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error("Failed to fetch topics");
            
            const data = await response.json();
            const formattedTopics = data.map(topic => ({
                ...topic,
                icon: BookOpen,
                isExpanded: false,
                branches: [],
                branchesLoaded: false
            }));
            
            setTopics(formattedTopics);
        } catch (error) {
            console.error("Error loading topics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleExpand = async (topicId) => {
        const topic = topics.find(t => t.id === topicId);
        if (!topic.isExpanded && !topic.branchesLoaded) {
            try {
                const response = await fetch(`${API_START_URL}branches/topic/${topicId}`, { headers: getAuthHeaders() });
                if (response.ok) {
                    const branchesData = await response.json();
                    setTopics(prev => prev.map(t => 
                        t.id === topicId ? { ...t, branches: branchesData, branchesLoaded: true } : t
                    ));
                }
            } catch (error) {
                console.error("Error loading branches:", error);
            }
        }
        setTopics(prev => prev.map(t => t.id === topicId ? { ...t, isExpanded: !t.isExpanded } : t));
    };

    const handleCreateTopic = async (e) => {
        e.preventDefault();
        if (!newTopicData.title.trim()) return;
        setIsSubmittingTopic(true);
        try {
            const response = await fetch(`${API_START_URL}topics`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newTopicData)
            });
            if (!response.ok) throw new Error("Failed to create topic");
            const savedTopic = await response.json();
            
            setTopics([...topics, { ...savedTopic, icon: BookOpen, isExpanded: true, branches: [], branchesLoaded: true }]);
            setNewTopicData({ title: "", description: "" });
            setIsTopicModalOpen(false);
        } catch (error) {
            console.error("Error creating topic:", error);
        } finally {
            setIsSubmittingTopic(false);
        }
    };

    const openBranchModal = (topicId) => {
        setActiveTopicForBranch(topicId);
        setIsBranchModalOpen(true);
    };

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        if (!newBranchData.title.trim()) return;
        setIsSubmittingBranch(true);
        try {
            const payload = { title: newBranchData.title, description: newBranchData.description };
            const response = await fetch(`${API_START_URL}branches/${activeTopicForBranch}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Failed to create branch");
            const savedBranch = await response.json();

            setTopics(topics.map(topic => {
                if (topic.id === activeTopicForBranch) {
                    return { ...topic, isExpanded: true, branches: [...(topic.branches || []), savedBranch] };
                }
                return topic;
            }));
            setNewBranchData({ title: "", description: "" });
            setIsBranchModalOpen(false);
            setActiveTopicForBranch(null);
        } catch (error) {
            console.error("Error creating branch:", error);
        } finally {
            setIsSubmittingBranch(false);
        }
    };

    const handleAddFilesToBranch = async (topicId, branchId, newFiles) => {
        const storedJwt = localStorage.getItem("user_jwt");
        if (!storedJwt) return alert("Authentication token missing. Please log in.");

        const userId = getUserIdFromJwt(storedJwt);
        if (!userId) return alert("Unable to determine user identity from session.");

        setUploadingBranchId(branchId);
        const uploadedFiles = [];

        try {
            for (const file of newFiles) {
                const startResponse = await fetch(`${API_START_URL}resources/${branchId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${storedJwt}`,
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        title: file.name,
                        type: file.type || 'application/octet-stream',
                        size: file.size,
                    }),
                });

                if (!startResponse.ok) {
                    const text = await startResponse.text();
                    throw new Error(`Backend rejected file slot: ${startResponse.status} ${text}`);
                }

                const startData = await startResponse.json();
                const resourceId = startData.resource_id;
                const pathTopicId = startData.topic_id || topicId;
                const pathBranchId = startData.branch_id || branchId;

                if (!resourceId) throw new Error("Missing 'resource_id' from backend creation response.");

                await new Promise(resolve => setTimeout(resolve, 800));

                const safeFileName = `${resourceId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                const uploadPath = `${userId}/${pathTopicId}/${pathBranchId}/${safeFileName}`;
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://zywzqewllxdlvzixpgvs.supabase.co";
                const uploadUrl = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET_NAME)}/${encodeURIComponent(uploadPath)}`;

                const uploadHeaders = new Headers();
                uploadHeaders.set("Authorization", `Bearer ${storedJwt}`);
                uploadHeaders.set("x-upsert", "false");
                if (file.type) uploadHeaders.set("Content-Type", file.type);

                const storageResponse = await fetch(uploadUrl, {
                    method: "POST",
                    headers: uploadHeaders,
                    body: file,
                });

                if (!storageResponse.ok) {
                    const text = await storageResponse.text();
                    throw new Error(`Storage upload failed: ${storageResponse.status} ${text}`);
                }

                const publicUrl = `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/${uploadPath}`;

                uploadedFiles.push({
                    id: resourceId,
                    name: file.name,
                    url: publicUrl
                });
            }

            setTopics(topics.map(topic => {
                if (topic.id === topicId) {
                    return {
                        ...topic,
                        branches: topic.branches.map(branch => {
                            if (branch.id === branchId) {
                                return { ...branch, files: [...(branch.files || []), ...uploadedFiles] };
                            }
                            return branch;
                        })
                    };
                }
                return topic;
            }));
            
        } catch (error) {
            console.error("Upload failure:", error);
            alert(`Upload aborted: ${error.message}`);
        } finally {
            setUploadingBranchId(null);
        }
    };

    const handleDeleteTopic = async (id) => {
        if (!window.confirm("Are you sure you want to delete this topic?")) return;
        try {
            const res = await fetch(`${API_START_URL}topics/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (res.ok) setTopics(topics.filter(t => t.id !== id));
        } catch (err) { console.error(err); }
    };

    const handleDeleteBranch = async (topicId, branchId) => {
        if (!window.confirm("Are you sure you want to delete this branch?")) return;
        try {
            const res = await fetch(`${API_START_URL}branches/${branchId}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (res.ok) {
                setTopics(topics.map(t => t.id === topicId ? { ...t, branches: t.branches.filter(b => b.id !== branchId) } : t));
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteFile = (topicId, branchId, fileId) => {
        if (window.confirm("Are you sure you want to delete this file?")) {
            setTopics(topics.map(topic => topic.id === topicId ? { ...topic, branches: topic.branches.map(b => b.id === branchId ? { ...b, files: b.files.filter(f => f.id !== fileId) } : b) } : topic));
        }
    };

    const handleOpenWorkspace = (topic, branch) => {
        const topicSlug = topic.title.replace(/\s+/g, '-');
        const branchSlug = branch.title.replace(/\s+/g, '-');
        
        const sanitizedFiles = (branch.files || []).map(file => {
            let safeUrl = file.url;
            
            if (!safeUrl || safeUrl === file.id || !safeUrl.startsWith('http')) {
                const storedJwt = localStorage.getItem("user_jwt");
                const userId = getUserIdFromJwt(storedJwt);
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://zywzqewllxdlvzixpgvs.supabase.co";
                const cleanName = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, "_") : "";

                safeUrl = `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/${userId}/${topic.id}/${branch.id}/${file.id}-${cleanName}`;
            }

            return { ...file, url: safeUrl };
        });

        navigate(`/workspace/${topicSlug}/${branchSlug}`, { 
            state: { files: sanitizedFiles, branchName: branch.title, branchId: branch.id, topicId: topic.id } 
        });
    };

    const openEditTopicModal = (topic) => {
        setEditingTopic(topic);
        setEditTopicData({ title: topic.title, description: topic.description || "" });
        setIsEditTopicModalOpen(true);
    };

    const handleEditTopic = async (e) => {
        e.preventDefault();
        if (!editTopicData.title.trim()) return;
        setIsSubmittingEditTopic(true);
        try {
            const res = await fetch(`${API_START_URL}topics/${editingTopic.id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(editTopicData)
            });
            if (res.ok) {
                const updated = await res.json();
                setTopics(topics.map(t => t.id === editingTopic.id ? { ...t, ...updated } : t));
                setIsEditTopicModalOpen(false);
                setEditingTopic(null);
            }
        } catch (error) { console.error(error); } finally { setIsSubmittingEditTopic(false); }
    };

    const openEditBranchModal = (topicId, branch) => {
        setEditingTopicIdForBranch(topicId);
        setEditingBranch(branch);
        setEditBranchData({ title: branch.title, description: branch.description || "" });
        setIsEditBranchModalOpen(true);
    };

    const handleEditBranch = async (e) => {
        e.preventDefault();
        if (!editBranchData.title.trim()) return;
        setIsSubmittingEditBranch(true);
        try {
            const res = await fetch(`${API_START_URL}branches/${editingBranch.id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(editBranchData)
            });
            if (res.ok) {
                const updated = await res.json();
                setTopics(topics.map(t => t.id === editingTopicIdForBranch ? {
                    ...t, branches: t.branches.map(b => b.id === editingBranch.id ? updated : b)
                } : t));
                setIsEditBranchModalOpen(false);
                setEditingBranch(null);
            }
        } catch (error) { console.error(error); } finally { setIsSubmittingEditBranch(false); }
    };

    return (
        <div className="topic-page">
            <SideBar />
            <div className="topic-content">
                <Header />
                
                <div className="topics-header2">
                    <h1>Topics Organization</h1>
                    <input type="text" placeholder="Search for topics..." value={searchTopics} onChange={handleSearchChange} className="search-topics" />
                    <button className="add-topic-button" onClick={() => setIsTopicModalOpen(true)}>Add New Topic</button>
                </div>
                
                <div className="topics-container">
                    {isLoading ? (
                        <div className="loading-state">
                            <Loader2 className="spinner" size={32} />
                            <p>Loading your study materials...</p>
                        </div>
                    ) : topics.length === 0 ? (
                        <div className="empty-state">
                            <BookOpen size={48} style={{ color: 'var(--secondary)' }} />
                            <h3>No topics yet</h3>
                            <p>Create your first topic to start organizing your study materials.</p>
                            <button className="add-topic-button" onClick={() => setIsTopicModalOpen(true)}>Create Topic</button>
                        </div>
                    ) : (
                        topics.filter((topic) => topic.title?.toLowerCase().includes(searchTopics.toLowerCase())).map((topic) => (
                            <div key={topic.id} className="topic-wrapper">
                                <div className="topic-item">
                                    <BookOpen className="topic-icon-default" />
                                    <div className="topic-item-text">
                                        <span>{topic.title}</span>
                                        {topic.description && <p className="topic-description">{topic.description}</p>}
                                    </div>
                                    <button className="delete-topic" onClick={() => handleDeleteTopic(topic.id)} title="Delete topic"><Trash2 size={16} color="red" /></button>
                                    <button className="edit-topic" onClick={() => openEditTopicModal(topic)} title="Edit topic"><Edit2 size={16} /></button>
                                    <button className="new-branch" onClick={() => openBranchModal(topic.id)}>Add New Branch</button>
                                    <button className="up-down-arrow" onClick={() => handleToggleExpand(topic.id)}> 
                                        {topic.isExpanded ? <ChevronUp /> : <ChevronDown />}
                                    </button>
                                </div>

                                {topic.isExpanded && (
                                    <div className="branches-grid">
                                        {topic.branches?.length === 0 ? (
                                             <p className="no-branches-text">No branches here yet. Add one to get started!</p>
                                        ) : (
                                            topic.branches?.map((branch) => (
                                                <div key={branch.id} className="branch-card">
                                                    <div className="branch-header">
                                                        <div className="branch-header-text">
                                                            <h3>{branch.title}</h3>
                                                            {branch.description && <p>{branch.description}</p>}
                                                        </div>
                                                        <div className="branch-actions">
                                                            <button onClick={() => openEditBranchModal(topic.id, branch)} title="Edit branch"><Edit2 size={14} /></button>
                                                            <button onClick={() => handleDeleteBranch(topic.id, branch.id)} title="Delete branch"><Trash2 size={14} color="red" /></button>
                                                        </div>
                                                    </div>

                                                    <ul className="files-list">
                                                        {branch.files?.map((file) => (
                                                            <li key={file.id} className="file-item">
                                                                <div className="file-info">
                                                                    <FileText size={16} color="red" />
                                                                    <span>{file.name}</span>
                                                                </div>
                                                                <div className="file-actions">   
                                                                    <button onClick={() => handleDeleteFile(topic.id, branch.id, file.id)}><Trash2 size={16} color="red" /></button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <FileDropZone 
                                                        onFilesAdded={(files) => handleAddFilesToBranch(topic.id, branch.id, files)} 
                                                        isUploading={uploadingBranchId === branch.id}
                                                    />
                                                    <button className="generate-button" onClick={() => handleOpenWorkspace(topic, branch)}>Open Workspace</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {isTopicModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h2>Create New Topic</h2>
                                <button className="close-modal-btn" onClick={() => setIsTopicModalOpen(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateTopic} className="modal-body">
                                <div className="form-group">
                                    <label>Topic Title</label>
                                    <input type="text" placeholder="e.g., Organic Chemistry" value={newTopicData.title} onChange={(e) => setNewTopicData({...newTopicData, title: e.target.value})} autoFocus required />
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea placeholder="Brief details about this topic..." value={newTopicData.description} onChange={(e) => setNewTopicData({...newTopicData, description: e.target.value})} rows="3" />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setIsTopicModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit" disabled={isSubmittingTopic}>{isSubmittingTopic ? 'Creating...' : 'Create Topic'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isBranchModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h2>Create New Branch</h2>
                                <button className="close-modal-btn" onClick={() => setIsBranchModalOpen(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateBranch} className="modal-body">
                                <div className="form-group">
                                    <label>Branch Title</label>
                                    <input type="text" placeholder="e.g., Hydrocarbons" value={newBranchData.title} onChange={(e) => setNewBranchData({...newBranchData, title: e.target.value})} autoFocus required />
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea placeholder="What does this branch cover?" value={newBranchData.description} onChange={(e) => setNewBranchData({...newBranchData, description: e.target.value})} rows="3" />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setIsBranchModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit" disabled={isSubmittingBranch}>{isSubmittingBranch ? 'Creating...' : 'Create Branch'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isEditTopicModalOpen && editingTopic && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h2>Edit Topic</h2>
                                <button className="close-modal-btn" onClick={() => setIsEditTopicModalOpen(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleEditTopic} className="modal-body">
                                <div className="form-group">
                                    <label>Topic Title</label>
                                    <input type="text" placeholder="e.g., Organic Chemistry" value={editTopicData.title} onChange={(e) => setEditTopicData({...editTopicData, title: e.target.value})} autoFocus required />
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea placeholder="Brief details about this topic..." value={editTopicData.description} onChange={(e) => setEditTopicData({...editTopicData, description: e.target.value})} rows="3" />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setIsEditTopicModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit" disabled={isSubmittingEditTopic}>{isSubmittingEditTopic ? 'Saving...' : 'Save Changes'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isEditBranchModalOpen && editingBranch && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h2>Edit Branch</h2>
                                <button className="close-modal-btn" onClick={() => setIsEditBranchModalOpen(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleEditBranch} className="modal-body">
                                <div className="form-group">
                                    <label>Branch Title</label>
                                    <input type="text" placeholder="e.g., Hydrocarbons" value={editBranchData.title} onChange={(e) => setEditBranchData({...editBranchData, title: e.target.value})} autoFocus required />
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea placeholder="What does this branch cover?" value={editBranchData.description} onChange={(e) => setEditBranchData({...editBranchData, description: e.target.value})} rows="3" />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setIsEditBranchModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit" disabled={isSubmittingEditBranch}>{isSubmittingEditBranch ? 'Saving...' : 'Save Changes'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}            
            </div>
        </div>
    );
}