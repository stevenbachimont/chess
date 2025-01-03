declare module '*.json' {
    const openings: {
        italian: Opening;
        spanish: Opening;
        kings_gambit: Opening;
        queens_gambit: Opening;
        sicilian: Opening;
        french: Opening;
        caro_kann: Opening;
        kings_indian: Opening;
        dutch: Opening;
    };
    export default openings;
}

interface Opening {
    name: string;
    steps: string[];
    description: string;
    movesDescription: string;
}

export type OpeningKey = keyof typeof openings | ''; 