import React, { useState } from 'react';
import { GameState, Position, PIECE_SYMBOLS, PieceColor } from '../types/chess';
import './ChessBoard.scss';
import { initializeBoard, getPossibleMoves, isKingInCheck, getCheckPath } from '../utils/board';
import openingsData from '../data/openings.json';

const PIECE_NAMES_FR = {
    'pawn': 'Pion',
    'rook': 'Tour',
    'knight': 'Cavalier',
    'bishop': 'Fou',
    'queen': 'Reine',
    'king': 'Roi'
} as const;

type OpeningKey = keyof typeof openingsData;

const ChessBoard: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>({
        board: initializeBoard(),
        currentTurn: 'white',
        gameStatus: 'active',
        hasMoved: {
            whiteKing: false,
            blackKing: false,
            whiteRookLeft: false,
            whiteRookRight: false,
            blackRookLeft: false,
            blackRookRight: false,
        }
    });
    const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
    const [easyMode, setEasyMode] = useState(false);
    const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [checkingPiece, setCheckingPiece] = useState<Position | null>(null);
    const [checkPath, setCheckPath] = useState<Position[]>([]);
    const [moveHistory, setMoveHistory] = useState<{
        board: GameState['board'], 
        turn: PieceColor,
        hasMoved: GameState['hasMoved']
    }[]>([]);
    const [moves, setMoves] = useState<string[]>([]);
    const canUndo = moveHistory.length > 0;
    const [selectedOpening, setSelectedOpening] = useState<OpeningKey | ''>('');
    const [guideStep, setGuideStep] = useState<number>(-1);

    const OPENINGS_GUIDE = openingsData;

    // Fonction utilitaire pour convertir les coordonnées (à ajouter en haut du composant)
    const convertCoordinates = (x: number, y: number) => {
        // Convertir les coordonnées x,y en notation échecs (e2, e4, etc.)
        const file = String.fromCharCode('a'.charCodeAt(0) + (7 - x)); // Inverser x
        const rank = 8 - y;
        return `${file}${rank}`;
    };

    const canCastle = (kingPos: Position, rookPos: Position): boolean => {
        const king = gameState.board[kingPos.y][kingPos.x];
        const rook = gameState.board[rookPos.y][rookPos.x];
        
        // Pour un plateau tourné de 90 degrés
        if (kingPos.x !== 3 || (rookPos.x !== 0 && rookPos.x !== 7)) return false;
        if (!king || !rook || king.type !== 'king' || rook.type !== 'rook') return false;
        
        // Vérifier si le roi ou la tour ont déjà bougé
        const color = king.color;
        const isKingSide = rookPos.x === 7;
        if (color === 'white') {
            if (gameState.hasMoved?.whiteKing) return false;
            if (isKingSide && gameState.hasMoved?.whiteRookRight) return false;
            if (!isKingSide && gameState.hasMoved?.whiteRookLeft) return false;
        } else {
            if (gameState.hasMoved?.blackKing) return false;
            if (isKingSide && gameState.hasMoved?.blackRookRight) return false;
            if (!isKingSide && gameState.hasMoved?.blackRookLeft) return false;
        }

        // Vérifier si le chemin est libre entre le roi et la tour
        const direction = rookPos.x > kingPos.x ? 1 : -1;
        for (let x = kingPos.x + direction; x !== rookPos.x; x += direction) {
            if (gameState.board[kingPos.y][x] !== null) return false;
        }

        return !isKingInCheck(gameState.board, color);
    };

    const handleSquareClick = (position: Position) => {
        if (selectedPiece === null) {
            const piece = gameState.board[position.y][position.x];
            if (piece && piece.color === gameState.currentTurn) {
                setSelectedPiece(position);
                let moves = getPossibleMoves(gameState.board, position);

                // Si c'est un roi sur sa case initiale, ajouter les mouvements de roque possibles
                if (piece.type === 'king' && position.x === 3) {
                    const y = piece.color === 'white' ? 7 : 0;
                    if (canCastle({ x: 3, y }, { x: 7, y })) {
                        moves.push({ x: 5, y }); // Petit roque
                    }
                    if (canCastle({ x: 3, y }, { x: 0, y })) {
                        moves.push({ x: 1, y }); // Grand roque
                    }
                }

                setPossibleMoves(moves);
                setErrorMessage(null);
            }
        } else {
            if (selectedPiece.x === position.x && selectedPiece.y === position.y) {
                setSelectedPiece(null);
                setPossibleMoves([]);
                return;
            }

            const piece = gameState.board[selectedPiece.y][selectedPiece.x];
            
            // Vérifie si le mouvement est valide (incluant le roque)
            const isValidMove = possibleMoves.some(move => move.x === position.x && move.y === position.y);
            
            if (!isValidMove) {
                setErrorMessage("Ce mouvement n'est pas autorisé !");
                if (!easyMode) {
                    setTimeout(() => {
                        setErrorMessage(null);
                    }, 2000);
                }
                return;
            }

            // Sauvegarder l'état actuel dans l'historique
            setMoveHistory([...moveHistory, {
                board: gameState.board,
                turn: gameState.currentTurn,
                hasMoved: gameState.hasMoved
            }]);

            // Vérifier si une pièce est capturée
            const capturedPiece = gameState.board[position.y][position.x];
            const movingPiece = gameState.board[selectedPiece.y][selectedPiece.x]!;
            
            // Créer le message du coup avec la capture si elle existe
            let moveText = `${gameState.currentTurn === 'white' ? 'Blanc' : 'Noir'}: ${
                PIECE_NAMES_FR[movingPiece.type]
            } ${convertCoordinates(selectedPiece.x, selectedPiece.y)} → ${convertCoordinates(position.x, position.y)}`;
            
            if (capturedPiece) {
                moveText += `\n   capture ${PIECE_SYMBOLS[`${capturedPiece.color}-${capturedPiece.type}`]}`;
            }

            setMoves([...moves, moveText]);

            // Mouvement valide : mise à jour du plateau
            const newBoard = [...gameState.board];
            const newHasMoved = { ...gameState.hasMoved };
            
            // Déplacer la déclaration de nextTurn avant son utilisation
            const nextTurn = gameState.currentTurn === 'white' ? 'black' : 'white';

            // Gérer le roque
            if (piece?.type === 'king' && Math.abs(position.x - selectedPiece.x) === 2) {
                const isKingSide = position.x > selectedPiece.x;
                const rookX = isKingSide ? 7 : 0;
                const rookNewX = isKingSide ? 4 : 2;
                const y = selectedPiece.y;

                // Déplacer le roi
                newBoard[y][position.x] = piece;
                newBoard[selectedPiece.y][selectedPiece.x] = null;

                // Déplacer la tour
                newBoard[y][rookNewX] = newBoard[y][rookX];
                newBoard[y][rookX] = null;

                // Marquer le roi et la tour comme ayant bougé
                if (piece.color === 'white') {
                    newHasMoved.whiteKing = true;
                    newHasMoved[isKingSide ? 'whiteRookRight' : 'whiteRookLeft'] = true;
                } else {
                    newHasMoved.blackKing = true;
                    newHasMoved[isKingSide ? 'blackRookRight' : 'blackRookLeft'] = true;
                }
            } else {
                // Mouvement normal
                newBoard[position.y][position.x] = piece;
                newBoard[selectedPiece.y][selectedPiece.x] = null;
            }

            // Vérifier si le mouvement met le roi adverse en échec
            const isOpponentInCheck = isKingInCheck(newBoard, nextTurn);
            if (isOpponentInCheck) {
                setErrorMessage("Échec !");
                setCheckingPiece(position);
                if (easyMode) {
                    let kingPosition: Position | null = null;
                    newBoard.forEach((row, y) => {
                        row.forEach((piece, x) => {
                            if (piece?.type === 'king' && piece.color === nextTurn) {
                                kingPosition = { x, y };
                            }
                        });
                    });
                    
                    if (kingPosition) {
                        const path = getCheckPath(newBoard, position, kingPosition);
                        setCheckPath(path);
                    }
                }
            } else {
                setErrorMessage(null);
                setCheckingPiece(null);
                setCheckPath([]);
            }

            setGameState({
                ...gameState,
                board: newBoard,
                currentTurn: nextTurn,
                hasMoved: newHasMoved
            });
            setSelectedPiece(null);
            setPossibleMoves([]);

            if (selectedOpening && guideStep >= 0) {
                const nextStep = guideStep + 1;
                if (nextStep < OPENINGS_GUIDE[selectedOpening].steps.length) {
                    setGuideStep(nextStep);
                } else {
                    setGuideStep(-1); // Fin du guide
                }
            }
        }
    };

    const isHighlighted = (pos: Position) => {
        if (guideStep >= 0) {
            const guidedMoves = getGuidedMove(guideStep);
            if (guidedMoves) {
                for (const move of guidedMoves) {
                    if ((pos.x === move.from.x && pos.y === move.from.y) ||
                        (pos.x === move.to.x && pos.y === move.to.y)) {
                        return 'guide';
                    }
                }
            }
        }
        return easyMode && possibleMoves.some(move => move.x === pos.x && move.y === pos.y) ? 'possible' : false;
    };

    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const resetGame = () => {
        // Réinitialiser l'état du jeu
        setGameState({
            board: initializeBoard(),
            currentTurn: 'white',
            gameStatus: 'active',
            hasMoved: {
                whiteKing: false,
                blackKing: false,
                whiteRookLeft: false,
                whiteRookRight: false,
                blackRookLeft: false,
                blackRookRight: false,
            }
        });

        // Réinitialiser tous les autres états
        setSelectedPiece(null);
        setPossibleMoves([]);
        setErrorMessage(null);
        setMoves([]);
        setMoveHistory([]);
        setCheckPath([]);
        setCheckingPiece(null);
        setSelectedOpening('');
        setGuideStep(-1);
    };

    const undoLastMove = () => {
        if (errorMessage === "Ce mouvement n'est pas autorisé !") {
            setErrorMessage(null);
            return;
        }

        if (moveHistory.length > 0) {
            const lastMove = moveHistory[moveHistory.length - 1];
            setGameState({
                ...gameState,
                board: lastMove.board,
                currentTurn: lastMove.turn,
                hasMoved: lastMove.hasMoved  // Restaurer l'état des pièces qui ont bougé
            });
            setMoveHistory(moveHistory.slice(0, -1));
            setErrorMessage(null);
            setCheckPath([]);
            setCheckingPiece(null);
            setMoves(moves.slice(0, -1));
        }
    };

    const getCurrentOpeningDescription = () => {
        if (moves.length === 0) {
            return "En attente du premier coup...";
        }

        const matchMove = (move: string | undefined, from: string, to: string) => {
            if (!move) return false;
            return move.includes(`${from} → ${to}`);
        };

        // Détection précoce de l'ouverture italienne (dès le 3ème coup)
        if (moves.length >= 5) {
            const isStartingItalian = 
                (moves[0].includes('Blanc') && matchMove(moves[0], 'e2', 'e4')) &&
                (moves[1].includes('Noir') && matchMove(moves[1], 'e7', 'e5')) &&
                (moves[2].includes('Blanc') && matchMove(moves[2], 'g1', 'f3')) &&
                (moves[3].includes('Noir') && matchMove(moves[3], 'b8', 'c6')) &&
                (moves[4].includes('Blanc') && matchMove(moves[4], 'f1', 'c4'));

            if (isStartingItalian) {
                return OPENINGS_GUIDE.italian.movesDescription;
            }
        } else if (moves.length >= 3) {
            // Vérification des 3 premiers coups pour une détection précoce
            const potentialItalian = 
                (moves[0].includes('Blanc') && matchMove(moves[0], 'e2', 'e4')) &&
                (moves[1].includes('Noir') && matchMove(moves[1], 'e7', 'e5')) &&
                (moves[2].includes('Blanc') && matchMove(moves[2], 'g1', 'f3'));

            if (potentialItalian) {
                return "Cette séquence pourrait mener à l'ouverture italienne si les prochains coups sont Cavalier en c6 suivi de Fou en c4";
            }
        }

        // Même chose pour l'ouverture espagnole
        if (moves.length >= 5) {
            const isStartingSpanish = 
                (moves[0].includes('Blanc') && matchMove(moves[0], 'e2', 'e4')) &&
                (moves[1].includes('Noir') && matchMove(moves[1], 'e7', 'e5')) &&
                (moves[2].includes('Blanc') && matchMove(moves[2], 'g1', 'f3')) &&
                (moves[3].includes('Noir') && matchMove(moves[3], 'b8', 'c6')) &&
                (moves[4].includes('Blanc') && matchMove(moves[4], 'f1', 'b5'));

            if (isStartingSpanish) {
                return OPENINGS_GUIDE.spanish.movesDescription;
            }
        } else if (moves.length >= 3) {
            const potentialSpanish = 
                (moves[0].includes('Blanc') && matchMove(moves[0], 'e2', 'e4')) &&
                (moves[1].includes('Noir') && matchMove(moves[1], 'e7', 'e5')) &&
                (moves[2].includes('Blanc') && matchMove(moves[2], 'g1', 'f3'));

            if (potentialSpanish) {
                return "Cette séquence pourrait mener à l'ouverture espagnole si les prochains coups sont Cavalier en c6 suivi de Fou en b5";
            }
        }


        return "Ouverture non reconnue";
    };

    const toggleEasyMode = () => setEasyMode(!easyMode);

    const getGuidedMove = (step: number): { from: Position; to: Position }[] | null => {
        if (!selectedOpening || !OPENINGS_GUIDE[selectedOpening]) return null;
        
        const currentStep = OPENINGS_GUIDE[selectedOpening].steps[step];
        if (!currentStep) return null;

        // Extraire toutes les coordonnées du texte
        const moves: { from: Position; to: Position }[] = [];
        
        // Si c'est une étape avec des options, chercher dans les lignes suivantes
        if (currentStep.includes('Options :')) {
            const nextSteps = OPENINGS_GUIDE[selectedOpening].steps.slice(step + 1);
            for (const option of nextSteps) {
                // Arrêter si on trouve une ligne qui n'est pas une option
                if (!option.startsWith('   -')) break;
                
                // Chercher tous les mouvements dans l'option
                const optionMoves = [...option.matchAll(/([a-h])([1-8]) → ([a-h])([1-8])/g)];
                for (const moveMatch of optionMoves) {
                    const [_, fromFile, fromRank, toFile, toRank] = moveMatch;
                    moves.push({
                        from: {
                            x: 7 - 'abcdefgh'.indexOf(fromFile),
                            y: 8 - parseInt(fromRank)
                        },
                        to: {
                            x: 7 - 'abcdefgh'.indexOf(toFile),
                            y: 8 - parseInt(toRank)
                        }
                    });
                }
            }
            return moves.length > 0 ? moves : null;
        }

        // Pour les coups normaux
        const moveMatches = currentStep.matchAll(/([a-h])([1-8]) → ([a-h])([1-8])/g);
        for (const match of moveMatches) {
            const [_, fromFile, fromRank, toFile, toRank] = match;
            moves.push({
                from: {
                    x: 7 - 'abcdefgh'.indexOf(fromFile),
                    y: 8 - parseInt(fromRank)
                },
                to: {
                    x: 7 - 'abcdefgh'.indexOf(toFile),
                    y: 8 - parseInt(toRank)
                }
            });
        }

        return moves.length > 0 ? moves : null;
    };

    const handleOpeningSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const opening = e.target.value as OpeningKey | '';
        setSelectedOpening(opening);
        setGuideStep(opening ? 0 : -1);  // Démarrer le guide à l'étape 0 si une ouverture est sélectionnée
    };

    return (
        <div className="chess-container">
            <div className="game-controls">
                <button className="reset-button" onClick={resetGame}>
                    Nouvelle partie
                </button>
                <button className="undo-button" onClick={undoLastMove} disabled={!canUndo}>
                    Annuler coup
                </button>
                <button className="easy-mode-button" onClick={toggleEasyMode}>
                    {easyMode ? 'Mode normal' : 'Mode facile'}
                </button>
                
                {easyMode && (
                    <>
                        <div className="moves-description">
                            <h4>Description des coups</h4>
                            <div className="description">
                                {getCurrentOpeningDescription()}
                            </div>
                        </div>

                        <div className="opening-guide">
                            <select 
                                value={selectedOpening} 
                                onChange={handleOpeningSelect}
                                className="opening-select"
                            >
                                <option value="">Choisir une ouverture...</option>
                                <option value="italian">Ouverture italienne</option>
                                <option value="spanish">Ouverture espagnole</option>
                                <option value="sicilian">Défense sicilienne</option>
                                <option value="french">Défense française</option>
                                <option value="caro_kann">Défense Caro-Kann</option>
                                <option value="kings_gambit">Gambit du Roi</option>
                                <option value="queens_gambit">Gambit Dame</option>
                                <option value="kings_indian">Défense indienne du roi</option>
                                <option value="dutch">Défense hollandaise</option>
                            </select>
                            
                            {selectedOpening && OPENINGS_GUIDE[selectedOpening] && (
                                <div className="opening-steps">
                                    <h4>{OPENINGS_GUIDE[selectedOpening].name}</h4>
                                    <p className="description">{OPENINGS_GUIDE[selectedOpening].description}</p>
                                    <ul>
                                        {OPENINGS_GUIDE[selectedOpening].steps.map((step, index) => (
                                            <li key={index}>{step}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <div className="game-area">
                {errorMessage && (
                    <div 
                        className="error-message"
                        onClick={() => {
                            setErrorMessage(null);
                            if (errorMessage === "Ce mouvement n'est pas autorisé !") {
                                setSelectedPiece(null);
                                setPossibleMoves([]);
                            }
                        }}
                    >
                        {errorMessage}
                    </div>
                )}
                
                {/* Coordonnées des lettres (en bas) */}
                {letters.map((letter, i) => (
                    <div 
                        key={letter} 
                        className="coordinates letter"
                        style={{ left: `${i * (100 / 8)}%` }}
                    >
                        {letter}
                    </div>
                ))}
                
                {/* Coordonnées des chiffres (à gauche, de bas en haut) */}
                {numbers.map((number, i) => (
                    <div 
                        key={number} 
                        className="coordinates number"
                        style={{ top: `${i * (100 / 8)}%` }}
                    >
                        {number}
                    </div>
                ))}
                
                <div className="chess-board">
                    {gameState.board.map((row, y) => (
                        <div key={y} className="board-row">
                            {row.map((piece, x) => {
                                const isCheck = checkingPiece && 
                                    ((x === checkingPiece.x && y === checkingPiece.y) || 
                                     (piece?.type === 'king' && piece.color === gameState.currentTurn));
                                
                                return (
                                    <div
                                        key={`${x}-${y}`}
                                        className={`square ${(x + y) % 2 === 0 ? 'light' : 'dark'} 
                                            ${isHighlighted({x, y}) === 'guide' ? 'highlighted-guide' : ''}
                                            ${isHighlighted({x, y}) === 'possible' ? 'highlighted' : ''}
                                            ${checkPath.some(pos => pos.x === x && pos.y === y) ? 'check-path' : ''}`}
                                        onClick={() => handleSquareClick({ x, y })}
                                    >
                                        {piece && (
                                            <div className={`chess-piece ${piece.color} ${isCheck ? 'check' : ''}`}>
                                                {PIECE_SYMBOLS[`${piece.color}-${piece.type}` as keyof typeof PIECE_SYMBOLS]}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className="moves-list">
                <h3>Liste des coups</h3>
                {moves.map((move, index) => (
                    <div 
                        key={index} 
                        className={`move ${move.startsWith('Blanc') ? 'white' : 'black'}`}
                    >
                        {move}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChessBoard; 