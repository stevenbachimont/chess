import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RulesPage.scss';

const RulesPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="rules-container">
            <header>
                <button className="back-button" onClick={() => navigate('/')}>
                    ← Retour
                </button>
                <h1>Règles des Échecs</h1>
            </header>

            <div className="rules-content">
                <section className="rule-section">
                    <h2>Objectif du Jeu</h2>
                    <p>Le but du jeu d'échecs est de mettre le roi adverse "échec et mat". Cela signifie que le roi est attaqué (en échec) et qu'il n'a aucun moyen légal d'échapper à la capture.</p>
                </section>

                <section className="rule-section">
                    <h2>Déplacement des Pièces</h2>
                    
                    <div className="piece-rule">
                        <h3>Le Pion ♟</h3>
                        <ul>
                            <li>Avance d'une case à la fois vers l'avant</li>
                            <li>Peut avancer de deux cases lors de son premier déplacement</li>
                            <li>Capture en diagonale</li>
                            <li>Peut effectuer la prise "en passant"</li>
                            <li>Se transforme en une autre pièce (sauf roi) en atteignant la dernière rangée</li>
                        </ul>
                    </div>

                    <div className="piece-rule">
                        <h3>La Tour ♜</h3>
                        <ul>
                            <li>Se déplace horizontalement et verticalement</li>
                            <li>Peut parcourir plusieurs cases en ligne droite</li>
                            <li>Participe au roque avec le roi</li>
                        </ul>
                    </div>

                    <div className="piece-rule">
                        <h3>Le Cavalier ♞</h3>
                        <ul>
                            <li>Se déplace en "L" : deux cases dans une direction puis une case perpendiculairement</li>
                            <li>Seule pièce pouvant sauter par-dessus les autres</li>
                        </ul>
                    </div>

                    <div className="piece-rule">
                        <h3>Le Fou ♝</h3>
                        <ul>
                            <li>Se déplace en diagonale uniquement</li>
                            <li>Reste toujours sur les cases de sa couleur initiale</li>
                        </ul>
                    </div>

                    <div className="piece-rule">
                        <h3>La Dame ♛</h3>
                        <ul>
                            <li>Combine les mouvements de la tour et du fou</li>
                            <li>Peut se déplacer dans toutes les directions</li>
                            <li>Pièce la plus puissante du jeu</li>
                        </ul>
                    </div>

                    <div className="piece-rule">
                        <h3>Le Roi ♚</h3>
                        <ul>
                            <li>Se déplace d'une seule case dans toutes les directions</li>
                            <li>Ne peut pas se mettre en échec</li>
                            <li>Peut effectuer le roque avec une tour</li>
                        </ul>
                    </div>
                </section>

                <section className="rule-section">
                    <h2>Règles Spéciales</h2>
                    
                    <div className="special-rule">
                        <h3>Le Roque</h3>
                        <p>Mouvement spécial impliquant le roi et une tour, permettant de mettre le roi en sécurité et d'activer la tour. Conditions :</p>
                        <ul>
                            <li>Ni le roi ni la tour n'ont bougé</li>
                            <li>Pas de pièces entre le roi et la tour</li>
                            <li>Le roi n'est pas en échec</li>
                            <li>Le roi ne traverse pas une case menacée</li>
                        </ul>
                    </div>

                    <div className="special-rule">
                        <h3>La Prise en Passant</h3>
                        <p>Un pion peut capturer un pion adverse qui vient d'avancer de deux cases comme s'il n'avait avancé que d'une case.</p>
                    </div>

                    <div className="special-rule">
                        <h3>La Promotion</h3>
                        <p>Un pion atteignant la dernière rangée doit être promu en dame, tour, fou ou cavalier.</p>
                    </div>
                </section>

                <section className="rule-section">
                    <h2>Fin de Partie</h2>
                    <ul>
                        <li><strong>Échec et Mat :</strong> Le roi est attaqué et ne peut pas échapper</li>
                        <li><strong>Pat :</strong> Le joueur n'a aucun coup légal mais n'est pas en échec (partie nulle)</li>
                        <li><strong>Match Nul :</strong> Par accord mutuel, répétition triple, règle des 50 coups, ou matériel insuffisant</li>
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default RulesPage; 