import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import './flashCards.css';

const staticFlashcards = [
    { id: 1, term: "Polymorphism", definition: "The ability of different objects to respond to the same method call in their own specific way." },
    { id: 2, term: "Encapsulation", definition: "Binding data and methods together into a single unit (class) and restricting access to some of the object's components." },
    { id: 3, term: "Inheritance", definition: "A mechanism where a new class derives properties and characteristics from an existing class." },
    { id: 4, term: "Abstraction", definition: "Hiding complex implementation details and showing only the essential features of an object." }
];

export default function Flashcards() {
    const navigate = useNavigate();
    const [cards, setCards] = useState(staticFlashcards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length);
        }, 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        }, 150);
    };

    const handleShuffle = () => {
        setIsFlipped(false);
        setTimeout(() => {
            const shuffled = [...cards].sort(() => Math.random() - 0.5);
            setCards(shuffled);
            setCurrentIndex(0);
        }, 200);
    };

    const handleRestart = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex(0);
        }, 200);
    };

    return (
        <div className="flashcards-page">
            <header className="fc-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> Workspace
                </button>
                <h2>Object Oriented Programming</h2>
                <div className="fc-counter">
                    Card {currentIndex + 1} of {cards.length}
                </div>
            </header>

            <main className="fc-main">
                <div className="fc-scene" onClick={() => setIsFlipped(!isFlipped)}>
                    <div className={`fc-card ${isFlipped ? 'is-flipped' : ''}`}>
                        <div className="fc-face fc-front">
                            <span className="fc-label">Term</span>
                            <h3>{cards[currentIndex].term}</h3>
                            <p className="fc-hint">Click to flip</p>
                        </div>

                        <div className="fc-face fc-back">
                            <span className="fc-label">Definition</span>
                            <p>{cards[currentIndex].definition}</p>
                        </div>
                    </div>
                </div>

                <div className="fc-controls">
                    <button className="fc-icon-btn" onClick={handleShuffle} title="Shuffle">
                        <Shuffle size={20} />
                    </button>
                    
                    <div className="fc-nav-group">
                        <button className="fc-nav-btn" onClick={handlePrev}>
                            <ChevronLeft size={24} />
                        </button>
                        <button className="fc-nav-btn" onClick={handleNext}>
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <button className="fc-icon-btn" onClick={handleRestart} title="Restart">
                        <RotateCcw size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
}