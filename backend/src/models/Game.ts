import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
    whitePlayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    blackPlayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isGuestGame: {
        type: Boolean,
        default: false
    },
    moves: [{
        from: {
            x: Number,
            y: Number
        },
        to: {
            x: Number,
            y: Number
        },
        piece: String,
        timestamp: Date
    }],
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'abandoned'],
        default: 'pending'
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    timeControl: {
        initial: Number,
        increment: Number
    }
}, {
    timestamps: true
});

const Game = mongoose.model('Game', gameSchema);
export default Game; 