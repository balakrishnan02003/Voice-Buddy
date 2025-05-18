import "./Sidebar.css";
import { assets } from "../../../Assets/assets";
import { useContext, useEffect, useState } from "react";
import { Context } from "../../../context/ContextFile";

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation, 
    newChat,
    updateConversationTitle,
    deleteConversation: contextDeleteConversation
  } = useContext(Context);

  const [activeOptionsId, setActiveOptionsId] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renamedTitle, setRenamedTitle] = useState('');
  const [hoveredChatId, setHoveredChatId] = useState(null);

  // Debug: Log conversations on component mount and updates
  useEffect(() => {
    console.log("Conversations:", conversations);
    console.log("Current conversation:", currentConversation);
  }, [conversations, currentConversation]);

  const selectConversation = (conversation) => {
    console.log("Selecting conversation:", conversation);
    setCurrentConversation(conversation);
    setActiveOptionsId(null);
    setRenameId(null);
  };

  const toggleOptions = (e, id) => {
    e.stopPropagation();
    setActiveOptionsId(activeOptionsId === id ? null : id);
    setRenameId(null);
  };

  const startRename = (e, conversation) => {
    e.stopPropagation();
    setRenameId(conversation.id);
    setRenamedTitle(conversation.title);
    setActiveOptionsId(null);
  };

  const saveRename = () => {
    if (!renamedTitle.trim()) {
      setRenamedTitle("New Chat");
    }
    
    // Use the context method to update the conversation title
    if (updateConversationTitle) {
      updateConversationTitle(renameId, renamedTitle.trim() || "New Chat");
    }
    setRenameId(null);
  };

  const deleteConversation = (e, id) => {
    e.stopPropagation();
    
    // Use the context method to delete the conversation
    if (contextDeleteConversation) {
      contextDeleteConversation(id);
    }
    // If the deleted conversation was the current one, create a new chat
    if (currentConversation?.id === id) {
      newChat();
    }
    setActiveOptionsId(null);
  };

  // Truncate title to first 3 words
  const truncateTitle = (title) => {
    if (!title) return "New Chat";
    
    const words = title.split(' ');
    if (words.length <= 3) return title;
    
    return words.slice(0, 3).join(' ') + '...';
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ minWidth: isCollapsed ? '60px' : '250px' }}>
      <div className="top">
        <div className="sidebar-header">
          <img
            src={assets.menu_icon}
            className="menu"
            alt="menu-icon"
            onClick={toggleSidebar}
          />
          {!isCollapsed && <h2>VoiceBuddy</h2>}
        </div>
        
        <div className="new-chat" onClick={newChat}>
          <div className="new-chat-icon">
            <img src={assets.plus_icon} alt="New chat" />
          </div>
          {!isCollapsed && <p>New Chat</p>}
        </div>
        
        {!isCollapsed && (
          <div className="recent">
            <p className="recent-title">Recent Chats</p>
            <div className="recent-list">
              {conversations.slice().reverse().map((conversation) => {
                // Debug: Log each conversation being rendered
                console.log("Rendering conversation:", conversation.id, conversation.title);
                
                return (
                  <div 
                    key={conversation.id}
                    className={`recent-entry-container ${currentConversation?.id === conversation.id ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredChatId(conversation.id)}
                    onMouseLeave={() => setHoveredChatId(null)}
                  >
                    <div 
                      onClick={() => selectConversation(conversation)}
                      className="recent-entry"
                    >
                      <div className="recent-entry-icon">
                        <img src={assets.message_icon} alt="" />
                      </div>
                      
                      <div className="recent-entry-content">
                        {renameId === conversation.id ? (
                          <input 
                            type="text" 
                            value={renamedTitle}
                            onChange={(e) => setRenamedTitle(e.target.value)}
                            onBlur={saveRename}
                            onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                            autoFocus
                            className="rename-input"
                          />
                        ) : (
                          <p 
                            className="chat-title" 
                            style={{
                              color: '#ffffff', 
                              fontWeight: 'normal',
                              display: 'block',
                              margin: 0,
                              padding: 0,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              overflow: 'visible'
                            }}
                          >
                            {conversation.title || "New Chat"}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {(hoveredChatId === conversation.id || activeOptionsId === conversation.id) && (
                      <div 
                        className="options-icon" 
                        onClick={(e) => toggleOptions(e, conversation.id)}
                      >
                        <img src={assets.options_icon} alt="Options" />
                      </div>
                    )}
                    
                    {activeOptionsId === conversation.id && (
                      <div className="dropdown-menu">
                        <button onClick={(e) => startRename(e, conversation)}>
                          <img src={assets.edit_icon} alt="Rename" className="dropdown-icon" />
                          Rename
                        </button>
                        <button onClick={(e) => deleteConversation(e, conversation.id)}>
                          <img src={assets.delete_icon} alt="Delete" className="dropdown-icon" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;