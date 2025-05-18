import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginSignup from "./components/LoginSignup/LoginSignup";
import ChatPage from "./components/ChatPage/ChatPage";
import ContextProvider from "./context/ContextFile";

function App() {
  return (
    <Router>
      <ContextProvider>
        <Routes>
          <Route path="/" element={<LoginSignup />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </ContextProvider>
    </Router>
  );
}

export default App;