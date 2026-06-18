import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Settings, Loader2 } from 'lucide-react';
import './flashCards.css';
import { API_START_URL } from '../../config';

export default function Flashcards() {
    const navigate = useNavigate();
    const location = useLocation();
    const passedFiles = location.state?.selectedFiles || [];

    const [isConfiguring, setIsConfiguring] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // FIX: Set limits 10 to 25
    const [cardCount, setCardCount] = useState(10);
    const [selectedFileId, setSelectedFileId] = useState(passedFiles.length > 0 ? passedFiles[0].id : "");

    const [topic, setTopic] = useState("");
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleGenerateFlashcards = async (e) => {
        e.preventDefault();
        if (!selectedFileId) return;

        setIsGenerating(true);
        try {
            const userJwt = localStorage.getItem("user_jwt");
            const response = await fetch(`${API_START_URL}flashcards/${selectedFileId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userJwt}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ count: parseInt(cardCount) })
            });

            if (!response.ok) throw new Error("Backend failed.");
            const data = await response.json();
            setTopic(data.topic);
            setCards(data.cards);
            setIsConfiguring(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNext = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 150); };
    const handlePrev = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 150); };
    const handleShuffle = () => { setIsFlipped(false); setTimeout(() => { setCards([...cards].sort(() => Math.random() - 0.5)); setCurrentIndex(0); }, 200); };
    const handleRestart = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex(0), 200); };

    if (isConfiguring) {
        return (
            <div className="flashcards-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-main)' }}>
                <header className="fc-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
                    <h2>Flashcard Configuration</h2>
                    <div style={{width: '100px'}}></div>
                </header>
                <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '40px', borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%', border: '1px solid var(--border-light)' }}>
                        <Settings size={48} color="#0ea5e9" style={{ display: 'block', margin: '0 auto 16px' }} />
                        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Setup Deck</h2>
                        <form onSubmit={handleGenerateFlashcards} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ fontWeight: '600' }}>Target Document</label>
                                <select value={selectedFileId} onChange={(e) => setSelectedFileId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                                    {passedFiles.map(file => <option key={file.id} value={file.id}>{file.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600' }}>Cards ({cardCount})</label>
                                {/* FIX: Range limits updated to 10 - 25 */}
                                <input type="range" min="10" max="25" value={cardCount} onChange={(e) => setCardCount(e.target.value)} style={{ width: '100%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}><span>10</span><span>25</span></div>
                            </div>
                            <button type="submit" disabled={isGenerating} style={{ padding: '12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                                {isGenerating ? <Loader2 className="spinner" size={20} /> : 'Generate Flashcards'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="flashcards-page">
            <header className="fc-header">
                <button className="back-btn" onClick={() => setIsConfiguring(true)}><ArrowLeft size={16} /> New Deck</button>
                <h2>{topic || "Study Deck"}</h2>
                <div className="fc-counter">Card {currentIndex + 1} of {cards.length}</div>
            </header>

            <main className="fc-main">
                <div className="fc-scene" onClick={() => setIsFlipped(!isFlipped)}>
                    <div className={`fc-card ${isFlipped ? 'is-flipped' : ''}`}>
                        
                        {/* FIX: Wrap content in an overflow-y div so long text scrolls inside the 3D card instead of breaking layout */}
                        <div className="fc-face fc-front" style={{ overflowY: 'auto' }}>
                            <span className="fc-label" style={{ position: 'sticky', top: 0 }}>{currentCard.category || "Concept"}</span>
                            <h3 style={{ marginTop: '20px' }}>{currentCard.front}</h3>
                            {currentCard.hint && <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Hint: {currentCard.hint}</p>}
                        </div>

                        <div className="fc-face fc-back" style={{ overflowY: 'auto' }}>
                            <span className="fc-label" style={{ position: 'sticky', top: 0 }}>Answer</span>
                            <p style={{ marginTop: '20px' }}>{currentCard.back}</p>
                        </div>

                    </div>
                </div>

                <div className="fc-controls">
                    <button className="fc-icon-btn" onClick={handleShuffle}><Shuffle size={20} /></button>
                    <div className="fc-nav-group">
                        <button className="fc-nav-btn" onClick={handlePrev}><ChevronLeft size={24} /></button>
                        <button className="fc-nav-btn" onClick={handleNext}><ChevronRight size={24} /></button>
                    </div>
                    <button className="fc-icon-btn" onClick={handleRestart}><RotateCcw size={20} /></button>
                </div>
            </main>
        </div>
    );
}