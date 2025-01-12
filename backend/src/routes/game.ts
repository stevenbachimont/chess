import express, { Request, Response } from 'express';
const router = express.Router();

// Get all games
router.get('/', (req: Request, res: Response) => {
    res.json({ 
        message: 'Get all games',
        games: []
    });
});

// Create new game
router.post('/', (req: Request, res: Response) => {
    const { type, timeControl } = req.body;
    res.json({ 
        message: 'Create new game',
        gameId: Date.now(),
        type,
        timeControl
    });
});

// Get game by id
router.get('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    res.json({ 
        message: 'Get game by id',
        gameId: id
    });
});

export default router; 