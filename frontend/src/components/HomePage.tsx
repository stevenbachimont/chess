import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.scss';
import chessburger from '../assets/chessburger.png';
import openchessburger from '../assets/openchessburger.png';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleMouseEnter = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setIsHovered(true);
            setIsTransitioning(false);
        }, 150);
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (relatedTarget?.classList.contains('play-button')) {
            return;
        }
        
        setIsTransitioning(true);
        setTimeout(() => {
            setIsHovered(false);
            setIsTransitioning(false);
        }, 150);
    };

    return (
        <div className="home-container">
            <h1>CHESSBURGER</h1>
            <div 
                className="content-wrapper"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="buttons-container">
                    <button 
                        className={`play-button ${isHovered ? 'visible' : ''}`}
                        onClick={() => navigate('/play')}
                    >
                        Jouer aux échecs
                    </button>
                    <button 
                        className={`rules-button ${isHovered ? 'visible' : ''}`}
                        onClick={() => navigate('/rules')}
                    >
                        Règles du jeu
                    </button>
                    <button 
                        className={`comptoir-button ${isHovered ? 'visible' : ''}`}
                        onClick={() => navigate('/comptoir')}
                    >
                        Le Comptoir
                    </button>
                </div>
                <img 
                    src={isHovered ? openchessburger : chessburger} 
                    alt="Chess Burger Logo" 
                    className={`chess-burger-logo ${isTransitioning ? 'transitioning' : ''}`}
                />
            </div>
        </div>
    );
};

export default HomePage; 