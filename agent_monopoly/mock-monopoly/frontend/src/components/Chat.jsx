import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../api/client';

const Chat = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { socket, connected, emit, on } = useSocket(user);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 获取聊天历史
    const fetchChatHistory = async () => {
      try {
        const response = await api.get(`/rooms/${roomId}/messages`);
        if (response.code === 200) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error('获取聊天历史失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();

    // 监听新消息
    if (socket && connected) {
      on('new_message', (data) => {
        setMessages(prev => [...prev, data]);
      });

      on('system_message', (data) => {
        setMessages(prev => [...prev, data]);
      });
    }

    // 清理事件监听
    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('system_message');
      }
    };
  }, [roomId, socket, connected, on]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !connected) return;

    emit('send_message', {
      roomId,
      message: newMessage,
      userId: user.userId,
      username: user.username
    });

    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="chat-container loading">
        <div className="chat-messages">
          <div className="loading-message">加载聊天中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>聊天室</h3>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">暂无消息</div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.userId === user.userId ? 'own' : 'other'}`}
            >
              {msg.userId === 'system' ? (
                <div className="system-message">
                  <span className="system-text">{msg.message}</span>
                </div>
              ) : (
                <>
                  <div className="message-header">
                    <span className="username">{msg.username}</span>
                    <span className="time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="message-content">
                    {msg.message}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="chat-input">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          rows={2}
        />
        <button 
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !connected}
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default Chat;