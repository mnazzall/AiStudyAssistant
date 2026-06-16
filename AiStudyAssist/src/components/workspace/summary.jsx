import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle2 } from 'lucide-react';
import './summary.css';

const staticSummary = {
    title: "Introduction to Object Oriented Programming",
    overview: "Object-Oriented Programming (OOP) is a programming paradigm centered around the concept of 'objects', which can contain data and code: data in the form of fields (often known as attributes or properties), and code, in the form of procedures (often known as methods).",
    keyPoints: [
        { title: "Classes & Objects", text: "A class acts as a blueprint, while an object is a specific instance of that blueprint." },
        { title: "Encapsulation", text: "Hides the internal state of an object and requires all interaction to be performed through an object's methods." },
        { title: "Inheritance", text: "Allows classes to inherit features of other classes, promoting code reusability." },
        { title: "Polymorphism", text: "Allows treating objects of different classes through the same interface, enabling flexible code." }
    ],
    conclusion: "Understanding these four pillars is essential for designing robust, scalable, and maintainable software architectures."
};

export default function Summary() {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const textToCopy = `
${staticSummary.title}
\nOverview:\n${staticSummary.overview}
\nKey Concepts:
${staticSummary.keyPoints.map(kp => `- ${kp.title}: ${kp.text}`).join('\n')}
\nConclusion:\n${staticSummary.conclusion}
        `.trim();

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="summary-page">
            <header className="sum-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> Workspace
                </button>
                <h2>Document Summary</h2>
                
                <button className="copy-btn" onClick={handleCopy}>
                    {copied ? <><CheckCircle2 size={16} /> Copied!</> : <><Copy size={16} /> Copy Text</>}
                </button>
            </header>

            <main className="sum-main">
                <article className="sum-document">
                    <h1 className="sum-title">{staticSummary.title}</h1>
                    
                    <section className="sum-section">
                        <h3>Overview</h3>
                        <p>{staticSummary.overview}</p>
                    </section>

                    <section className="sum-section">
                        <h3>Key Concepts</h3>
                        <div className="sum-key-points">
                            {staticSummary.keyPoints.map((point, idx) => (
                                <div key={idx} className="sum-point-card">
                                    <div className="point-bullet">{idx + 1}</div>
                                    <div className="point-content">
                                        <h4>{point.title}</h4>
                                        <p>{point.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="sum-section sum-conclusion">
                        <h3>Conclusion</h3>
                        <p>{staticSummary.conclusion}</p>
                    </section>
                </article>
            </main>
        </div>
    );
}