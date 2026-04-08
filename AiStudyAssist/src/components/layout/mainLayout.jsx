import React from "react";
import {FileSearch, Brain, SquareStack} from "lucide-react";
import SideBar from "./SideBar";
import Header from "./Header";
import './mainLayout.css'

function MainLayout() {

    const features = [
        {
            id: 1,
            title: "Summarize Text",
            description: "Paste material to extract key concepts and create concise study guides.",
            icon: <FileSearch />,
        },
        {
        id: 2,
        title: "Interactive Quizzes",
        description: "Test your understanding with customizable quizzes generated from your materials.",
        icon: <Brain /> 
    },
    {
        id: 3,
        title: "Smart Flashcards",
        description: "Review information using active recall and spaced repetition for optimal learning.",
        icon: <SquareStack/>
    }
    ];

  return (
    <div className="main-layout">

        <SideBar />

        <div className="main-content">
            <Header />
            <div className="content">
                <h1>Welcome to Aura Study Assistant</h1>
                <div className="features-section">
                <h2 className="features-heading">Features Showcase</h2>
                
                    <ul className="features-list">
                    {features.map((feature) => (
                    <li key={feature.id} className="feature-card">
                        <div className="feature-icon">{feature.icon}</div>
                        <h3 className="feature-title">{feature.title}</h3>
                        <p className="feature-description">{feature.description}</p>
                    </li> ))}
                    </ul>
                </div>

            </div>
        </div>

    </div>
  )
}

export default MainLayout;