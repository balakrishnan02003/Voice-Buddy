import { useState, useContext } from "react";
import { Context } from "../../context/ContextFile";
import { assets } from "../../Assets/assets";
import "./Result.css";

const Result = () => {
  const { 
    generatedContent, 
    setShowResultPage, 
    newChat, 
    setGeneratedContent,
    editContentWithAI,
    setShowResults,
    currentConversation,
    sidebarCollapsed
  } = useContext(Context);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInstructions, setEditInstructions] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle back button click
  const handleBack = () => {
    setShowResultPage(false);
    
    // Ensure conversations are shown when returning
    if (currentConversation) {
      setShowResults(true);
    }
  };
  
  // Handle new chat button click
  const handleNewChat = () => {
    newChat();
  };
  
  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    
    // Optional: Add a visual feedback for copy action
    const copyButton = document.querySelector('.action-button:nth-child(1)');
    if (copyButton) {
      const originalText = copyButton.querySelector('span').textContent;
      copyButton.querySelector('span').textContent = 'Copied!';
      setTimeout(() => {
        copyButton.querySelector('span').textContent = originalText;
      }, 2000);
    }
  };
  
  // Handle download as text file
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "voicebuddy-content.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Handle edit with AI click
  const handleEditClick = () => {
    setShowEditModal(true);
  };
  
  // Handle edit modal close
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditInstructions("");
  };
  
  // Handle edit submit
  const handleSubmitEdit = async () => {
    if (!editInstructions.trim()) return;
    
    setIsEditing(true);
    try {
      const editedContent = await editContentWithAI(generatedContent, editInstructions);
      setGeneratedContent(editedContent);
    } catch (error) {
      console.error("Error editing content:", error);
    } finally {
      setIsEditing(false);
      setShowEditModal(false);
      setEditInstructions("");
    }
  };

  return (
    <div className={`result-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    {
    <div className="result-container">
      <div className="result-header">
        <button className="back-button" onClick={handleBack}>
          <img src={assets.back_icon || "back-icon.png"} alt="Back" />
        </button>
        <h1>Generated Content</h1>
        <button className="back-to-chat-button" onClick={handleBack}>
          Back to Chat
        </button>
      </div>
      
      <div className="result-content">
        <div className="content-display">
          {generatedContent}
        </div>
        
        <div className="action-buttons">
          <button className="action-button" onClick={handleCopy}>
            <img src={assets.copy_icon || "copy-icon.png"} alt="Copy" />
            <span>Copy</span>
          </button>
          <button className="action-button" onClick={handleDownload}>
            <img src={assets.download_icon || "download-icon.png"} alt="Download" />
            <span>Download</span>
          </button>
          <button className="action-button" onClick={handleEditClick}>
            <img src={assets.edit_icon || "edit-icon.png"} alt="Edit with AI" />
            <span>Edit with AI</span>
          </button>
        </div>
      </div>
      
      {/* Edit with AI Modal */}
      {showEditModal && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <h2>Edit with AI</h2>
            <p>Tell me how you want me to edit this content:</p>
            <textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              placeholder="E.g., Make it more professional, add more examples, shorten it, etc."
              disabled={isEditing}
            />
            <div className="modal-buttons">
              <button className="cancel-button" onClick={handleCloseEditModal} disabled={isEditing}>
                Cancel
              </button>
              <button 
                className="submit-button" 
                onClick={handleSubmitEdit}
                disabled={isEditing || !editInstructions.trim()}
              >
                {isEditing ? "Editing..." : "Edit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
}
</div>
  );
};

export default Result;