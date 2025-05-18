import { useState, useContext, useEffect } from "react";
import { Context } from "../../context/ContextFile";
import { assets } from "../../Assets/assets";
import { getAuth } from "firebase/auth";
import { saveUserPresets, getUserPresets } from "../../config/firestoreService";
import "./Preset.css";

const Preset = ({ onBackToMainbar }) => {
  const { presets, savePresets } = useContext(Context);
  const { setSelectedGenerateFormat } = useContext(Context);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showSampleBox, setShowSampleBox] = useState(false);
  const [sampleContent, setSampleContent] = useState("");
  const [instructions, setInstructions] = useState("");
  const [savedPresets, setSavedPresets] = useState({});

  // Load saved presets on component mount
  useEffect(() => {
    const loadPresets = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        try {
          // First, try to get presets from Firestore
          const firestorePresets = await getUserPresets(user.uid);
          
          // If Firestore presets exist, use them
          if (Object.keys(firestorePresets).length > 0) {
            setSavedPresets(firestorePresets);
            localStorage.setItem('presets', JSON.stringify(firestorePresets));
          } else {
            // If no Firestore presets, check localStorage
            const localPresets = localStorage.getItem('presets');
            if (localPresets) {
              const parsedLocalPresets = JSON.parse(localPresets);
              setSavedPresets(parsedLocalPresets);
              
              // Save local presets to Firestore as a backup
              await saveUserPresets(user.uid, parsedLocalPresets);
            }
          }
        } catch (error) {
          console.error("Error loading presets:", error);
          
          // Fallback to localStorage if Firestore fails
          const localPresets = localStorage.getItem('presets');
          if (localPresets) {
            setSavedPresets(JSON.parse(localPresets));
          }
        }
      }
    };
    loadPresets();
  }, []);

  const formats = [
    'YouTube Script', 
    'Tweet', 
    'LinkedIn Post', 
    'Essay', 
    'Letter', 
    'To-Do List'
  ];

  const handleFormatClick = (format) => {
    setSelectedFormat(format);
    setShowSampleBox(true);
    
    // Populate existing preset if it exists
    const existingPreset = savedPresets[format] || {};
    setSampleContent(existingPreset.sampleContent || "");
    setInstructions(existingPreset.instructions || "");
  };

  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert("Please log in to save presets");
      return;
    }

    // Save preset data
    const presetData = {
      format: selectedFormat,
      sampleContent,
      instructions
    };
    
    // Update local state
    const updatedPresets = {
      ...savedPresets,
      [selectedFormat]: presetData
    };
    setSavedPresets(updatedPresets);
    
    // Save to Firestore
    try {
      await saveUserPresets(user.uid, updatedPresets);
      
      // Update localStorage 
      localStorage.setItem('presets', JSON.stringify(updatedPresets));
      
      // Set current format in context
      setSelectedGenerateFormat(selectedFormat);
      
      // Close the sample box and return to format selection
      setShowSampleBox(false);
    } catch (error) {
      console.error("Error saving presets:", error);
      alert("Failed to save presets. Please try again.");
    }
  };

  const handleBack = () => {
    if (showSampleBox) {
      // If in sample box view, go back to format selection
      setShowSampleBox(false);
    } else {
      // If in format selection view, go back to main page
      onBackToMainbar();
    }
  };

  return (
    <div className="preset-container">
      <div className="preset-header">
        <button className="back-button" onClick={handleBack}>
          <img src={assets.back_icon || "back-icon.png"} alt="Back" />
        </button>
        <h1>Preset Settings</h1>
      </div>
      
      <div className="preset-content">
        {!showSampleBox ? (
          <div className="format-selection">
            <h2>Select Content Format</h2>
            <div className="format-grid">
              {formats.map((format, index) => (
                <div 
                  key={index} 
                  className="format-option"
                  onClick={() => handleFormatClick(format)}
                >
                  {format}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="sample-box">
            <h2>{selectedFormat} Settings</h2>
            
            <div className="sample-section">
              <h3>Add Sample Content</h3>
              <p className="section-description">
                Paste your existing work, and the AI will automatically detect your tone, structure, and style.
              </p>
              <textarea 
                value={sampleContent}
                onChange={(e) => setSampleContent(e.target.value)}
                placeholder="Paste your sample content here..."
              />
            </div>
            
            <div className="instructions-section">
              <h3>Instructions</h3>
              <p className="section-description">
                Describe exactly how you want the text to sound and specify any special requirements.
              </p>
              <textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter your instructions here..."
              />
            </div>
            
            <button className="okay-button" onClick={handleSave}>
              Okay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preset;