import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'

import MainLayout from './components/layout/mainLayout'
import Topic from './components/topics/topic'
import SignUp from './components/registration/signUp'
import SignIn from './components/registration/signIn'

function App() {

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={<MainLayout />} />
          <Route path="/topics" element={<Topic />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
