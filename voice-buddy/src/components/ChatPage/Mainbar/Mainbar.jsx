import { useContext, useEffect, useRef, useState } from "react";
import { assets } from "../../../Assets/assets";
import "./Mainbar.css";
import { Context } from "../../../context/ContextFile";
import Preset from "../../Preset/Preset";
import Result from "../../Result/Result";
import { useNavigate } from 'react-router-dom';


const Mainbar = ({ sidebarCollapsed }) => {
  const {
    input,
    setInput,
    currentConversation,
    showResults,
    setShowResults, // Added this line to fix the error
    loading,
    onSent,
    showResultPage,
    setSelectedGenerateFormat,
    logout
  } = useContext(Context);
  const navigate = useNavigate();
  const [profileDropdownActive, setProfileDropdownActive] = useState(false);
  const resultContainerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showGenerateOptions, setShowGenerateOptions] = useState(false);
  const [showPresetPage, setShowPresetPage] = useState(false);
  
  // Ref to hold the speech recognition instance
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition on component mount
  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      // Handle successful speech recognition
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      // Handle errors
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      // Handle end of speech recognition
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Updated scroll behavior - scroll to bottom when new messages arrive
  useEffect(() => {
    if (resultContainerRef.current) {
      resultContainerRef.current.scrollTop = resultContainerRef.current.scrollHeight;
    }
  }, [currentConversation]);

  // Set showResults based on currentConversation
  useEffect(() => {
    if (currentConversation && currentConversation.messages && currentConversation.messages.length > 0) {
      setShowResults(true);
    }
  }, [currentConversation, setShowResults]);

  // Handle form submission with Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle microphone recording state
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser');
      return;
    }

    if (!isRecording) {
      try {
        setIsRecording(true);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsRecording(false);
      }
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // Toggle dropdown on click instead of hover
  const toggleProfileDropdown = () => {
    setProfileDropdownActive(!profileDropdownActive);
  };

  // Handle sending messages
  const handleSendMessage = () => {
    if (input.trim()) {
      onSent();
      setInput(""); // Clear input field after sending
      
      // Add a small delay then scroll to the bottom to see new messages
      setTimeout(() => {
        if (resultContainerRef.current) {
          resultContainerRef.current.scrollTop = resultContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  // Get user initials for avatar
  const getUserInitial = () => {
    const userEmail = "balakrishnanms@gmail.com"; // This would come from your auth context
    return userEmail.charAt(0).toUpperCase();
  };

  // Handle generate button
  const handleGenerate = () => {
    setShowGenerateOptions(true);
  };

  // Handle format selection
  const handleFormatSelection = (format) => {
    setSelectedGenerateFormat(format);
    setShowGenerateOptions(false);
    onSent(null, format); // Pass the format directly to onSent
  };

  // New function to handle preset settings click
  const handlePresetSettingsClick = () => {
    setShowPresetPage(true);
    setProfileDropdownActive(false); // Close the dropdown
  };

  // New function to return from preset page to main
  const handleBackFromPreset = () => {
    setShowPresetPage(false);
  };

  // Render conversation messages
  const renderMessages = () => {
    if (!currentConversation || currentConversation.messages.length === 0) return null;
  
    return currentConversation.messages.map((msg, index) => (
      <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}>
        <div className="message-avatar">
          {msg.role === 'user' ? (
            <div className="user-avatar">{getUserInitial()}</div>
          ) : (
            <div className="ai-avatar">
              <img src={assets.logo} alt="AI" />
            </div>
          )}
        </div>
        <div className="message-content">
          <p>{msg.content}</p>
        </div>
      </div>
    ));
  };
  
  // Render generate options
  const renderGenerateOptions = () => {
    const formats = [
      'YouTube Script', 'Tweet', 'LinkedIn Post', 
      'Essay', 'Letter', 'To-Do List'
    ];

    return (
      <div className="generate-options">
        <h3>Select Content Format</h3>
        <div className="format-grid">
          {formats.map((format, index) => (
            <div 
              key={index} 
              className="format-option"
              onClick={() => handleFormatSelection(format)}
            >
              {format}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Use the logout function from context
  const handleLogout = async () => {
    try {
      // Simply call the context's logout function
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  };


  // If showing preset page, render it instead of normal content
  if (showPresetPage) {
    return <Preset onBackToMainbar={handleBackFromPreset} />;
  }

  // If showing result page, render it instead of normal content
  if (showResultPage) {
    return <Result />;
  }

  return (
    <div className={`main ${sidebarCollapsed ? "expanded" : ""}`} >
      <div className="nav">
        <div className="logo">
          {/* Changed to use the actual logo image */}
          <img src={assets.logo} alt="VoiceBuddy logo" />
          <p>VoiceBuddy</p>
        </div>
        <div className="profile-section">
          <div className={`profile-dropdown ${profileDropdownActive ? 'active' : ''}`}>
            <div className="user-avatar" onClick={toggleProfileDropdown}>{getUserInitial()}</div>
            <div className="dropdown-content">
              <div className="dropdown-item" onClick={handlePresetSettingsClick}>Preset Settings</div>
              <div className="dropdown-item" onClick={handleLogout}>Log Out</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-container">
        {!showResults ? (
          <div className="welcome">
            <h1>
              Welcome to <span>VoiceBuddy!</span>
            </h1>
            <p>
              Your AI-powered ghost writer assistant. Speak or type your thoughts, and let me
              transform them into beautifully crafted content.
            </p>
          </div>
        ) : (
          <>
            {/* Chat title - now centered and static */}
            {currentConversation && (
              <div className="chat-title-mainbar">
                <h2>{currentConversation.title || "New Chat"}</h2>
              </div>
            )}
            <div className="result" ref={resultContainerRef}>
              {renderMessages()}
              
              {/* Generate Options */}
              {showGenerateOptions && renderGenerateOptions()}
            </div>
          </>
        )}

        {/* Chat Input Bar */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input
              type="text"
              placeholder="Type or tap mic to speak..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="chat-input"
            />
            <div className="chat-input-actions">
              <button 
                className={`mic-button ${isRecording ? 'active' : ''}`}
                onClick={toggleRecording}
                disabled={!('webkitSpeechRecognition' in window)}
              >
                <img 
                  src={assets.mic_icon} 
                  alt={isRecording ? "Stop Recording" : "Start Recording"} 
                  className="mic-icon" 
                />
              </button>
              <button className="send-button" onClick={handleSendMessage}>
                <img src={assets.send_icon} alt="Send" className="send-icon" />
              </button>
            </div>
          </div>
          
          {/* Generate Button - Shown after any conversation has started */}
          {currentConversation && currentConversation.messages && currentConversation.messages.length > 1 && (
            <button className="generate-button" onClick={handleGenerate}>
              Generate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mainbar;