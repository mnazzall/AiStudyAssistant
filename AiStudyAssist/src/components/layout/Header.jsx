
import React, { useState, useRef, useEffect } from "react";
import { Bell, Settings, Search, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import './Header.css'

const Header = ({ branchName }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const userData = localStorage.getItem("user_name");
        if (userData) {
            setUserName(userData);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSignOut = () => {
        localStorage.removeItem("user_jwt");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        setIsDropdownOpen(false);
        navigate("/signin");
    };

    const getFirstLetter = () => {
        if (userName) {
            return userName.charAt(0).toUpperCase();
        }
        return "U";
    };

    

    return (
        <header className="header">
            
           
            {branchName && (
                <div style={{ marginRight: 'auto', paddingRight: '20px', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-strong)', display: 'flex', alignItems: 'center' }}>
                    {branchName}
                </div>
            )}

            <div className="header-search-container">
                <Search className="search-icon" size={18} />
                <input
                    type="text"
                    placeholder="Search topics, notes, materials..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="header-search-bar"
                />
            </div>

            <div className="header-actions">
                <button className="icon-button">
                    <Bell size={20} />
                    <span className="notification-dot"></span>
                </button>

                <button className="icon-button">
                    <Settings size={20} />
                </button>

                <div className="user-menu-container" ref={dropdownRef}>
                    <button 
                        className="user-avatar-button" 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        title={userName}
                    >
                        {getFirstLetter()}
                    </button>
                    
                    {isDropdownOpen && (
                        <div className="user-dropdown-menu">
                            <div className="dropdown-header">
                                <span className="dropdown-user-name">{userName || "User"}</span>
                            </div>
                            <button 
                                className="dropdown-item dropdown-item-danger"
                                onClick={handleSignOut}
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header;