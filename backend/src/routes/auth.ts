import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User';
import auth from '../middleware/auth';

const router: Router = express.Router();

// Route de test
router.get('/test', (req: Request, res: Response) => {
    res.json({ 
        message: 'Auth API is working!',
        timestamp: new Date().toISOString()
    });
});

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password, email, adminCode } = req.body;
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris" });
            return;
        }

        const user = new User({
            username,
            password,
            email,
            isAdmin: adminCode === 'CHESSBURGER_ADMIN_2024'
        });

        await user.save();

        const token = jwt.sign(
            { id: user._id, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'Utilisateur créé avec succès',
            token,
            username: user.username,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
            return;
        }

        const token = jwt.sign(
            { id: user._id, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({ token, username: user.username, isAdmin: user.isAdmin });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Liste des utilisateurs
router.get('/users', auth, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user?.id);
        if (!user?.isAdmin) {
            res.status(403).json({ message: "Accès non autorisé" });
            return;
        }

        const users = await User.find({}, { password: 0 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Supprimer un utilisateur (admin seulement)
router.delete('/users/:id', auth, async (req: Request, res: Response): Promise<void> => {
    try {
        const admin = await User.findById(req.user?.id);
        if (!admin?.isAdmin) {
            res.status(403).json({ message: "Accès non autorisé" });
            return;
        }

        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            res.status(404).json({ message: "Utilisateur non trouvé" });
            return;
        }

        // Empêcher la suppression d'un admin par un autre admin
        if (userToDelete.isAdmin) {
            res.status(403).json({ message: "Impossible de supprimer un administrateur" });
            return;
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

export default router; 