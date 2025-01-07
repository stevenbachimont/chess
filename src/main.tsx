import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ChessBoard from './components/ChessBoard';
import RulesPage from './components/RulesPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/play" element={<ChessBoard />} />
                <Route path="/rules" element={<RulesPage />} />
            </Routes>
        </Router>
    </React.StrictMode>
);
