import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import run from "../config/gemini";
import { useNavigate } from 'react-router-dom';

import { 
  saveUserConversations, 
  getUserConversations, 
  saveUserPresets, 
  getUserPresets 
} from "../config/firestoreService";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(false);
  const [selectedGenerateFormat, setSelectedGenerateFormat] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showResultPage, setShowResultPage] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [presets, setPresets] = useState({});
  const [userLoaded, setUserLoaded] = useState(false); // Track when user data is loaded
  const [firestoreSaveInProgress, setFirestoreSaveInProgress] = useState(false); // Add this to track Firestore saves
  const navigate = useNavigate();

  // Generate a short, friendly title
  const generateConversationTitle = async (prompt) => {
    const titlePrompt = `Create a catchy, friendly conversation title (2-5 words). Return only the title, nothing else.\n\nUser Input: ${prompt}`;
    try {
      const title = await run(titlePrompt);
      return title.trim().replace(/[*"]/g, '');
    } catch (error) {
      console.error('Error generating title:', error);
      return 'Untitled Chat';
    }
  };
  
  // Updated logout function to properly sign out and reset state
  const logout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      resetAppState();
      navigate("/"); // Navigate to login page after successful logout
    } catch (error) {
      console.error("Logout error:", error);
      throw error; // Propagate error for handling in UI
    }
  };
  
  const deleteConversation = async (conversationId) => {
    setConversations((prevConversations) => {
      const updatedConversations = prevConversations.filter((conv) => conv.id !== conversationId);
      
      // Update Firestore after deleting conversation
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        saveUserConversations(user.uid, updatedConversations);
      }
      
      return updatedConversations;
    });
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      localStorage.removeItem('currentConversationId');
    }
  };
  
  const updateConversationTitle = async (conversationId, newTitle) => {
    setConversations((prevConversations) => {
      const updated = prevConversations.map((conv) =>
        conv.id === conversationId ? { ...conv, title: newTitle } : conv
      );
      
      // Update Firestore with the updated conversations
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        saveUserConversations(user.uid, updated);
      }
      
      return updated;
    });
    
    // Update currentConversation as well if it's the one being renamed
    if (currentConversation && currentConversation.id === conversationId) {
      setCurrentConversation({
        ...currentConversation,
        title: newTitle
      });
    }
  };
  
  const resetAppState = () => {
    // Reset all state variables
    setInput('');
    setConversations([]);
    setCurrentConversation(null);
    setShowResults(false);
    setLoading(false);
    setShowGenerateButton(false);
    setSelectedGenerateFormat(null);
    setGeneratedContent(null);
    setShowResultPage(false);
    setPresets({});
    setUserLoaded(false);
  
    // Clear local storage
    localStorage.removeItem('currentConversationId');
    localStorage.removeItem('presets');
    localStorage.removeItem('conversations'); // Also clear conversations from localStorage
  };

  // Generate two deep, engaging questions
  const generateDeepQuestions = async (prompt) => {
    const questionsPrompt = `Generate two engaging, thought-provoking questions in simple English based on the following user input:\n\n${prompt}\n\nOutput only the two questions, no extra text.`;
    try {
      const response = await run(questionsPrompt);
      
      const questions = response.split('\n')
        .filter(q => q.trim() !== '')
        .map(q => q.replace(/\*/g, '').replace(/\(.*?\)/g, '').trim());
      
      return questions.slice(0, 2);
    } catch (error) {
      console.error('Error generating deep questions:', error);
      return [
        "What sparked your interest in this topic?",
        "What aspect of this excites you the most?"
      ];
    }
  };

  // Generate content based on selected format
  const generateContent = async (format) => {
    const savedPresets = JSON.parse(localStorage.getItem('presets') || '{}');
    const presetData = savedPresets[format] || {};
    
    let systemPrompt = `Generate a ${format} based on the previous conversation.`;
    systemPrompt += ` Please write in simple English.`;
    
    if (presetData.sampleContent) {
      systemPrompt += `\n\nHere's a sample of my writing style to emulate:\n${presetData.sampleContent}`;
    }
    
    if (presetData.instructions) {
      systemPrompt += `\n\nSpecial instructions:\n${presetData.instructions}`;
    }
    
    if (currentConversation && currentConversation.messages) {
      systemPrompt += "\n\nConversation context:";
      currentConversation.messages.forEach(msg => {
        systemPrompt += `\n${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`;
      });
    }
    
    try {
      const generatedContent = await run(systemPrompt);
      return generatedContent;
    } catch (error) {
      console.error(`Error generating ${format}:`, error);
      return `Sorry, I couldn't generate the ${format} at this moment.`;
    }
  };
  
  // Edit generated content with AI
  const editContentWithAI = async (content, instructions) => {
    const editPrompt = `Please edit the following content according to these instructions: ${instructions}\n\nContent to edit:\n${content}`;
    try {
      const editedContent = await run(editPrompt);
      return editedContent;
    } catch (error) {
      console.error('Error editing content:', error);
      return `Sorry, I couldn't edit the content at this moment.`;
    }
  };

  // Helper function for saving conversations to Firestore
  const saveConversationsToFirestore = async (updatedConversations) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user && userLoaded) {
      setFirestoreSaveInProgress(true);
      try {
        console.log("Saving conversations to Firestore:", updatedConversations);
        await saveUserConversations(user.uid, updatedConversations);
        
        // Backup to localStorage as well
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        console.log("Successfully saved conversations");
      } catch (error) {
        console.error('Error saving conversations to Firestore:', error);
        // Still save to localStorage even if Firestore fails
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      } finally {
        setFirestoreSaveInProgress(false);
      }
    } else {
      // If user is not logged in, only save to localStorage
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }
  };

  // Comprehensive onSent method
  const onSent = async (specificPrompt = null, specificFormat = null) => {
    const promptToUse = specificPrompt || input;
    const formatToUse = specificFormat || selectedGenerateFormat;
  
    setLoading(true);
    setShowResults(true);  

    let updatedConversation = currentConversation ? { ...currentConversation } : null;
  
    if (!updatedConversation) {
      // Start a new conversation
      const title = await generateConversationTitle(promptToUse);
      updatedConversation = {
        id: Date.now().toString(),
        title: title,
        messages: [{ role: 'user', content: promptToUse }]
      };
  
      // Generate AI responses
      const deepQuestions = await generateDeepQuestions(promptToUse);
      
      updatedConversation.messages.push(
        { role: 'ai', content: deepQuestions[0] || "That's an interesting thought!" },
        { role: 'ai', content: deepQuestions[1] || "Let's dive deeper into that." }
      );
  
    } else if (formatToUse) {
      // Generate content based on format
      const content = await generateContent(formatToUse);
      setGeneratedContent(content);
      setShowResultPage(true);
      setSelectedGenerateFormat(null);
      setLoading(false);
      return;
    } else {
      // Continue existing conversation
      updatedConversation.messages.push({ role: 'user', content: promptToUse });
  
      const deepQuestions = await generateDeepQuestions(promptToUse);
      
      updatedConversation.messages.push(
        { role: 'ai', content: deepQuestions[0] || "That's an interesting thought!" },
        { role: 'ai', content: deepQuestions[1] || "Let's dive deeper into that." }
      );
    }
  
    // Update conversation state
    setCurrentConversation(updatedConversation);
    setConversations(prev => {
      const conversationExists = prev.some(conv => conv.id === updatedConversation.id);
      let updatedConversations;
      
      if (conversationExists) {
        updatedConversations = prev.map(conv => 
          conv.id === updatedConversation.id ? updatedConversation : conv
        );
      } else {
        updatedConversations = [...prev, updatedConversation];
      }
      
      // Save to localStorage immediately
      localStorage.setItem('currentConversationId', updatedConversation.id);
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      
      // Save to Firestore asynchronously
      saveConversationsToFirestore(updatedConversations);
      
      return updatedConversations;
    });
  
    setLoading(false);
  };

  // New method to save presets
  const savePresets = useCallback(async (newPresets) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      await saveUserPresets(user.uid, newPresets);
      setPresets(newPresets);
      localStorage.setItem('presets', JSON.stringify(newPresets));
    }
  }, []);

  // New Chat method with reset
  const newChat = () => {
    setCurrentConversation(null);
    setShowResults(false);
    setInput('');
    setShowGenerateButton(false);
    setGeneratedContent(null);
    setShowResultPage(false);
    // Remove current conversation ID from localStorage
    localStorage.removeItem('currentConversationId');
  };

  // Effect to load user data on authentication
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          console.log("Loading user data for:", user.uid);
          
          // Load conversations from Firestore
          let loadedConversations = await getUserConversations(user.uid);
          console.log("Loaded conversations from Firestore:", loadedConversations);
          
          // If no conversations in Firestore, try localStorage as fallback
          if (!loadedConversations || loadedConversations.length === 0) {
            const localConversations = localStorage.getItem('conversations');
            if (localConversations) {
              loadedConversations = JSON.parse(localConversations);
              console.log("Loaded conversations from localStorage:", loadedConversations);
              
              // Save localStorage conversations to Firestore for future use
              if (loadedConversations.length > 0) {
                saveUserConversations(user.uid, loadedConversations);
              }
            }
          } else {
            // If we loaded from Firestore, update localStorage as well
            localStorage.setItem('conversations', JSON.stringify(loadedConversations));
          }
          
          // Set the loaded conversations in state
          if (loadedConversations && loadedConversations.length > 0) {
            setConversations(loadedConversations);
          }

          // Check if there was a current conversation from localStorage
          const currentConvId = localStorage.getItem('currentConversationId');
          if (currentConvId && loadedConversations && loadedConversations.length > 0) {
            const currentConv = loadedConversations.find(c => c.id === currentConvId);
            if (currentConv) {
              console.log("Setting current conversation from localStorage:", currentConv);
              setCurrentConversation(currentConv);
              setShowResults(true);
            }
          }

          // Load presets
          const loadedPresets = await getUserPresets(user.uid);
          setPresets(loadedPresets || {});
          localStorage.setItem('presets', JSON.stringify(loadedPresets || {}));
          
          // Mark user data as loaded
          setUserLoaded(true);
        } catch (error) {
          console.error("Error loading user data:", error);
          
          // Try loading from localStorage as fallback on error
          try {
            const localConversations = localStorage.getItem('conversations');
            if (localConversations) {
              const parsedConversations = JSON.parse(localConversations);
              setConversations(parsedConversations);
              
              // Set current conversation if available
              const currentConvId = localStorage.getItem('currentConversationId');
              if (currentConvId) {
                const currentConv = parsedConversations.find(c => c.id === currentConvId);
                if (currentConv) {
                  setCurrentConversation(currentConv);
                  setShowResults(true);
                }
              }
            }
          } catch (localError) {
            console.error("Error loading from localStorage:", localError);
          }
          
          setUserLoaded(true); // Still mark as loaded even on error
        }
      } else {
        // Reset state if user is not logged in
        resetAppState();
      }
    });

    return () => unsubscribe();
  }, []);

  // Effect to save conversations when they change
  useEffect(() => {
    // Skip if a Firestore save is already in progress to prevent race conditions
    if (firestoreSaveInProgress) {
      return;
    }
    
    const auth = getAuth();
    const user = auth.currentUser;
    
    // Only save if user is loaded and logged in and conversations have changed
    if (user && userLoaded && conversations.length > 0) {
      console.log("Saving conversations (from useEffect):", conversations);
      
      // Debounce the Firestore save to prevent too many writes
      const saveTimer = setTimeout(() => {
        saveConversationsToFirestore(conversations);
      }, 1000); // Wait 1 second before saving to Firestore
      
      // Always save to localStorage immediately
      localStorage.setItem('conversations', JSON.stringify(conversations));
      
      // Update localStorage with current conversation ID if it exists
      if (currentConversation) {
        localStorage.setItem('currentConversationId', currentConversation.id);
      }
      
      // Clear timeout on cleanup
      return () => clearTimeout(saveTimer);
    }
  }, [conversations, currentConversation, userLoaded, firestoreSaveInProgress]);

  const contextValue = {
    input,
    setInput,
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    showResults,
    setShowResults,
    loading,
    setLoading,
    onSent,
    newChat,
    showGenerateButton,
    selectedGenerateFormat,
    setSelectedGenerateFormat,
    generatedContent,
    setGeneratedContent,
    showResultPage,
    setShowResultPage,
    editContentWithAI,
    presets,
    setPresets,
    savePresets,
    sidebarCollapsed,
    setSidebarCollapsed,
    logout,
    deleteConversation,
    updateConversationTitle,
    resetAppState
  };

  return (
    <Context.Provider value={contextValue}>
      {props.children}
    </Context.Provider>
  );
};

export default ContextProvider;