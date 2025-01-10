import { Position } from '../types/chess';
import openingsData from '../data/openings.json';

// Fonctions de détection
const detectItalianOpening = (moves: string[]) => {
    if (moves.length >= 5) {
        return (
            matchMove(moves[0], 'e2', 'e4') &&
            matchMove(moves[1], 'e7', 'e5') &&
            matchMove(moves[2], 'g1', 'f3') &&
            matchMove(moves[3], 'b8', 'c6') &&
            matchMove(moves[4], 'f1', 'c4')
        );
    }
    return false;
};

const detectSpanishOpening = (moves: string[]) => {
    if (moves.length >= 5) {
        return (
            matchMove(moves[0], 'e2', 'e4') &&
            matchMove(moves[1], 'e7', 'e5') &&
            matchMove(moves[2], 'g1', 'f3') &&
            matchMove(moves[3], 'b8', 'c6') &&
            matchMove(moves[4], 'f1', 'b5')
        );
    }
    return false;
};

const detectKingsGambit = (moves: string[]) => {
    if (moves.length >= 3) {
        return (
            matchMove(moves[0], 'e2', 'e4') &&
            matchMove(moves[1], 'e7', 'e5') &&
            matchMove(moves[2], 'f2', 'f4')
        );
    }
    return false;
};

const detectQueensGambit = (moves: string[]) => {
    if (moves.length >= 3) {
        return (
            matchMove(moves[0], 'd2', 'd4') &&
            matchMove(moves[1], 'd7', 'd5') &&
            matchMove(moves[2], 'c2', 'c4')
        );
    }
    return false;
};

const detectSicilianDefense = (moves: string[]) => {
    if (moves.length >= 2) {
        return (
            matchMove(moves[0], 'e2', 'e4') &&
            matchMove(moves[1], 'c7', 'c5')
        );
    }
    return false;
};

const detectFrenchDefense = (moves: string[]) => {
    if (moves.length >= 2) {
        return (
            matchMove(moves[0], 'e2', 'e4') &&
            matchMove(moves[1], 'e7', 'e6')
        );
    }
    return false;
};

// Ajouter la fonction de détection pour Caro-Kann
const detectCaroKann = (moves: string[]) => {
    if (moves.length >= 2) {
        return (
            matchMove(moves[0], 'e2', 'e4') &&
            matchMove(moves[1], 'c7', 'c6')
        );
    }
    return false;
};

// Ajouter la fonction de détection pour la défense indienne du roi
const detectKingsIndian = (moves: string[]) => {
    if (moves.length >= 4) {
        return (
            matchMove(moves[0], 'd2', 'd4') &&
            matchMove(moves[1], 'g8', 'f6') &&
            matchMove(moves[2], 'c2', 'c4') &&
            matchMove(moves[3], 'g7', 'g6')
        );
    }
    return false;
};

// Ajouter la fonction de détection pour la défense hollandaise
const detectDutchDefense = (moves: string[]) => {
    if (moves.length >= 2) {
        return (
            matchMove(moves[0], 'd2', 'd4') &&
            matchMove(moves[1], 'f7', 'f5')
        );
    }
    return false;
};

export const matchMove = (move: string | undefined, from: string, to: string) => {
    if (!move) return false;
    return move.includes(`${from} → ${to}`);
};

export const getCurrentOpeningDescription = (moves: string[]) => {
    if (moves.length === 0) {
        return "En attente du premier coup...";
    }

    // Ajouter la détection de la défense hollandaise
    if (detectDutchDefense(moves)) {
        return openingsData.dutch.movesDescription;
    }

    // Ajouter la détection de la défense indienne du roi
    if (detectKingsIndian(moves)) {
        return openingsData.kings_indian.movesDescription;
    }

    // Ajouter la détection de Caro-Kann
    if (detectCaroKann(moves)) {
        return openingsData.caro_kann.movesDescription;
    }

    // Détection de l'ouverture italienne
    if (detectItalianOpening(moves)) {
        return openingsData.italian.movesDescription;
    }

    // Détection de l'ouverture espagnole
    if (detectSpanishOpening(moves)) {
        return openingsData.spanish.movesDescription;
    }

    // Détection du gambit du roi
    if (detectKingsGambit(moves)) {
        return openingsData.kings_gambit.movesDescription;
    }

    // Détection du gambit de la dame
    if (detectQueensGambit(moves)) {
        return openingsData.queens_gambit.movesDescription;
    }

    // Détection de la défense sicilienne
    if (detectSicilianDefense(moves)) {
        return openingsData.sicilian.movesDescription;
    }

    // Ajouter la détection de la défense française
    if (detectFrenchDefense(moves)) {
        return openingsData.french.movesDescription;
    }

    return "Ouverture non reconnue";
};

export const getGuidedMove = (
    step: number, 
    selectedOpening: string, 
    moves: string[], 
    setGuideStep: (step: number) => void
): { from: Position; to: Position }[] | null => {
    // Arrêter le guidage après le 3ème mouvement (step > 5 car chaque mouvement a 2 étapes)
    if (step > 5) {
        setGuideStep(-1);
        return null;
    }

    if (!selectedOpening || selectedOpening === '' || !(selectedOpening in openingsData)) return null;
    
    const opening = selectedOpening as keyof typeof openingsData;
    const currentStep = openingsData[opening].steps[step];
    if (!currentStep) return null;

    const guideMoves: { from: Position; to: Position }[] = [];

    // Si c'est une étape avec des options
    if (currentStep.includes('Options :')) {
        const nextSteps = openingsData[opening].steps.slice(step + 1);
        
        // Si aucun coup n'a encore été joué pour cette option
        if (step >= moves.length) {
            // Montrer toutes les options disponibles
            for (const option of nextSteps) {
                if (!option.startsWith('   -')) break;
                const moveMatch = option.match(/([a-h])([1-8]) → ([a-h])([1-8])/);
                if (moveMatch) {
                    const [_, fromFile, fromRank, toFile, toRank] = moveMatch;
                    guideMoves.push({
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
        }
    } else {
        // Pour les coups normaux
        const moveMatch = currentStep.match(/([a-h])([1-8]) → ([a-h])([1-8])/);
        if (moveMatch) {
            const [_, fromFile, fromRank, toFile, toRank] = moveMatch;
            guideMoves.push({
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

    return guideMoves.length > 0 ? guideMoves : null;
}; 