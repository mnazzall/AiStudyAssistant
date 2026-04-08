import React,{useState} from "react";
import SideBar from "../layout/SideBar";
import Header from "../layout/Header";
import './topic.css'

function Topic() {
    const [topics, setTopics] = useState([
        "Organic Chemistry",
        "Ancient History",  
        "Geography",
    ]);

    return (
        <div className="topic-page">
            <SideBar />
            <div className="topic-content">
                <Header />
                <h1>Topics</h1>
                <div className="topics-container">
                <ul className="topics-list">
                    {topics.map((topic, index) => ( 
                        <li key={index} className="topic-item">
                            {topic}
                        </li>   
                    ))}
                </ul>
                </div>
            </div>
        </div>
    )
}   

export default Topic;