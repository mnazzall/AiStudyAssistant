import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    CheckCircle2, 
    XCircle, 
    ChevronRight, 
    Award, 
    RotateCcw 
} from 'lucide-react';
import './quiz.css';

const staticQuiz = {
    "quizTitle": "Object Oriented Programming",
    "questions": [
        {
            "questionText": "What is polymorphism?",
            "options": [
                "The ability of different objects to respond to the same method call in their own way", 
                "Hiding the internal implementation details of an object", 
                "Creating a new class from an existing class", 
                "A variable that can hold multiple values at once"
            ],
            "correctOptionIndex": 0,
            "explanation": "Polymorphism allows objects of different classes to be treated as objects of a common superclass, responding to the same method call in a way specific to their specific class type."
        },
        {
            "questionText": "What is abstraction?",
            "options": [
                "Copying data from one object to another", 
                "Binding data and methods together in a single unit", 
                "Showing only essential features and hiding background details", 
                "Having multiple methods with the same name but different parameters"
            ],
            "correctOptionIndex": 2,
            "explanation": "Abstraction is the concept of hiding complex implementation details and showing only the essential features of an object, making it easier to use without needing to understand its inner workings."
        }
    ]
};

export default function Quiz() {
    const navigate = useNavigate();
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const quiz = staticQuiz;
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const totalQuestions = quiz.questions.length;

    const handleOptionClick = (index) => {
        if (isSubmitted) return;
        setSelectedOption(index);
    };

    const handleSubmitAnswer = () => {
        if (selectedOption === null) return;
        
        setIsSubmitted(true);
        if (selectedOption === currentQuestion.correctOptionIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsSubmitted(false);
        } else {
            setIsFinished(true);
        }
    };

    const handleRestartQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsSubmitted(false);
        setScore(0);
        setIsFinished(false);
    };

    const getOptionClass = (index) => {
        if (!isSubmitted) {
            return selectedOption === index ? 'quiz-option selected' : 'quiz-option';
        }
        
        if (index === currentQuestion.correctOptionIndex) {
            return 'quiz-option correct';
        }
        if (index === selectedOption && index !== currentQuestion.correctOptionIndex) {
            return 'quiz-option incorrect';
        }
        return 'quiz-option disabled';
    };

    if (isFinished) {
        const percentage = Math.round((score / totalQuestions) * 100);
        
        return (
            <div className="quiz-container">
                <header className="quiz-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Exit Quiz
                    </button>
                    <h2>{quiz.quizTitle}</h2>
                    <div style={{width: '100px'}}></div>
                </header>

                <div className="quiz-content-area">
                    <div className="results-card">
                        <div className="results-icon">
                            <Award size={64} color="#0ea5e9" />
                        </div>
                        <h2>Quiz Completed!</h2>
                        <p className="results-score">You scored <strong>{score}</strong> out of <strong>{totalQuestions}</strong></p>
                        
                        <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${percentage}%`, backgroundColor: percentage >= 70 ? '#22c55e' : (percentage >= 40 ? '#eab308' : '#ef4444') }}></div>
                        </div>
                        <p className="results-percentage">{percentage}% Accuracy</p>

                        <div className="results-actions">
                            <button className="restart-btn" onClick={handleRestartQuiz}>
                                <RotateCcw size={18} /> Restart Quiz
                            </button>
                            <button className="return-btn" onClick={() => navigate(-1)}>
                                Return to Workspace
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
                <h2>{quiz.quizTitle}</h2>
                <div className="question-counter">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
            </header>

            <div className="quiz-progress-wrapper">
                <div className="quiz-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
            </div>

            <main className="quiz-content-area">
                <div className="question-card">
                    <h3 className="question-text">{currentQuestion.questionText}</h3>

                    <div className="options-container">
                        {currentQuestion.options.map((option, index) => (
                            <button 
                                key={index} 
                                className={getOptionClass(index)}
                                onClick={() => handleOptionClick(index)}
                                disabled={isSubmitted}
                            >
                                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                                <span className="option-text">{option}</span>
                                
                                {isSubmitted && index === currentQuestion.correctOptionIndex && (
                                    <CheckCircle2 size={20} color="#22c55e" className="status-icon" />
                                )}
                                {isSubmitted && index === selectedOption && index !== currentQuestion.correctOptionIndex && (
                                    <XCircle size={20} color="#ef4444" className="status-icon" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="quiz-actions">
                        {!isSubmitted ? (
                            <button 
                                className="submit-answer-btn" 
                                onClick={handleSubmitAnswer}
                                disabled={selectedOption === null}
                            >
                                Submit Answer
                            </button>
                        ) : (
                            <div className="feedback-container">
                                <div className={`feedback-banner ${selectedOption === currentQuestion.correctOptionIndex ? 'feedback-correct' : 'feedback-incorrect'}`}>
                                    <div className="feedback-header">
                                        {selectedOption === currentQuestion.correctOptionIndex ? (
                                            <><CheckCircle2 size={24} /> <span>Correct!</span></>
                                        ) : (
                                            <><XCircle size={24} /> <span>Incorrect</span></>
                                        )}
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