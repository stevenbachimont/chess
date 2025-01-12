import express, { Request, Response } from 'express';
const router = express.Router();

// Route de test
router.get('/test', (req: Request, res: Response) => {
    res.json({ 
        message: 'Auth API is working!',
        timestamp: new Date().toISOString()
    });
});

// Register
router.post('/register', (req: Request, res: Response) => {
    const { username, password } = req.body;
    res.json({ 
        message: 'Register endpoint',
        username
    });
});

// Login
router.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    res.json({ 
        message: 'Login endpoint',
        username
    });
});

export default router; 