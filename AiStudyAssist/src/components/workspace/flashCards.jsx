// src/components/workspace/Flashcards.jsx
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
            <div className="flashcards-page">
                <header className="fc-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h2>Flashcard Configuration</h2>
                    <div className="fc-header-spacer"></div>
                </header>

                <main className="fc-config-main">
                    <div className="fc-config-card">
                        <Settings size={48} className="fc-config-icon" />
                        <h2 className="fc-config-title">Setup Cards</h2>
                        
                        <form onSubmit={handleGenerateFlashcards} className="fc-config-form">
                            <div className="form-group">
                                <label className="fc-config-label">Target Document</label>
                                <select className="fc-config-select" value={selectedFileId} onChange={(e) => setSelectedFileId(e.target.value)}>
                                    {passedFiles.map(file => (
                                        <option key={file.id} value={file.id}>{file.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="fc-config-label">Cards ({cardCount})</label>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="25" 
                                    value={cardCount} 
                                    onChange={(e) => setCardCount(e.target.value)} 
                                    className="fc-config-range" 
                                />
                                <div className="fc-config-range-labels">
                                    <span>10</span>
                                    <span>25</span>
                               设</div>
                            </div>

                            <button type="submit" disabled={isGenerating} className="fc-config-submit-btn">
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="spinner" size={20} /> Generating...
                                    </>
                                ) : (
                                    'Generate Flashcards'
                                )}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="flashcards-page">
                <header className="fc-header">
                    <button className="back-btn" onClick={() => setIsConfiguring(true)}>
                        <ArrowLeft size={16} /> New Card
                    </button>
                    <h2>Empty Cards</h2>
                    <div className="fc-header-spacer"></div>
                </header>
                <main className="fc-main">
                    <p className="fc-empty-notice">No flashcards could be generated from this document.</p>
                </main>
            </div>
        );
    }

    const currentCard = cards[currentIndex] || {};

    return (
        <div className="flashcards-page">
            <header className="fc-header">
                <button className="back-btn" onClick={() => setIsConfiguring(true)}>
                    <ArrowLeft size={16} /> New Card
                </button>
                <h2>{topic || "Study Deck"}</h2>
                <div className="fc-counter">Card {currentIndex + 1} of {cards.length}</div>
            </header>

            <main className="fc-main">
                <div className="fc-scene" onClick={() => setIsFlipped(!isFlipped)}>
                    <div className={`fc-card ${isFlipped ? 'is-flipped' : ''}`}>
                        <div className="fc-face fc-front">
                            <span className="fc-label">{currentCard.category || "Concept"}</span>
                            <h3 className="fc-front-heading">{currentCard.front}</h3>
                            {currentCard.hint && <p className="fc-front-hint">Hint: {currentCard.hint}</p>}
                        </div>

                        <div className="fc-face fc-back">
                            <span className="fc-label">Answer</span>
                            <p className="fc-back-heading">{currentCard.back}</p>
                        </div>
                    </div>
                </div>

                <div className="fc-controls">
                    <button className="fc-icon-btn" onClick={handleShuffle} title="Shuffle Deck">
                        <Shuffle size={20} />
                    </button>
                    <div className="fc-nav-group">
                        <button className="fc-nav-btn" onClick={handlePrev} title="Previous Card">
                            <ChevronLeft size={24} />
                        </button>
                        <button className="fc-nav-btn" onClick={handleNext} title="Next Card">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                    <button className="fc-icon-btn" onClick={handleRestart} title="Restart Deck">
                        <RotateCcw size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
}