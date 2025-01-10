import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            res.status(400).json({ 
                message: 'Email ou nom d\'utilisateur déjà utilisé' 
            });
            return;
        }

        // Créer le nouvel utilisateur
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Générer le token
        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                elo: user.elo
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            return;
        }

        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                elo: user.elo
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
}; 