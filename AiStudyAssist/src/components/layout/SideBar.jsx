import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen } from "lucide-react";
import './SideBar.css'

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: "Dashboard", icon: Home, path: "/" },
    { name: "Topics", icon: BookOpen, path: "/topics" },
  ];

  const getActiveTab = () => {
    const currentPath = location.pathname;
    const activeLink = navLinks.find(link => link.path === currentPath);
    return activeLink ? activeLink.name : "Dashboard";
  };

  const handleNavClick = (link) => {
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
              className={`nav-item ${getActiveTab() === link.name ? "active" : ""}`}
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