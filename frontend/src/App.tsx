import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import ChessBoard from './components/ChessBoard';
import HomePage from './components/HomePage';
import RulesPage from './components/RulesPage';
import ComptoirPage from './components/ComptoirPage';
import PrivateRoute from './components/PrivateRoute';
import AdminPanel from './components/AdminPanel';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/game" element={<PrivateRoute><ChessBoard /></PrivateRoute>} />
                <Route path="/play" element={<ComptoirPage />} />
                <Route path="/rules" element={<RulesPage />} />
                <Route path="/comptoir" element={<ComptoirPage />} />
                <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
