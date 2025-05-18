import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../../config/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import "./LoginSignup.css";

// Import assets
import personIcon from "../../Assets/person.png";
import emailIcon from "../../Assets/email.png";
import passwordIcon from "../../Assets/password.png";
import googleIcon from "../../Assets/google_icon.png";
import logo from "../../Assets/logo.png";

const LoginSignup = () => {
  const [activeTab, setActiveTab] = useState("Sign Up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Reset form when tab changes
  useEffect(() => {
    // Reset form data and messages when changing tabs
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
  }, [activeTab]);

  // Simple error handler
  const handleError = (errorCode) => {
    const errorMessages = {
      "auth/email-already-in-use": "This email is already registered. Try logging in.",
      "auth/invalid-email": "Invalid email format. Please enter a valid email.",
      "auth/weak-password": "Password is too weak. Use at least 6 characters.",
      "auth/invalid-credential": "Incorrect email or password. Try again.",
      "auth/user-not-found": "No account found with this email. Please sign up.",
      "auth/popup-closed-by-user": "Google Sign-In was canceled. Try again.",
      "auth/missing-email": "Please enter an email address.",
    };
    
    return errorMessages[errorCode] || "Something went wrong. Please try again.";
  };

  // Handle email/password auth
  const handleSubmit = async () => {
    // Clear previous messages
    setError("");
    setSuccess("");
    
    try {
      if (!email) {
        setError("Please enter your email address.");
        return;
      }
      
      if (!password) {
        setError("Please enter your password.");
        return;
      }
      
      if (activeTab === "Sign Up") {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("Signup successful! Redirecting...");
        setTimeout(() => navigate("/chat"), 1500);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => navigate("/chat"), 1500);
      }
    } catch (error) {
      setError(handleError(error.code));
      console.error("Auth error:", error);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    // Clear previous messages
    setError("");
    setSuccess("");
    
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccess("Google Sign-In successful! Redirecting...");
      setTimeout(() => navigate("/chat"), 1500);
    } catch (error) {
      setError(handleError(error.code));
      console.error("Google auth error:", error);
    }
  };

  return (
    <div className="container">
      {/* Logo and App Name */}
      <div className="logo-container">
        <img src={logo} alt="VoiceBuddy Logo" />
        <h2 className="app-name">VoiceBuddy</h2>
      </div>

      {/* Title */}
      <h2 className="title">{activeTab}</h2>
      <div className="underline"></div>

      {/* Status Messages */}
      <div className="message-container">
        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}
      </div>

      {/* Input Fields */}
      <div className="inputs">
        {activeTab === "Sign Up" && (
          <div className="input">
            <img src={personIcon} alt="Person" />
            <input 
              type="text" 
              placeholder="Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
        )}
        
        <div className="input">
          <img src={emailIcon} alt="Email" />
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        
        <div className="input">
          <img src={passwordIcon} alt="Password" />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="button-container">
        <button 
          className={activeTab === "Sign Up" ? "button active" : "button"} 
          onClick={() => setActiveTab("Sign Up")}
        >
          Sign Up
        </button>
        <button 
          className={activeTab === "Login" ? "button active" : "button"} 
          onClick={() => setActiveTab("Login")}
        >
          Login
        </button>
      </div>

      {/* Action Button */}
      <button className="login-action-button" onClick={handleSubmit}>
        {activeTab}
      </button>

      {/* Divider */}
      <div className="divider">
        <span>or</span>
      </div>

      {/* Google Sign-In Button */}
      <button className="google-button" onClick={handleGoogleSignIn}>
        <img src={googleIcon} alt="Google" className="google-icon" /> 
        Sign in with Google
      </button>
    </div>
  );
};

export default LoginSignup;