import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import GamePage from './pages/GamePage';
import GameOverPage from './pages/GameOverPage';

function App() {
  const { user, loading } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      // Socket event listeners can be added here
    }
  }, [socket]);

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/lobby" /> : <LoginPage />} />
            <Route path="/register" element={user ? <Navigate to="/lobby" /> : <RegisterPage />} />
            <Route path="/lobby" element={user ? <LobbyPage /> : <Navigate to="/" />} />
            <Route path="/room/:roomId" element={user ? <RoomPage /> : <Navigate to="/" />} />
            <Route path="/game/:roomId" element={user ? <GamePage /> : <Navigate to="/" />} />
            <Route path="/game-over" element={user ? <GameOverPage /> : <Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
```

```