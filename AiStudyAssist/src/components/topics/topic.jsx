import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Atom, 
    Landmark, 
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
import { API_START_URL } from '../../config'; 

const FileDropZone = ({ onFilesAdded }) => {
    // ... (Keep this component exactly the same as before) ...
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesAdded(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };
    const handleBrowseClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) onFilesAdded(Array.from(e.target.files));
    };

    return (
        <div className={`drag-drop-zone ${isDragging ? 'drag-active' : ''}`} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            <div style={{ pointerEvents: 'none' }}>
                <CloudUpload size={24} style={{ margin: '0 auto 8px', color: '#718096' }} />
                <p>Drag & drop files here, or <span className="browse-link" style={{ pointerEvents: 'auto', cursor: 'pointer', color: '#0ea5e9', textDecoration: 'underline' }} onClick={handleBrowseClick}>browse</span></p>
            </div>
        </div>
    );
};

function Topic() {
    const navigate = useNavigate();
    const [searchTopics, setSearchTopics] = useState("");
    
    // --- APP STATE ---
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- MODAL STATES ---
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [newTopicData, setNewTopicData] = useState({ title: "", description: "" });
    const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [activeTopicForBranch, setActiveTopicForBranch] = useState(null);
    const [newBranchData, setNewBranchData] = useState({ title: "", description: "" });
    const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);

    // --- EDIT MODAL STATES ---
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

    // Add this helper inside your Topic component
