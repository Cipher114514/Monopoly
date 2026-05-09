import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  const { isAuthenticated, user } = useAuth();
  const socket = useSocket();

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && <Header />}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/lobby" replace />} />
            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/lobby" replace />} />
            <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/lobby" replace />} />
            <Route path="/lobby" element={isAuthenticated ? <LobbyPage /> : <Navigate to="/login" replace />} />
            <Route path="/room/:roomId" element={isAuthenticated ? <RoomPage /> : <Navigate to="/login" replace />} />
            <Route path="/game/:roomId" element={isAuthenticated ? <GamePage /> : <Navigate to="/login" replace />} />
            <Route path="/game-over/:roomId" element={isAuthenticated ? <GameOverPage /> : <Navigate to="/login" replace />} />
          </Routes>
        </main>
        {isAuthenticated && <Footer />}
      </div>
    </Router>
  );
}

export default App;
```

```