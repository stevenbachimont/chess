import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.scss';

interface User {
    _id: string;
    username: string;
    createdAt: string;
    isAdmin: boolean;
    email: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    elo: number;
}

const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/auth/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                const error = await response.json();
                setError(error.message);
            }
        } catch (error) {
            setError('Erreur de connexion au serveur');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${username} ?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                setSuccessMessage(`Utilisateur ${username} supprimé avec succès`);
                fetchUsers(); // Rafraîchir la liste
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                const error = await response.json();
                setError(error.message);
                setTimeout(() => setError(null), 3000);
            }
        } catch (error) {
            setError('Erreur lors de la suppression');
            setTimeout(() => setError(null), 3000);
        }
    };

    return (
        <div className="admin-container">
            <h2>Panel Administrateur</h2>
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            <div className="users-list">
                <h3>Utilisateurs inscrits ({users.length})</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Nom d'utilisateur</th>
                            <th>Email</th>
                            <th>Date d'inscription</th>
                            <th>Parties</th>
                            <th>ELO</th>
                            <th>Rôle</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>{user.gamesPlayed} ({user.wins}V/{user.losses}D/{user.draws}N)</td>
                                <td>{user.elo}</td>
                                <td>{user.isAdmin ? 'Admin' : 'Utilisateur'}</td>
                                <td>
                                    {!user.isAdmin && (
                                        <button 
                                            className="delete-button"
                                            onClick={() => handleDeleteUser(user._id, user.username)}
                                        >
                                            Supprimer
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button 
                className="back-button"
                onClick={() => navigate('/')}
            >
                Retour au menu
            </button>
        </div>
    );
};

export default AdminPanel; 