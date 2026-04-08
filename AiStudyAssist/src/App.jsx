import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'

import MainLayout from './components/layout/mainLayout'
import Topic from './components/topics/topic'

function App() {

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />} />
          <Route path="/topics" element={<Topic />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
