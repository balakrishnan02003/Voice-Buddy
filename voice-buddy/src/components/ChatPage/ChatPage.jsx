import React, { useState } from 'react'
import Sidebar from './Sidebar/Sidebar'
import Mainbar from './Mainbar/Mainbar'
import './ChatPage.css';

const ChatPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  return (
    <div className="chat-page">
      <Sidebar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <Mainbar sidebarCollapsed={sidebarCollapsed} />
    </div>
  )
}

export default ChatPage