import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Game from '../models/Game';
import { AuthRequest } from '../middleware/auth';

export const createGame = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { timeControl } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: 'Non autorisé' });
            return;
        }

        const game = new Game({
            whitePlayer: userId,
            timeControl: {
                initial: timeControl.initial || 600,
                increment: timeControl.increment || 0
            },
            status: 'pending'
        });

        await game.save();
        res.status(201).json({
            message: 'Partie créée avec succès',
            gameId: game._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création de la partie' });
    }
};

export const joinGame = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { gameId } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: 'Non autorisé' });
            return;
        }

        const game = await Game.findById(gameId);
        
        if (!game) {
            res.status(404).json({ message: 'Partie non trouvée' });
            return;
        }

        if (game.status !== 'pending') {
            res.status(400).json({ message: 'Cette partie n\'est pas disponible' });
            return;
        }

        if (game.whitePlayer.toString() === userId) {
            res.status(400).json({ message: 'Vous ne pouvez pas jouer contre vous-même' });
            return;
        }

        game.blackPlayer = new Types.ObjectId(userId);
        game.status = 'active';
        await game.save();

        res.json({
            message: 'Vous avez rejoint la partie',
            game
        });

    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la tentative de rejoindre la partie' });
    }
};

export const getActiveGames = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: 'Non autorisé' });
            return;
        }

        const games = await Game.find({
            $or: [
                { whitePlayer: userId },
                { blackPlayer: userId }
            ],
            status: 'active'
        }).populate('whitePlayer blackPlayer', 'username elo');

        res.json(games);

    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des parties' });
    }
};

export const getOpenGames = async (_req: Request, res: Response): Promise<void> => {
    try {
        const games = await Game.find({
            status: 'pending'
        }).populate('whitePlayer', 'username elo');

        res.json(games);

    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des parties ouvertes' });
    }
}; 