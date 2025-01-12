import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.scss';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [adminCode, setAdminCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        
        try {
            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    isLogin 
                        ? { username, password }
                        : { username, password, email, adminCode }
                ),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', username);
                navigate('/game');
            } else {
                setError(data.message || 'Une erreur est survenue');
            }
        } catch (error) {
            console.error('Auth error:', error);
            setError('Erreur de connexion au serveur');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Nom d'utilisateur"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={3}
                        autoComplete="username"
                    />
                    {!isLogin && (
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    )}
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                    />
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Code Admin (optionnel)"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                        />
                    )}
                    <button type="submit">
                        {isLogin ? 'Se connecter' : "S'inscrire"}
                    </button>
                </form>
                <button 
                    className="switch-mode"
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError(null);
                    }}
                >
                    {isLogin ? "Créer un compte" : "Déjà inscrit ?"}
                </button>
                <button 
                    className="back-button"
                    onClick={() => navigate('/')}
                >
                    Retour au menu
                </button>
            </div>
        </div>
    );
};

export default AuthPage; 