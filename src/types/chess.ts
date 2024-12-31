export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface Position {
    x: number;
    y: number;
}

export interface GameState {
    board: (Piece | null)[][];
    currentTurn: PieceColor;
    gameStatus: 'active' | 'check' | 'checkmate' | 'stalemate';
    hasMoved?: {
        whiteKing?: boolean;
        blackKing?: boolean;
        whiteRookLeft?: boolean;
        whiteRookRight?: boolean;
        blackRookLeft?: boolean;
        blackRookRight?: boolean;
    };
}

export const PIECE_SYMBOLS = {
  'white-king': '♚',
  'white-queen': '♛',
  'white-rook': '♜',
  'white-bishop': '♝',
  'white-knight': '♞',
  'white-pawn': '♟',
  'black-king': '♔',
  'black-queen': '♕',
  'black-rook': '♖',
  'black-bishop': '♗',
  'black-knight': '♘',
  'black-pawn': '♙'
} as const;

export type Piece = {
    type: PieceType;
    color: PieceColor;
};