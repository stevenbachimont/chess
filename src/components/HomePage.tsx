import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.scss';

const HomePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="menu">
                <h1>CHESS BURGER</h1>
                <div className="menu-buttons">
                    <button className="menu-button play" onClick={() => navigate('/play')}>
                        Jouer
                    </button>
                    <button className="menu-button rules" onClick={() => navigate('/rules')}>
                        Règles
                    </button>
                    <button className="menu-button settings" onClick={() => navigate('/settings')}>
                        Paramètres
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomePage; 