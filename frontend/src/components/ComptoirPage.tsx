import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ComptoirPage.scss';

const ComptoirPage: React.FC = () => {
    const navigate = useNavigate();
    const [gameOptions, setGameOptions] = useState({
        timeControl: '5',  // en minutes
        mode: 'normal',    // 'normal' ou 'assisted'
        theme: 'classic'   // 'classic' ou 'modern'
    });

    const handleOptionChange = (option: string, value: string) => {
        setGameOptions(prev => ({
            ...prev,
            [option]: value
        }));
    };

    const startGame = () => {
        const options = {
            timeControl: parseInt(gameOptions.timeControl) * 60, // Convertir en secondes
            mode: gameOptions.mode,
            theme: gameOptions.theme
        };
        
        // Encoder les options dans l'URL
        const searchParams = new URLSearchParams();
        Object.entries(options).forEach(([key, value]) => {
            searchParams.append(key, value.toString());
        });
        
        navigate(`/play?${searchParams.toString()}`);
    };

    return (
        <div className="comptoir-container">
            <header>
                <button className="back-button" onClick={() => navigate('/')}>
                    Retour au menu
                </button>
                <h1>Le Comptoir</h1>
            </header>
            
            <div className="options-container">
                <div className="option-group">
                    <h2>Minuteur</h2>
                    <div className="options-grid">
                        {['1', '3', '5', '10', '15', '30'].map(time => (
                            <button
                                key={time}
                                className={`option-button ${gameOptions.timeControl === time ? 'selected' : ''}`}
                                onClick={() => handleOptionChange('timeControl', time)}
                            >
                                {time} min
                            </button>
                        ))}
                    </div>
                </div>

                <div className="option-group">
                    <h2>Mode de jeu</h2>
                    <div className="options-grid">
                        <button
                            className={`option-button ${gameOptions.mode === 'normal' ? 'selected' : ''}`}
                            onClick={() => handleOptionChange('mode', 'normal')}
                        >
                            Normal
                        </button>
                        <button
                            className={`option-button ${gameOptions.mode === 'assisted' ? 'selected' : ''}`}
                            onClick={() => handleOptionChange('mode', 'assisted')}
                        >
                            Assisté
                        </button>
                    </div>
                </div>

                <div className="option-group">
                    <h2>Thème du plateau</h2>
                    <div className="options-grid">
                        <button
                            className={`option-button ${gameOptions.theme === 'classic' ? 'selected' : ''}`}
                            onClick={() => handleOptionChange('theme', 'classic')}
                        >
                            Classique
                        </button>
                        <button
                            className={`option-button ${gameOptions.theme === 'modern' ? 'selected' : ''}`}
                            onClick={() => handleOptionChange('theme', 'modern')}
                        >
                            Moderne
                        </button>
                    </div>
                </div>

                <button className="start-game-button" onClick={startGame}>
                    Commencer la partie
                </button>
            </div>
        </div>
    );
};

export default ComptoirPage; 