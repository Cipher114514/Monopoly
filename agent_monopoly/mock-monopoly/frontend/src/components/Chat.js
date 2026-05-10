import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import useSocket from '../hooks/useSocket';

const Chat = () => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef(null);

  // 获取当前用户名
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUsername(user.username);
    }
  }, []);

  // 设置Socket连接
  const { socket, connected } = useSocket(username);

  // 监听聊天消息
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };

    socket.on('chat_message', handleChatMessage);

    return () => {
      socket.off('chat_message', handleChatMessage);
    };
  }, [socket]);

  // 发送消息
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      roomId: parseInt(roomId),
      username,
      message: newMessage,
      timestamp: Date.now()
    };

    socket.emit('chat_message', messageData);
    setNewMessage('');
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>聊天室</h3>
        <span className={connected ? 'status-online' : 'status-offline'}>
          {connected ? '已连接' : '连接中...'}
        </span>
      </div>
      
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.username === username ? 'own-message' : ''}`}
          >
            <div className="message-username">{msg.username}</div>
            <div className="message-text">{msg.message}</div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input-container">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          rows={2}
        />
        <button onClick={sendMessage} disabled={!connected}>
          发送
        </button>
      </div>

      <style jsx>{`
        .chat-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
          border-radius: 8px;
          overflow: hidden;
        }

        .chat-header {
          padding: 12px 16px;
          background: #343a40;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .status-online {
          color: #28a745;
          font-size: 12px;
        }

        .status-offline {
          color: #dc3545;
          font-size: 12px;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .message {
          max-width: 80%;
          padding: 8px 12px;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .message.own-message {
          align-self: flex-end;
          background: #007bff;
          color: white;
        }

        .message-username {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 4px;
          opacity: 0.8;
        }

        .message-text {
          font-size: 14px;
          line-height: 1.4;
        }

        .message-time {
          font-size: 10px;
          opacity: 0.6;
          margin-top: 4px;
          text-align: right;
        }

        .message-input-container {
          padding: 16px;
          border-top: 1px solid #dee2e6;
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .message-input-container textarea {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          resize: none;
          font-size: 14px;
        }

        .message-input-container button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .message-input-container button:hover:not(:disabled) {
          background: #0056b3;
        }

        .message-input-container button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Chat;