const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem("user_jwt")}`,
    'ngrok-skip-browser-warning': 'true'
});
    // ==========================================
    // 1. GET TOPICS ON LOAD
    // ==========================================
    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        setIsLoading(true);
        try {
            const userJwt = localStorage.getItem("user_jwt");
            if (!userJwt) return navigate('/signin');

            const response = await fetch(`${API_START_URL}topics`, {
                headers: {
                    'Authorization': `Bearer ${userJwt}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) throw new Error("Failed to fetch topics");
            
            const data = await response.json();
            
            // Map the backend data and ensure they have isExpanded and branches arrays
            const formattedTopics = data.map(topic => ({
                ...topic,
                icon: BookOpen, // Dynamic icons can be added later
                isExpanded: false,
                branches: [],
                branchesLoaded: false // Tracks if we've fetched branches for this topic yet
            }));
            
            setTopics(formattedTopics);
        } catch (error) {
            console.error("Error loading topics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // GET BRANCHES (Lazy Load when expanded)
    // ==========================================
    const handleToggleExpand = async (topicId) => {
        // Find the specific topic the user clicked
        const topic = topics.find(t => t.id === topicId);
        
        // ONLY fetch if we are opening it AND we haven't fetched these branches before
        if (!topic.isExpanded && !topic.branchesLoaded) {
            try {
                const userJwt = localStorage.getItem("user_jwt");
                
                // THE GET REQUEST
                const response = await fetch(`${API_START_URL}branches/topic/${topicId}`, {
                    method: 'GET', // GET is default, but good to be explicit
                    headers: {
                        'Authorization': `Bearer ${userJwt}`,
                        'ngrok-skip-browser-warning': 'true'
                    }
                });

                if (response.ok) {
                    const branchesData = await response.json();
                    
                    // Update the state: attach the new branches and mark them as loaded
                    setTopics(prev => prev.map(t => 
                        t.id === topicId ? { ...t, branches: branchesData, branchesLoaded: true } : t
                    ));
                } else {
                    console.error("Failed to load branches from backend.");
                }
            } catch (error) {
                console.error("Error loading branches:", error);
            }
        }

        // Finally, toggle the UI to open/close the accordion
        setTopics(prev => prev.map(t => 
            t.id === topicId ? { ...t, isExpanded: !t.isExpanded } : t
        ));
    };

    // ==========================================
    // 3. POST NEW TOPIC
    // ==========================================
    const handleCreateTopic = async (e) => {
        e.preventDefault();
        if (!newTopicData.title.trim()) return;

        setIsSubmittingTopic(true);
        try {
            const userJwt = localStorage.getItem("user_jwt");
            const response = await fetch(`${API_START_URL}topics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userJwt}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(newTopicData)
            });

            if (!response.ok) throw new Error("Failed to create topic");

            const savedTopic = await response.json();
            
            setTopics([...topics, { 
                ...savedTopic,
                icon: BookOpen,
                isExpanded: true, 
                branches: [],
                branchesLoaded: true
            }]);

            setNewTopicData({ title: "", description: "" });
            setIsTopicModalOpen(false);
        } catch (error) {
            console.error("Error creating topic:", error);
            alert("Failed to create topic.");
        } finally {
            setIsSubmittingTopic(false);
        }
    };

   // ==========================================
    // 4. POST NEW BRANCH
    // ==========================================
    const openBranchModal = (topicId) => {
        setActiveTopicForBranch(topicId);
        setIsBranchModalOpen(true);
    };

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        if (!newBranchData.title.trim()) return;

        setIsSubmittingBranch(true);
        try {
            const userJwt = localStorage.getItem("user_jwt");
            
            // The payload now only needs title and description
            const payload = {
                title: newBranchData.title,
                description: newBranchData.description
            };

            // THE FIX: Appended the activeTopicForBranch directly to the URL path
            const response = await fetch(`${API_START_URL}branches/${activeTopicForBranch}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userJwt}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to create branch");

            const savedBranch = await response.json();

            // Update the UI with the new branch
            setTopics(topics.map(topic => {
                if (topic.id === activeTopicForBranch) {
                    return {
                        ...topic,
                        isExpanded: true,
                        branches: [...(topic.branches || []), savedBranch]
                    };
                }
                return topic;
            }));

            // Reset modal states
            setNewBranchData({ title: "", description: "" });
            setIsBranchModalOpen(false);
            setActiveTopicForBranch(null);
            
        } catch (error) {
            console.error("Error creating branch:", error);
            alert("Failed to create branch.");
        } finally {
            setIsSubmittingBranch(false);
        }
    };

    // ==========================================
    // FILE UPLOAD (Remains the same as before)
    // ==========================================
    const handleAddFilesToBranch = async (topicId, branchId, newFiles) => {
        try {
            const userJwt = localStorage.getItem("user_jwt");
            const uploadedFiles = [];

            for (const file of newFiles) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('topicId', topicId);
                formData.append('branchId', branchId);

                const response = await fetch(`${API_START_URL}upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${userJwt}`,
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: formData 
                });

                if (!response.ok) throw new Error(`Backend rejected file: ${file.name}`);
                const savedFile = await response.json();
                
                uploadedFiles.push({
                    id: savedFile.id || Date.now() + Math.random(), 
                    name: file.name,
                    url: savedFile.url 
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
            console.error("Error uploading files to backend:", error);
            alert("Failed to upload files.");
        }
    };

    const handleOpenWorkspace = (topic, branch) => {
        const topicSlug = topic.title.replace(/\s+/g, '-');
        const branchSlug = branch.title.replace(/\s+/g, '-');

        navigate(`/workspace/${topicSlug}/${branchSlug}`, { 
            state: { files: branch.files, branchName: branch.title } 
        });
    };

    // Note: Edit/Delete API calls omitted for brevity but UI handles state deletion
    const handleDeleteTopic = async (id) => {
        if (!window.confirm("Are you sure you want to delete this topic?")) return;
        
        try {
            const res = await fetch(`${API_START_URL}topics/${id}`, { 
                method: 'DELETE', 
                headers: getAuthHeaders() 
            });
            if (res.ok) {
                setTopics(topics.filter(t => t.id !== id));
            }
        } catch (err) { console.error(err); alert("Failed to delete topic"); }
    };

    // 4. DELETE: Branch
    const handleDeleteBranch = async (topicId, branchId) => {
        if (!window.confirm("Are you sure you want to delete this branch?")) return;
        
        try {
            const res = await fetch(`${API_START_URL}branches/${branchId}`, { 
                method: 'DELETE', 
                headers: getAuthHeaders() 
            });
            if (res.ok) {
                setTopics(topics.map(t => t.id === topicId ? { 
                    ...t, 
                    branches: t.branches.filter(b => b.id !== branchId) 
                } : t));
            }
        } catch (err) { console.error(err); alert("Failed to delete branch"); }
    };

    const handleDeleteFile = (topicId, branchId, fileId) => {
        if (window.confirm("Are you sure you want to delete this file?")) {
            setTopics(topics.map(topic => topic.id === topicId ? { ...topic, branches: topic.branches.map(b => b.id === branchId ? { ...b, files: b.files.filter(f => f.id !== fileId) } : b) } : topic));
        }
    };

    // ==========================================
    // EDIT TOPIC
    // ==========================================
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
                setEditTopicData({ title: "", description: "" });
            } else {
                throw new Error("Failed to update topic");
            }
        } catch (error) {
            console.error("Error updating topic:", error);
            alert("Failed to update topic.");
        } finally {
            setIsSubmittingEditTopic(false);
        }
    };

    // ==========================================
    // EDIT BRANCH
    // ==========================================
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
                    ...t,
                    branches: t.branches.map(b => b.id === editingBranch.id ? updated : b)
                } : t));
                setIsEditBranchModalOpen(false);
                setEditingBranch(null);
                setEditingTopicIdForBranch(null);
                setEditBranchData({ title: "", description: "" });
            } else {
                throw new Error("Failed to update branch");
            }
        } catch (error) {
            console.error("Error updating branch:", error);
            alert("Failed to update branch.");
        } finally {
            setIsSubmittingEditBranch(false);
        }
    };

    return (
        <div className="topic-page">
            <SideBar />
            <div className="topic-content">
                <Header />
                
                <div className="topics-header2">
                    <h1>Topics Organization</h1>
                    <input
                        type="text"
                        placeholder="Search for topics..."
                        value={searchTopics}
                        onChange={handleSearchChange}
                        className="search-topics"
                    />
                    <button className="add-topic-button" onClick={() => setIsTopicModalOpen(true)}>
                        Add New Topic
                    </button>
                </div>
                
                <div className="topics-container">
                    {isLoading ? (
                        <div className="loading-state">
                            <Loader2 className="spinner" size={32} />
                            <p>Loading your study materials...</p>
                        </div>
                    ) : topics.length === 0 ? (
                        <div className="empty-state">
                            <BookOpen size={48} color="#cbd5e1" />
                            <h3>No topics yet</h3>
                            <p>Create your first topic to start organizing your study materials.</p>
                            <button className="add-topic-button" onClick={() => setIsTopicModalOpen(true)}>Create Topic</button>
                        </div>
                    ) : (
                        topics.filter((topic) =>
                            topic.title?.toLowerCase().includes(searchTopics.toLowerCase())
                        ).map((topic) => (
                            <div key={topic.id} className="topic-wrapper">
                             
                                <div className="topic-item">
                                    <BookOpen className="topic-icon-default" />
                                    
                                    <div className="topic-item-text">
                                        <span>{topic.title}</span>
                                        {topic.description && <p className="topic-description">{topic.description}</p>}
                                    </div>

                                    <button className="delete-topic" onClick={() => handleDeleteTopic(topic.id)} title="Delete topic">
                                        <Trash2 size={16} color="red" />
                                    </button>
                                    <button className="edit-topic" onClick={() => openEditTopicModal(topic)} title="Edit topic">
                                        <Edit2 size={16} />
                                    </button>
                                    {/* OPENS THE NEW BRANCH MODAL */}
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
                                                    />

                                                    <button 
                                                        className="generate-button" 
                                                        onClick={() => handleOpenWorkspace(topic, branch)}
                                                    >
                                                        Open Workspace
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* --- TOPIC MODAL --- */}
                {isTopicModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h2>Create New Topic</h2>
                                <button className="close-modal-btn" onClick={() => setIsTopicModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateTopic} className="modal-body">
                                <div className="form-group">
                                    <label>Topic Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Organic Chemistry"
                                        value={newTopicData.title}
                                        onChange={(e) => setNewTopicData({...newTopicData, title: e.target.value})}
                                        autoFocus required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea 
                                        placeholder="Brief details about this topic..."
                                        value={newTopicData.description}
                                        onChange={(e) => setNewTopicData({...newTopicData, description: e.target.value})}
                                        rows="3"
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setIsTopicModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit" disabled={isSubmittingTopic}>
                                        {isSubmittingTopic ? 'Creating...' : 'Create Topic'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- BRANCH MODAL --- */}
                {isBranchModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h2>Create New Branch</h2>
                                <button className="close-modal-btn" onClick={() => setIsBranchModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateBranch} className="modal-body">
                                <div className="form-group">
                                    <label>Branch Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Hydrocarbons"
                                        value={newBranchData.title}
                                        onChange={(e) => setNewBranchData({...newBranchData, title: e.target.value})}
                                        autoFocus required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea 
                                        placeholder="What does this branch cover?"
                                        value={newBranchData.description}
                                        onChange={(e) => setNewBranchData({...newBranchData, description: e.target.value})}
                                        rows="3"
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setIsBranchModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit" disabled={isSubmittingBranch}>
                                        {isSubmittingBranch ? 'Creating...' : 'Create Branch'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- EDIT TOPIC MODAL --- */}
                {isEditTopicModalOpen && editingTopic && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h2>Edit Topic</h2>
                                <button className="close-modal-btn" onClick={() => setIsEditTopicModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleEditTopic} className="modal-body">
                                <div className="form-group">
                                    <label>Topic Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Organic Chemistry"
                                        value={editTopicData.title}
                                        onChange={(e) => setEditTopicData({...editTopicData, title: e.target.value})}
                                        autoFocus required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea 
                                        placeholder="Brief details about this topic..."
                                        value={editTopicData.description}
                                        onChange={(e) => setEditTopicData({...editTopicData, description: e.target.value})}
                                        rows="3"
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setIsEditTopicModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit" disabled={isSubmittingEditTopic}>
                                        {isSubmittingEditTopic ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- EDIT BRANCH MODAL --- */}
                {isEditBranchModalOpen && editingBranch && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h2>Edit Branch</h2>
                                <button className="close-modal-btn" onClick={() => setIsEditBranchModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleEditBranch} className="modal-body">
                                <div className="form-group">
                                    <label>Branch Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Hydrocarbons"
                                        value={editBranchData.title}
                                        onChange={(e) => setEditBranchData({...editBranchData, title: e.target.value})}
                                        autoFocus required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea 
                                        placeholder="What does this branch cover?"
                                        value={editBranchData.description}
                                        onChange={(e) => setEditBranchData({...editBranchData, description: e.target.value})}
                                        rows="3"
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setIsEditBranchModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit" disabled={isSubmittingEditBranch}>
                                        {isSubmittingEditBranch ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}            </div>
        </div>
    )
}

export default Topic;