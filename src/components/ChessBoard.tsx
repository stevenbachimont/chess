import React, { useState, useEffect } from 'react';
import { GameState, Position, PieceColor } from '../types/chess';
import './ChessBoard.scss';
import { initializeBoard, getPossibleMoves, isKingInCheck, getCheckPath } from '../utils/board';
import { getCurrentOpeningDescription, getGuidedMove } from '../utils/openings';
import { resetGame, undoLastMove } from '../utils/gameActions';
import { OpeningKey } from '../types/openings';
import openingsData from '../data/openings.json';
import whitePawnImage from '../assets/pieces/pion blanc.png';
import whiteRookImage from '../assets/pieces/tour blanc.png';
import whiteKnightImage from '../assets/pieces/cavalier blanc.png';
import whiteBishopImage from '../assets/pieces/fou blanc.png';
import whiteQueenImage from '../assets/pieces/dame blanc.png';
import whiteKingImage from '../assets/pieces/roi blanc.png';
import blackPawnImage from '../assets/pieces/pion noir.png';
import blackRookImage from '../assets/pieces/tour noir.png';
import blackKnightImage from '../assets/pieces/cavalier noir.png';
import blackBishopImage from '../assets/pieces/fou noir.png';
import blackQueenImage from '../assets/pieces/dame noir.png';
import blackKingImage from '../assets/pieces/roi noir.png';

const PIECE_SYMBOLS = {
    'white-pawn': <img src={whitePawnImage} alt="♙" className="piece-image" data-symbol="♙" />,
    'white-rook': <img src={whiteRookImage} alt="♖" className="piece-image" data-symbol="♖" />,
    'white-knight': <img src={whiteKnightImage} alt="♘" className="piece-image" data-symbol="♘" />,
    'white-bishop': <img src={whiteBishopImage} alt="♗" className="piece-image" data-symbol="♗" />,
    'white-queen': <img src={whiteQueenImage} alt="♕" className="piece-image" data-symbol="♕" />,
    'white-king': <img src={whiteKingImage} alt="♔" className="piece-image" data-symbol="♔" />,
    'black-pawn': <img src={blackPawnImage} alt="♟" className="piece-image" data-symbol="♟" />,
    'black-rook': <img src={blackRookImage} alt="♜" className="piece-image" data-symbol="♜" />,
    'black-knight': <img src={blackKnightImage} alt="♞" className="piece-image" data-symbol="♞" />,
    'black-bishop': <img src={blackBishopImage} alt="♝" className="piece-image" data-symbol="♝" />,
    'black-queen': <img src={blackQueenImage} alt="♛" className="piece-image" data-symbol="♛" />,
    'black-king': <img src={blackKingImage} alt="♚" className="piece-image" data-symbol="♚" />
} as const;

const PIECE_NAMES_FR = {
    'pawn': 'Pion',
    'rook': 'Tour',
    'knight': 'Cavalier',
    'bishop': 'Fou',
    'queen': 'Reine',
    'king': 'Roi'
} as const;

const PIECE_VALUES = {
    'pawn': 1,
    'knight': 3,
    'bishop': 3,
    'rook': 5,
    'queen': 9,
    'king': 0
} as const;

