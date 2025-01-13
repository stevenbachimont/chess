import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

app.use(cors({
    origin: 'http://localhost:5173', // URL de votre frontend Vite
    credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/chessburger';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err: Error) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

console.log('Configuration email:', {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD?.substring(0, 3) + '...' // Ne pas logger le mot de passe complet
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('MongoDB URI:', MONGODB_URI);
}); 