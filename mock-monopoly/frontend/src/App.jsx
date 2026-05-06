import React, { useState } from 'react';
import HomePage from './components/HomePage';
import RoomListPage from './components/RoomListPage';
import RoomPage from './components/RoomPage';
import GamePage from './components/GamePage';
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('rooms');
  };
  const renderPage = () => {
    switch(currentPage) {
      case 'home': return <HomePage onLogin={handleLogin} />;
      case 'rooms': return <RoomListPage user={user} />;
      case 'room': return <RoomPage user={user} />;
      case 'game': return <GamePage user={user} />;
      default: return <HomePage onLogin={handleLogin} />;
    }
  };
  return (
    <div className="app">
      {renderPage()}
    </div>
  );
}
export default App;