import { Server, Socket } from 'socket.io';
import mongoose, { Document, Types } from 'mongoose';
import Game from '../models/Game';

interface GameMove {
    gameId: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    piece: string;
}

interface GameRoom {
    gameId: string;
    whiteId: string;
    blackId: string;
    spectators: string[];
}

interface PopulatedGame extends Document {
    whitePlayer: {
        _id: Types.ObjectId;
        username: string;
    };
    blackPlayer?: {
        _id: Types.ObjectId;
        username: string;
    };
    status: string;
    moves: Array<{
        from: { x: number; y: number };
        to: { x: number; y: number };
        piece: string;
        timestamp: Date;
    }>;
    winner?: Types.ObjectId;
}

const gameRooms = new Map<string, GameRoom>();

export const handleGameSocket = (io: Server, socket: Socket): void => {
    // Rejoindre une partie
    socket.on('joinGame', async ({ gameId, userId }) => {
        try {
            const game = await Game.findById(gameId)
                .populate<PopulatedGame>('whitePlayer blackPlayer', 'username');
            
            if (!game) {
                socket.emit('error', 'Partie non trouvée');
                return;
            }

            // Créer ou récupérer la room
            let room = gameRooms.get(gameId);
            if (!room) {
                room = {
                    gameId,
                    whiteId: game.whitePlayer._id.toString(),
                    blackId: game.blackPlayer ? game.blackPlayer._id.toString() : '',
                    spectators: []
                };
                gameRooms.set(gameId, room);
            }

            // Ajouter le joueur à la room
            socket.join(gameId);

            // Notifier les autres joueurs
            socket.to(gameId).emit('playerJoined', {
                username: game.whitePlayer.username,
                color: userId === room.whiteId ? 'white' : 'black'
            });

            // Envoyer l'état actuel de la partie
            socket.emit('gameState', {
                game,
                color: userId === room.whiteId ? 'white' : 'black'
            });

        } catch (error) {
            socket.emit('error', 'Erreur lors de la connexion à la partie');
        }
    });

    // Gérer un mouvement
    socket.on('move', async (moveData: GameMove) => {
        try {
            const { gameId, from, to, piece } = moveData;
            const room = gameRooms.get(gameId);

            if (!room) {
                socket.emit('error', 'Room non trouvée');
                return;
            }

            // Sauvegarder le mouvement dans la base de données
            const game = await Game.findById(gameId);
            if (!game) {
                socket.emit('error', 'Partie non trouvée');
                return;
            }

            game.moves.push({
                from,
                to,
                piece,
                timestamp: new Date()
            });

            await game.save();

            // Diffuser le mouvement aux autres joueurs
            socket.to(gameId).emit('moveMade', moveData);

        } catch (error) {
            socket.emit('error', 'Erreur lors du mouvement');
        }
    });

    // Gérer l'abandon
    socket.on('resign', async ({ gameId, userId }) => {
        try {
            const game = await Game.findById(gameId);
            if (!game) {
                socket.emit('error', 'Partie non trouvée');
                return;
            }

            game.status = 'completed';
            game.winner = userId === game.whitePlayer._id.toString() && game.blackPlayer 
                ? game.blackPlayer._id 
                : game.whitePlayer._id;
            
            await game.save();

            io.to(gameId).emit('gameEnded', {
                reason: 'resignation',
                winner: game.winner
            });

        } catch (error) {
            socket.emit('error', 'Erreur lors de l\'abandon');
        }
    });

    // Gérer la déconnexion
    socket.on('disconnect', () => {
        // Nettoyer les rooms si nécessaire
        gameRooms.forEach((room, gameId) => {
            if (room.spectators.includes(socket.id)) {
                room.spectators = room.spectators.filter(id => id !== socket.id);
                if (room.spectators.length === 0) {
                    gameRooms.delete(gameId);
                }
            }
        });
    });

    // Chat en jeu
    socket.on('sendMessage', ({ gameId, message, username }) => {
        io.to(gameId).emit('message', {
            username,
            message,
            timestamp: new Date()
        });
    });
}; 