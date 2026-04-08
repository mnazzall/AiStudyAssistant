import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, BookOpen } from "lucide-react";
import './SideBar.css'

const SideBar = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const navigate = useNavigate();

  const navLinks = [
    { name: "Dashboard", icon: Home, path: "/" },
    { name: "Topics", icon: BookOpen, path: "/topics" },
  ];

  const handleNavClick = (link) => {
    setActiveTab(link.name);
    navigate(link.path);
  };

  return (
    <div className="sidebar">   
      <div className="sidebar-logo">
        <img 
          src="./src/assets/Photos/logo.png" 
          className="logo-icon" 
        />
        <span className="logo-text">Aura Study</span>
      </div>
      <div className="sidebar-nav">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.name}
              className={`nav-item ${activeTab === link.name ? "active" : ""}`}
              onClick={() => handleNavClick(link)}
            >
              <Icon />
              {link.name}
            </button>
          );
        })}
      </div>
    </div>
  )
}

export default SideBar;