import { Piece, Position, PieceType, PieceColor, GameState } from '../types/chess';

export const initializeBoard = (): (Piece | null)[][] => {
    const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Placement des pièces
    const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'king', 'queen', 'bishop', 'knight', 'rook'];
    
    // Place les pièces noires
    backRow.forEach((type, x) => {
        board[0][x] = { type, color: 'black' };
        board[1][x] = { type: 'pawn', color: 'black' };
    });

    // Place les pièces blanches (maintenant en bas)
    backRow.forEach((type, x) => {
        board[7][x] = { type, color: 'white' };
        board[6][x] = { type: 'pawn', color: 'white' };
    });

    return board;
};

export const getPossibleMoves = (board: (Piece | null)[][], position: Position, gameState?: GameState, checkForCheck: boolean = true): Position[] => {
    const piece = board[position.y][position.x];
    if (!piece) return [];

    const moves: Position[] = [];
    const isValidPosition = (x: number, y: number) => 
        x >= 0 && x < 8 && y >= 0 && y < 8;

    const canMoveTo = (x: number, y: number) => {
        if (!isValidPosition(x, y)) return false;
        const targetPiece = board[y][x];
        return !targetPiece || targetPiece.color !== piece.color;
    };

    switch (piece.type) {
        case 'pawn': {
            const direction = piece.color === 'white' ? -1 : 1;
            const newY = position.y + direction;

            // Mouvement simple
            if (isValidPosition(position.x, newY) && !board[newY][position.x]) {
                moves.push({ x: position.x, y: newY });
                
                // Double mouvement initial
                if ((position.y === 1 && piece.color === 'black') || 
                    (position.y === 6 && piece.color === 'white')) {
                    const doubleY = position.y + (direction * 2);
                    if (!board[doubleY][position.x]) {
                        moves.push({ x: position.x, y: doubleY });
                    }
                }
            }

            // Captures en diagonale
            [-1, 1].forEach(dx => {
                const newX = position.x + dx;
                if (isValidPosition(newX, newY) && board[newY][newX]?.color !== piece.color && board[newY][newX] !== null) {
                    moves.push({ x: newX, y: newY });
                }
            });

            // Ajouter la prise en passant
            if (gameState?.enPassantTarget) {
                if (position.y === (piece.color === 'white' ? 3 : 4)) {
                    // Vérifier si le pion peut prendre en passant à gauche ou à droite
                    if (Math.abs(gameState.enPassantTarget.x - position.x) === 1 &&
                        gameState.enPassantTarget.y === position.y + direction) {
                        moves.push(gameState.enPassantTarget);
                    }
                }
            }
            break;
        }

        case 'knight': {
            const knightMoves = [
                [-2, -1], [-2, 1], [2, -1], [2, 1],
                [-1, -2], [-1, 2], [1, -2], [1, 2]
            ];
            knightMoves.forEach(([dx, dy]) => {
                const newX = position.x + dx;
                const newY = position.y + dy;
                if (canMoveTo(newX, newY)) {
                    moves.push({ x: newX, y: newY });
                }
            });
            break;
        }

        case 'bishop': {
            const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            directions.forEach(([dx, dy]) => {
                let x = position.x + dx;
                let y = position.y + dy;
                while (canMoveTo(x, y)) {
                    moves.push({ x, y });
                    if (board[y][x]) break; // Stop si on capture une pièce
                    x += dx;
                    y += dy;
                }
            });
            break;
        }

        case 'rook': {
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            directions.forEach(([dx, dy]) => {
                let x = position.x + dx;
                let y = position.y + dy;
                while (canMoveTo(x, y)) {
                    moves.push({ x, y });
                    if (board[y][x]) break; // Stop si on capture une pièce
                    x += dx;
                    y += dy;
                }
            });
            break;
        }

        case 'queen': {
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            directions.forEach(([dx, dy]) => {
                let x = position.x + dx;
                let y = position.y + dy;
                while (canMoveTo(x, y)) {
                    moves.push({ x, y });
                    if (board[y][x]) break; // Stop si on capture une pièce
                    x += dx;
                    y += dy;
                }
            });
            break;
        }

        case 'king': {
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            directions.forEach(([dx, dy]) => {
                const newX = position.x + dx;
                const newY = position.y + dy;
                if (canMoveTo(newX, newY)) {
                    moves.push({ x: newX, y: newY });
                }
            });
            break;
        }
    }

    // Ne vérifier l'échec que si checkForCheck est true
    if (checkForCheck) {
        return moves.filter(move => {
            const simulatedBoard = board.map(row => [...row]);
            simulatedBoard[move.y][move.x] = simulatedBoard[position.y][position.x];
            simulatedBoard[position.y][position.x] = null;
            return !isKingInCheck(simulatedBoard, piece.color);
        });
    }

    return moves;
};

export const isKingInCheck = (board: (Piece | null)[][], kingColor: PieceColor): Position | null => {
    // Trouver la position du roi
    let kingPosition: Position | null = null;
    board.forEach((row, y) => {
        row.forEach((piece, x) => {
            if (piece?.type === 'king' && piece.color === kingColor) {
                kingPosition = { x, y };
            }
        });
    });

    if (!kingPosition) return null;

    // Vérifier si une pièce adverse peut attaquer le roi
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const piece = board[y][x];
            if (piece && piece.color !== kingColor) {
                // Passer false pour éviter la récursion
                const moves = getPossibleMoves(board, { x, y }, undefined, false);
                if (moves.some(move => move.x === kingPosition!.x && move.y === kingPosition!.y)) {
                    return { x, y };
                }
            }
        }
    }

    return null;
};

export const wouldKingBeInCheck = (board: (Piece | null)[][], from: Position, to: Position, kingColor: PieceColor): boolean => {
    // Créer une copie du plateau pour simuler le mouvement
    const simulatedBoard = board.map(row => [...row]);
    simulatedBoard[to.y][to.x] = simulatedBoard[from.y][from.x];
    simulatedBoard[from.y][from.x] = null;
    
    return isKingInCheck(simulatedBoard, kingColor) !== null;
};

export const getCheckPath = (board: (Piece | null)[][], from: Position, kingPosition: Position): Position[] => {
    const piece = board[from.y][from.x];
    if (!piece) return [];

    const path: Position[] = [];
    const dx = Math.sign(kingPosition.x - from.x);
    const dy = Math.sign(kingPosition.y - from.y);

    // Pour le cavalier, seulement la position finale
    if (piece.type === 'knight') {
        return [kingPosition];
    }

    // Pour les autres pièces, calculer la trajectoire
    let x = from.x + dx;
    let y = from.y + dy;
    while (x !== kingPosition.x || y !== kingPosition.y) {
        path.push({ x, y });
        if (piece.type === 'pawn') break; // Le pion n'a qu'une case de menace
        if (dx !== 0) x += dx;
        if (dy !== 0) y += dy;
    }
    path.push(kingPosition);

    return path;
};