const DEFAULT_TIME_OPTIONS = [
    { label: '1 min', value: 60 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 }
] as const;

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
        },
        enPassantTarget: null
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
    const [score, setScore] = useState({
        white: 0,
        black: 0
    });
    const [timeControl, setTimeControl] = useState({
        white: 300, // 5 minutes par défaut
        black: 300,
        increment: 2 // 2 secondes d'incrément
    });
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [selectedTime, setSelectedTime] = useState(300);
    const [promotionPosition, setPromotionPosition] = useState<Position | null>(null);
    const [promotionColor, setPromotionColor] = useState<PieceColor | null>(null);
    const [draggedPiece, setDraggedPiece] = useState<Position | null>(null);

    // Ajouter l'effet pour gérer le décompte du temps
    useEffect(() => {
        let interval: number;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimeControl(prev => ({
                    ...prev,
                    [gameState.currentTurn]: Math.max(0, prev[gameState.currentTurn] - 1)
                }));
                
                // Vérifier si le temps est écoulé
                if (timeControl[gameState.currentTurn] <= 0) {
                    setErrorMessage(`Temps écoulé ! Les ${gameState.currentTurn === 'white' ? 'noirs' : 'blancs'} gagnent !`);
                    setIsTimerRunning(false);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, gameState.currentTurn]);

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
                // En mode normal, toutes les cases sont des mouvements possibles
                let moves = easyMode ? 
                    getPossibleMoves(gameState.board, position, gameState) :
                    // En mode normal, permettre le déplacement vers toutes les cases vides ou occupées par l'adversaire
                    Array.from({ length: 8 }, (_, y) => 
                        Array.from({ length: 8 }, (_, x) => {
                            const targetPiece = gameState.board[y][x];
                            return (!targetPiece || targetPiece.color !== piece.color) ? { x, y } : null;
                        })
                    ).flat().filter(move => move !== null) as Position[];

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

            // Sauvegarder l'état actuel dans l'historique avec une copie profonde
            setMoveHistory([...moveHistory, {
                board: gameState.board.map(row => row.map(piece => piece ? {...piece} : null)),
                turn: gameState.currentTurn,
                hasMoved: {...gameState.hasMoved}
            }]);

            // Vérifier si une pièce est capturée
            const capturedPiece = gameState.board[position.y][position.x];
            const movingPiece = gameState.board[selectedPiece.y][selectedPiece.x]!;

            // Mouvement valide : mise à jour du plateau
            const newBoard = [...gameState.board];
            const newHasMoved = { ...gameState.hasMoved };
            let enPassantTarget: Position | null = null;
            
            // Créer le message du coup avec la capture si elle existe
            let moveText = '';

            // Gérer le roque
            if (piece?.type === 'king' && Math.abs(position.x - selectedPiece.x) === 2) {
                const isKingSide = position.x < selectedPiece.x;
                moveText = `${gameState.currentTurn === 'white' ? 'Blanc' : 'Noir'}: ${
                    isKingSide ? 'Petit roque' : 'Grand roque'
                }`;
            } else {
                // Message normal pour les autres coups
                moveText = `${gameState.currentTurn === 'white' ? 'Blanc' : 'Noir'}: ${
                PIECE_NAMES_FR[movingPiece.type]
                } ${convertCoordinates(selectedPiece.x, selectedPiece.y)} → ${convertCoordinates(position.x, position.y)}`;
            }

            // Si c'est une prise en passant
            if (piece?.type === 'pawn' && 
                position.x !== selectedPiece.x && 
                !gameState.board[position.y][position.x] &&
                gameState.enPassantTarget &&
                position.x === gameState.enPassantTarget.x &&
                position.y === gameState.enPassantTarget.y) {
                // Supprimer le pion capturé
                newBoard[selectedPiece.y][position.x] = null;
                // Utiliser data-symbol pour le symbole du pion
                const capturedPawnSymbol = PIECE_SYMBOLS[`${gameState.currentTurn === 'white' ? 'black' : 'white'}-pawn`].props['data-symbol'];
                moveText += `\n   capture en passant ${capturedPawnSymbol}`;
                
                // Ajouter le point pour la capture
                setScore(prevScore => ({
                    ...prevScore,
                    [gameState.currentTurn]: prevScore[gameState.currentTurn] + PIECE_VALUES['pawn']
                }));
            } else if (capturedPiece) {
                moveText += `\n   capture ${PIECE_SYMBOLS[`${capturedPiece.color}-${capturedPiece.type}`].props['data-symbol']}`;
                setScore(prevScore => ({
                    ...prevScore,
                    [gameState.currentTurn]: prevScore[gameState.currentTurn] + PIECE_VALUES[capturedPiece.type]
                }));
            }

            setMoves([...moves, moveText]);

            // Détecter si c'est un pion qui avance de deux cases
            if (piece?.type === 'pawn' && Math.abs(position.y - selectedPiece.y) === 2) {
                enPassantTarget = {
                    x: position.x,
                    y: (position.y + selectedPiece.y) / 2
                };
            }
            
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

            if (piece?.type === 'pawn' && (position.y === 0 || position.y === 7)) {
                setPromotionPosition(position);
                setPromotionColor(piece.color);
                return;
            }

            setGameState({
                ...gameState,
                board: newBoard,
                currentTurn: nextTurn,
                hasMoved: newHasMoved,
                enPassantTarget: enPassantTarget
            });
            setSelectedPiece(null);
            setPossibleMoves([]);

            if (selectedOpening && guideStep >= 0) {
                const nextStep = guideStep + 1;
                if (nextStep <= 5) {  // Limiter à 3 mouvements (6 étapes car chaque mouvement a 2 étapes)
                    setGuideStep(nextStep);
                } else {
                    setGuideStep(-1); // Fin du guide
                }
            }

            // Ajouter 2 secondes au temps du joueur qui vient de jouer
            if (isTimerRunning) {
                setTimeControl(prev => ({
                    ...prev,
                    [gameState.currentTurn]: prev[gameState.currentTurn] + 2
                }));
            }
        }
    };

    const isHighlighted = (pos: Position) => {
        if (guideStep >= 0) {
            const guidedMoves = getGuidedMove(guideStep, selectedOpening, moves, setGuideStep);
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

    const handleReset = () => {
        resetGame({
            setGameState,
            setSelectedPiece,
            setPossibleMoves,
            setErrorMessage,
            setMoves,
            setMoveHistory,
            setCheckPath,
            setCheckingPiece,
            setSelectedOpening,
            setGuideStep
        });
        setScore({ white: 0, black: 0 });
        setTimeControl({
            white: selectedTime,
            black: selectedTime,
            increment: 2
        });
        setIsTimerRunning(false);
    };

    const handleUndo = () => {
        const lastMove = moves[moves.length - 1];
        if (lastMove && lastMove.includes('capture')) {
            const captureColor = lastMove.startsWith('Blanc') ? 'white' : 'black';
            const capturedPieceSymbol = lastMove.split('capture ')[1];
            // Trouver le type de pièce à partir du symbole
            const pieceType = Object.entries(PIECE_SYMBOLS).find(([_, element]) => 
                element.props['data-symbol'] === capturedPieceSymbol
            )?.[0].split('-')[1] as keyof typeof PIECE_VALUES;
            
            if (pieceType) {
                setScore(prevScore => ({
                    ...prevScore,
                    [captureColor]: prevScore[captureColor] - PIECE_VALUES[pieceType]
                }));
            }
        }

        undoLastMove(moveHistory, moves, {
            setGameState,
            setMoveHistory,
            setMoves,
            setSelectedPiece,
            setPossibleMoves,
            setErrorMessage,
            setCheckPath,
            setCheckingPiece,
            setGuideStep,
            setSelectedOpening,
            selectedOpening,
            guideStep
        });
    };

    const toggleEasyMode = () => setEasyMode(!easyMode);

    const handleOpeningSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const opening = e.target.value as OpeningKey | '';
        setSelectedOpening(opening);
        setGuideStep(opening ? 0 : -1);  // Démarrer le guide à l'étape 0 si une ouverture est sélectionnée
    };

    // Ajouter la fonction pour formater le temps
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handlePromotion = (pieceType: 'queen' | 'rook' | 'bishop' | 'knight') => {
        if (!promotionPosition || !promotionColor) return;

        const newBoard = [...gameState.board];
        newBoard[promotionPosition.y][promotionPosition.x] = {
            type: pieceType,
            color: promotionColor
        };

            setGameState({
                ...gameState,
            board: newBoard
        });

        setPromotionPosition(null);
        setPromotionColor(null);
    };

    const handleDragStart = (e: React.DragEvent, position: Position) => {
        const piece = gameState.board[position.y][position.x];
        if (piece && piece.color === gameState.currentTurn) {
            setDraggedPiece(position);
            setSelectedPiece(position);
            const moves = getPossibleMoves(gameState.board, position, gameState);
            setPossibleMoves(moves);
            
            // Ajouter les mouvements de roque si c'est un roi
            if (piece.type === 'king' && position.x === 3) {
                const y = piece.color === 'white' ? 7 : 0;
                if (canCastle({ x: 3, y }, { x: 7, y })) {
                    moves.push({ x: 5, y });
                }
                if (canCastle({ x: 3, y }, { x: 0, y })) {
                    moves.push({ x: 1, y });
                }
            }
        }
    };

    const handleDragOver = (e: React.DragEvent, position: Position) => {
        e.preventDefault();
        if (possibleMoves.some(move => move.x === position.x && move.y === position.y)) {
            e.currentTarget.classList.add('drop-target');
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('drop-target');
    };

    const handleDrop = (e: React.DragEvent, position: Position) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drop-target');
        
        if (draggedPiece && possibleMoves.some(move => move.x === position.x && move.y === position.y)) {
            handleSquareClick(position);
        } else if (draggedPiece) {  // Si on a une pièce mais le mouvement n'est pas valide
            setErrorMessage("Ce mouvement n'est pas autorisé !");
            if (!easyMode) {
                setTimeout(() => {
                    setErrorMessage(null);
                }, 2000);
            }
        }
        
        setDraggedPiece(null);
    };

    return (
        <div className="chess-container">
            <div className="left-controls">
                {easyMode && (
                    <>
                        <div className="moves-description">
                            <h4>Description des coups</h4>
                            <div className="description">
                                {getCurrentOpeningDescription(moves)}
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
                            
                            {selectedOpening && openingsData[selectedOpening] && (
                                <div className="opening-steps">
                                    <h4>{openingsData[selectedOpening].name}</h4>
                                    <p className="description">{openingsData[selectedOpening].description}</p>
                                    <ul>
                                        {openingsData[selectedOpening].steps.map((step, index) => (
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
                                        className={`square ${(x + y) % 2 === 1 ? 'light' : 'dark'} 
                                            ${isHighlighted({x, y}) === 'guide' ? 'highlighted-guide' : ''}
                                            ${isHighlighted({x, y}) === 'possible' ? 'highlighted' : ''}
                                            ${checkPath.some(pos => pos.x === x && pos.y === y) ? 'check-path' : ''}`}
                                        onClick={() => handleSquareClick({ x, y })}
                                        onDragOver={(e) => handleDragOver(e, { x, y })}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, { x, y })}
                                    >
                                        {piece && (
                                            <div 
                                                className={`chess-piece ${piece.color} ${isCheck ? 'check' : ''} ${
                                                    draggedPiece?.x === x && draggedPiece?.y === y ? 'dragging' : ''
                                                }`}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, { x, y })}
                                            >
                                                {PIECE_SYMBOLS[`${piece.color}-${piece.type}`]}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className="game-buttons">
                    <button className="reset-button" onClick={handleReset}>
                        Nouvelle partie
                    </button>
                    <button className="undo-button" onClick={handleUndo} disabled={!canUndo}>
                        Annuler coup
                    </button>
                    <button className="easy-mode-button" onClick={toggleEasyMode}>
                        {easyMode ? 'Sans assistance' : 'Avec assistance'}
                    </button>
                </div>
            </div>

            <div className="right-controls">
                <div className="timer-score-container">
                    <div className="timer-control">
                        <select 
                            className="time-select"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(Number(e.target.value))}
                            disabled={isTimerRunning}
                        >
                            {DEFAULT_TIME_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="timer-display">
                            <div className="timer-item">
                                <div className="timer-label">Blancs</div>
                                <div className={`timer-value white ${timeControl.white < 30 ? 'low-time' : ''}`}>
                                    {formatTime(timeControl.white)}
                                </div>
                            </div>
                            <div className="timer-item">
                                <div className="timer-label">Noirs</div>
                                <div className={`timer-value black ${timeControl.black < 30 ? 'low-time' : ''}`}>
                                    {formatTime(timeControl.black)}
                                </div>
                            </div>
                        </div>
                        <button 
                            className={`start-timer-button ${isTimerRunning ? 'running' : ''}`}
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                        >
                            {isTimerRunning ? 'Pause' : 'Démarrer'}
                        </button>
                    </div>
                    <div className="score-display">
                        <div className="score-item">
                            <div className="score-label">Blancs</div>
                            <div className="score-value white">{score.white}</div>
                        </div>
                        <div className="score-item">
                            <div className="score-label">Noirs</div>
                            <div className="score-value black">{score.black}</div>
                        </div>
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

            {promotionPosition && promotionColor && (
                <div className="promotion-dialog">
                    <h3>Choisissez une pièce pour la promotion</h3>
                    <div className="promotion-options">
                        <div 
                            className="promotion-piece" 
                            onClick={() => handlePromotion('queen')}
                        >
                            {PIECE_SYMBOLS[`${promotionColor}-queen`]}
                        </div>
                        <div 
                            className="promotion-piece" 
                            onClick={() => handlePromotion('rook')}
                        >
                            {PIECE_SYMBOLS[`${promotionColor}-rook`]}
                        </div>
                        <div 
                            className="promotion-piece" 
                            onClick={() => handlePromotion('bishop')}
                        >
                            {PIECE_SYMBOLS[`${promotionColor}-bishop`]}
                        </div>
                        <div 
                            className="promotion-piece" 
                            onClick={() => handlePromotion('knight')}
                        >
                            {PIECE_SYMBOLS[`${promotionColor}-knight`]}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChessBoard; 

