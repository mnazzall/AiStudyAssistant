import React,{useState} from "react";
import {Bell,Settings} from "lucide-react";
import './Header.css'

const Header = () => {

    const [searchQuery, setSearchQuery] = useState("");

    const allTopics = [
    "Organic Chemistry",
    "Ancient History",
    "Geography",
    "Calculus",
    "Literature",
    "Physics",
  ];

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    }

    const flterTopics = allTopics.filter((topic) =>
        topic.toLowerCase().includes(searchQuery.toLowerCase())
     );

    return (
        <div className="header">
            <input
                type="text"
                placeholder="Search topics, notes, materials..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-bar"
            />
            <div className = "buttons-box">
            <button className="Bell">
                <Bell />
            </button>
            <button className="Settings">
                <Settings />
            </button>
            </div>

        </div>
    )
}

export default Header;