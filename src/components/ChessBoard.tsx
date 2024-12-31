import React, { useState } from 'react';
import { GameState, Position, PIECE_SYMBOLS, PieceColor } from '../types/chess';
import './ChessBoard.scss';
import { initializeBoard, getPossibleMoves, isKingInCheck, getCheckPath } from '../utils/board';

const PIECE_NAMES_FR = {
    'pawn': 'Pion',
    'rook': 'Tour',
    'knight': 'Cavalier',
    'bishop': 'Fou',
    'queen': 'Reine',
    'king': 'Roi'
} as const;

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

            // Sauvegarder l'état actuel
            setMoveHistory([...moveHistory, {
                board: gameState.board.map(row => [...row]),
                turn: gameState.currentTurn,
                hasMoved: { ...gameState.hasMoved }  // Sauvegarder aussi l'état des pièces qui ont bougé
            }]);

            let moveNotation;
            if (piece?.type === 'king' && Math.abs(position.x - selectedPiece.x) === 2) {
                const isKingSide = position.x < selectedPiece.x;
                moveNotation = `${piece.color === 'black' ? 'Noir' : 'Blanc'}: ${isKingSide ? 'Petit' : 'Grand'} roque`;
            } else {
                const from = `${letters[7 - selectedPiece.x]}${8 - selectedPiece.y}`;
                const to = `${letters[7 - position.x]}${8 - position.y}`;
                moveNotation = `${piece?.color === 'black' ? 'Noir' : 'Blanc'}: ${PIECE_NAMES_FR[piece?.type || 'pawn']} ${from} → ${to}`;
            }
            console.log(moveNotation);
            setMoves([...moves, moveNotation]);

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
        }
    };

    const isHighlighted = (pos: Position) => {
        return easyMode && possibleMoves.some(move => move.x === pos.x && move.y === pos.y);
    };

    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const resetGame = () => {
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
        setSelectedPiece(null);
        setPossibleMoves([]);
        setErrorMessage(null);
        setMoves([]);
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

    return (
        <div className="chess-container">
            <div className="game-controls">
                <button className="easy-mode-button" onClick={() => setEasyMode(!easyMode)}>
                    {easyMode ? 'Mode Normal' : 'Mode Facile'}
                </button>
                <button className="undo-button" onClick={undoLastMove} disabled={moveHistory.length === 0}>
                    Annuler
                </button>
                <button className="reset-button" onClick={resetGame}>
                    Réinitialiser
                </button>
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
                                            ${isHighlighted({x, y}) ? 'highlighted' : ''}
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