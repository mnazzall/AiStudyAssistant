
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Award, RotateCcw, Loader2, Settings, PenTool } from 'lucide-react';
import './quiz.css';
import { API_START_URL } from '../../config';

export default function Quiz() {
    const navigate = useNavigate();
    const location = useLocation();
    const passedFiles = location.state?.selectedFiles || [];

    const [isConfiguring, setIsConfiguring] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [quizData, setQuizData] = useState(null);

    const [difficulty, setDifficulty] = useState("INTERMEDIATE");
    const [numOfQuestions, setNumOfQuestions] = useState(10);
    const [selectedFileId, setSelectedFileId] = useState(passedFiles.length > 0 ? passedFiles[0].id : "");

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [essayAnswer, setEssayAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const handleGenerateQuiz = async (e) => {
        e.preventDefault();
        if (!selectedFileId) return alert("Please select a document.");

        setIsGenerating(true);
        try {
            const userJwt = localStorage.getItem("user_jwt");
            const response = await fetch(`${API_START_URL}quizzes/${selectedFileId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userJwt}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    difficulty: difficulty.toUpperCase(),
                    numOfQuestions: parseInt(numOfQuestions)
                })
            });

            if (!response.ok) throw new Error("Backend failed to generate quiz.");
            const data = await response.json();
            setQuizData(data);
            setIsConfiguring(false);
        } catch (error) {
            console.error(error);
            alert("Failed to generate the quiz.");
        } finally {
            setIsGenerating(false);
        }
    };

    const currentQuestion = quizData?.questions[currentQuestionIndex];
    const totalQuestions = quizData?.questions?.length || 0;
    const isEssay = currentQuestion && (!currentQuestion.options || currentQuestion.options.length === 0);

    const handleSubmitAnswer = () => {
        if (!isEssay && selectedOption === null) return;
        if (isEssay && !essayAnswer.trim()) return;

        setIsSubmitted(true);
        
        if (!isEssay && selectedOption === currentQuestion.correctOptionIndex) {
            setScore(prev => prev + 1);
        } else if (isEssay) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setEssayAnswer('');
            setIsSubmitted(false);
        } else {
            setIsFinished(true);
        }
    };

    const handleRestartQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setEssayAnswer('');
        setIsSubmitted(false);
        setScore(0);
        setIsFinished(false);
    };

    if (isConfiguring) {
        return (
            <div className="quiz-container">
                <header className="quiz-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h2>Quiz Configuration</h2>
                    <div className="quiz-header-spacer"></div>
                </header>

                <main className="quiz-config-main">
                    <div className="quiz-config-card">
                        <Settings size={48} className="quiz-config-icon" />
                        <h2>Setup Your Quiz</h2>
                        
                        <form onSubmit={handleGenerateQuiz} className="quiz-config-form">
                            <div className="form-group">
                                <label className="quiz-config-label">Target Document</label>
                                <select className="quiz-config-select" value={selectedFileId} onChange={(e) => setSelectedFileId(e.target.value)}>
                                    {passedFiles.map(file => (
                                        <option key={file.id} value={file.id}>{file.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="quiz-config-label">Difficulty Level</label>
                                <select className="quiz-config-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                    <option value="FOUNDATIONAL">Foundational</option>
                                    <option value="INTERMEDIATE">Intermediate</option>
                                    <option value="ADVANCED">Advanced</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="quiz-config-label">Questions ({numOfQuestions})</label>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="25" 
                                    value={numOfQuestions} 
                                    onChange={(e) => setNumOfQuestions(e.target.value)} 
                                    className="quiz-config-range" 
                                />
                                <div className="quiz-config-range-labels">
                                    <span>10</span>
                                    <span>25</span>
                                </div>
                            </div>

                            <button type="submit" className="submit-answer-btn quiz-config-submit-btn" disabled={isGenerating}>
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="spinner" size={20} /> Generating...
                                    </>
                                ) : (
                                    'Generate Quiz'
                                )}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    if (isFinished) {
        const percentage = Math.round((score / totalQuestions) * 100);
        return (
            <div className="quiz-container">
                <header className="quiz-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Exit Quiz
                    </button>
                    <h2>{quizData.quizTitle}</h2>
                    <div className="quiz-header-spacer"></div>
                </header>

                <div className="quiz-content-area">
                    <div className="results-card">
                        <Award size={64} className="results-award-icon" />
                        <h2>Quiz Completed!</h2>
                        <p className="results-score">You scored <strong>{score}</strong> out of <strong>{totalQuestions}</strong></p>
                        
                        <div className="progress-bar-container">
                            <div 
                                className="progress-bar-fill" 
                                style={{ 
                                    width: `${percentage}%`, 
                                    backgroundColor: percentage >= 70 ? '#22c55e' : (percentage >= 40 ? '#eab308' : '#ef4444') 
                                }}
                            ></div>
                        </div>

                        <p className="results-percentage">{percentage}% Accuracy</p>
                        <div className="results-actions">
                            <button className="restart-btn" onClick={handleRestartQuiz}>
                                <RotateCcw size={18} /> Retry Quiz
                            </button>
                            <button className="return-btn" onClick={() => setIsConfiguring(true)}>
                                Configure New Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const progressPercentage = ((currentQuestionIndex) / totalQuestions) * 100;

    return (
        <div className="quiz-container">
            <header className="quiz-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> Workspace
                </button>
                <h2>{quizData.quizTitle}</h2>
                <div className="question-counter">Question {currentQuestionIndex + 1} of {totalQuestions}</div>
            </header>

            <div className="quiz-progress-wrapper">
                <div className="quiz-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
            </div>

            <main className="quiz-content-area">
                <div className="question-card">
                    <div className="question-type-badge">
                        {isEssay ? (
                            <>
                                <PenTool size={18} /> <span>Essay Question</span>
                            </>
                        ) : (
                            <span>Multiple Choice</span>
                        )}
                    </div>
                    
                    <h3 className="question-text">{currentQuestion.questionText}</h3>

                    <div className="options-container">
                        {isEssay ? (
                            <textarea 
                                className="essay-textarea"
                                value={essayAnswer}
                                onChange={(e) => setEssayAnswer(e.target.value)}
                                disabled={isSubmitted}
                                placeholder="Type your full answer here..."
                            />
                        ) : (
                            currentQuestion.options.map((option, index) => (
                                <button 
                                    key={index} 
                                    className={`quiz-option ${!isSubmitted ? (selectedOption === index ? 'selected' : '') : (index === currentQuestion.correctOptionIndex ? 'correct' : (selectedOption === index ? 'incorrect' : 'disabled'))}`}
                                    onClick={() => !isSubmitted && setSelectedOption(index)}
                                    disabled={isSubmitted}
                                >
                                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                                    <span className="option-text">{option}</span>
                                    {isSubmitted && index === currentQuestion.correctOptionIndex && <CheckCircle2 size={20} className="status-icon success-icon" />}
                                    {isSubmitted && index === selectedOption && index !== currentQuestion.correctOptionIndex && <XCircle size={20} className="status-icon danger-icon" />}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="quiz-actions">
                        {!isSubmitted ? (
                            <button className="submit-answer-btn" onClick={handleSubmitAnswer} disabled={(!isEssay && selectedOption === null) || (isEssay && !essayAnswer.trim())}>
                                {isEssay ? 'Submit Essay' : 'Submit Answer'}
                            </button>
                        ) : (
                            <div className="feedback-container">
                                <div className={`feedback-banner ${isEssay || selectedOption === currentQuestion.correctOptionIndex ? 'feedback-correct' : 'feedback-incorrect'}`}>
                                    <div className="feedback-header">
                                        <CheckCircle2 size={24} /> <span>{isEssay ? 'Feedback / Solution' : 'Correct!'}</span>
                                    </div>
                                    <p className="explanation-text">{currentQuestion.explanation}</p>
                                </div>
                                <button className="next-question-btn" onClick={handleNextQuestion}>
                                    {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'See Results'} <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}