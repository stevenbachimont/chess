import { GameState, Position } from '../types/chess';
import { initializeBoard } from './board';
import { MoveHistoryItem } from '../types/game';
import { Dispatch, SetStateAction } from 'react';

export const resetGame = (setters: {
    setGameState: (state: GameState) => void;
    setSelectedPiece: (piece: Position | null) => void;
    setPossibleMoves: (moves: Position[]) => void;
    setErrorMessage: (msg: string | null) => void;
    setMoves: (moves: string[]) => void;
    setMoveHistory: (history: any[]) => void;
    setCheckPath: (path: Position[]) => void;
    setCheckingPiece: (piece: Position | null) => void;
    setSelectedOpening: Dispatch<SetStateAction<"" | "italian" | "spanish" | "kings_gambit">>;
    setGuideStep: (step: number) => void;
}) => {
    setters.setGameState({
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
    
    setters.setSelectedPiece(null);
    setters.setPossibleMoves([]);
    setters.setErrorMessage(null);
    setters.setMoves([]);
    setters.setMoveHistory([]);
    setters.setCheckPath([]);
    setters.setCheckingPiece(null);
    setters.setSelectedOpening('');
    setters.setGuideStep(-1);
};

export const undoLastMove = (
    moveHistory: MoveHistoryItem[],
    moves: string[],
    setters: {
        setGameState: (state: GameState) => void;
        setMoveHistory: (history: MoveHistoryItem[]) => void;
        setMoves: (moves: string[]) => void;
        setSelectedPiece: (piece: Position | null) => void;
        setPossibleMoves: (moves: Position[]) => void;
        setErrorMessage: (msg: string | null) => void;
        setCheckPath: (path: Position[]) => void;
        setCheckingPiece: (piece: Position | null) => void;
        setGuideStep: (step: number) => void;
        setSelectedOpening: Dispatch<SetStateAction<"" | "italian" | "spanish" | "kings_gambit">>;
        selectedOpening: string;
        guideStep: number;
    }
) => {
    if (moveHistory.length === 0) return;

    const lastState = moveHistory[moveHistory.length - 1];
    
    setters.setGameState({
        board: lastState.board.map(row => row.map(piece => piece ? {...piece} : null)),
        currentTurn: lastState.turn,
        gameStatus: 'active',
        hasMoved: {...lastState.hasMoved}
    });

    setters.setMoveHistory(moveHistory.slice(0, -1));
    setters.setMoves(moves.slice(0, -1));
    setters.setSelectedPiece(null);
    setters.setPossibleMoves([]);
    setters.setErrorMessage(null);
    setters.setCheckPath([]);
    setters.setCheckingPiece(null);

    if (setters.selectedOpening && setters.guideStep > 0) {
        setters.setGuideStep(setters.guideStep - 1);
    }
}; 