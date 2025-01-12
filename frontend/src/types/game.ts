import { GameState, Position, PieceColor } from './chess';

export interface GameSetters {
    setGameState: (state: GameState) => void;
    setSelectedPiece: (piece: Position | null) => void;
    setPossibleMoves: (moves: Position[]) => void;
    setErrorMessage: (msg: string | null) => void;
    setMoves: (moves: string[]) => void;
    setMoveHistory: (history: MoveHistoryItem[]) => void;
    setCheckPath: (path: Position[]) => void;
    setCheckingPiece: (piece: Position | null) => void;
    setSelectedOpening: (opening: string) => void;
    setGuideStep: (step: number) => void;
}

export interface MoveHistoryItem {
    board: GameState['board'];
    turn: PieceColor;
    hasMoved: GameState['hasMoved'];
} 