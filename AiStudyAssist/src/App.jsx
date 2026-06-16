import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'

import MainLayout from './components/layout/mainLayout'
import Topic from './components/topics/topic'
import SignUp from './components/registration/signUp'
import SignIn from './components/registration/signIn'
import Workspace from './components/workspace/workspace'
import Quiz from './components/workspace/quiz'
import Summary from './components/workspace/summary'
import FlashCards from './components/workspace/flashCards'

function App() {

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={<MainLayout />} />
          <Route path="/topics" element={<Topic />} />
          <Route path="/workspace/:topicName/:branchName" element={<Workspace />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/flashcards" element={<FlashCards />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
