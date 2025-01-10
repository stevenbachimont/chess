import { Router } from 'express';
import { auth } from '../middleware/auth';
import { 
    createGame, 
    joinGame, 
    getActiveGames, 
    getOpenGames 
} from '../controllers/gameController';

const router = Router();

router.post('/create', auth, createGame);
router.post('/join/:gameId', auth, joinGame);
router.get('/active', auth, getActiveGames);
router.get('/open', getOpenGames);

export default router; 