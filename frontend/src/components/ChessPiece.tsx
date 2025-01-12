import React from 'react';
import { Piece, PIECE_SYMBOLS } from '../types/chess';

interface ChessPieceProps {
    piece: Piece;
}

const ChessPiece: React.FC<ChessPieceProps> = ({ piece }) => {
    if (!piece) return null;

    const pieceKey = `${piece.color}-${piece.type}` as keyof typeof PIECE_SYMBOLS;
    return (
        <div className={`chess-piece ${piece.color}`}>
            {PIECE_SYMBOLS[pieceKey]}
        </div>
    );
};

export default ChessPiece; 