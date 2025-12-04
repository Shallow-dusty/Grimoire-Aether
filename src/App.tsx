import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import GrimoirePage from './pages/GrimoirePage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/game/:sessionId" element={<GrimoirePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
