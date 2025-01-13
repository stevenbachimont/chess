import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User';
import auth from '../middleware/auth';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router: Router = express.Router();

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    },
    debug: true // Pour voir les logs détaillés
});

// Vérifier la configuration au démarrage
transporter.verify((error, success) => {
    if (error) {
        console.error('Erreur de configuration SMTP:', error);
    } else {
        console.log('Serveur SMTP prêt à envoyer des emails');
    }
});

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

// Demande de réinitialisation de mot de passe
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        console.log('Email reçu:', email);

        const user = await User.findOne({ email });
        if (!user) {
            console.log('Utilisateur non trouvé pour cet email');
            res.status(404).json({ message: "Aucun compte associé à cet email" });
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        console.log('Token généré:', resetToken);

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        const mailOptions = {
            from: {
                name: 'Chessburger',
                address: process.env.EMAIL_USER as string
            },
            to: user.email,
            subject: 'Réinitialisation de mot de passe - Chessburger',
            html: `
                <h1>Réinitialisation de votre mot de passe</h1>
                <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                <p>Cliquez sur le lien suivant pour définir un nouveau mot de passe :</p>
                <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
                <p>Ce lien expirera dans 1 heure.</p>
                <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            `
        };

        console.log('Tentative d\'envoi d\'email avec les options:', mailOptions);

        try {
            await transporter.sendMail(mailOptions);
            console.log('Email envoyé avec succès');
            res.json({ message: "Email de réinitialisation envoyé" });
        } catch (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email:', emailError);
            res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
        }
    } catch (error) {
        console.error('Erreur générale:', error);
        res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
    }
});

// Réinitialisation du mot de passe avec le token
router.post('/reset-password/:token', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            res.status(400).json({ message: "Token invalide ou expiré" });
            return;
        }

        // Mettre à jour le mot de passe
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la réinitialisation" });
    }
});

export default router; 