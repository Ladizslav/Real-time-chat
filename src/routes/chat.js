const express = require('express');
const authenticateToken = require('../middleware/auth'); // Middleware pro autentizaci
const db = require('../db'); // Připojení k databázi

const router = express.Router(); // Inicializace routeru

// Vytvoření nové místnosti
router.post('/rooms', authenticateToken, async (req, res) => {
    const { name, isPrivate, enableFilter, allowedUsers } = req.body;
    const ownerId = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'Room name is required' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO chat_rooms (name, is_private, owner_id, enable_filter) VALUES (?, ?, ?, ?)',
            [name, isPrivate || false, ownerId, enableFilter || false]
        );

        const roomId = result.insertId;

        // Pokud je místnost soukromá, přidej povolené uživatele
        if (isPrivate && allowedUsers) {
            for (const userId of allowedUsers) {
                await db.execute('INSERT INTO allowed_users (room_id, user_id) VALUES (?, ?)', [roomId, userId.trim()]);
            }
        }

        res.status(201).json({ message: 'Room created successfully', roomId });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/rooms', authenticateToken, async (req, res) => {
    try {
        // Získáme veřejné místnosti a místnosti, kde je uživatel vlastníkem
        const [rooms] = await db.execute(
            `SELECT * FROM chat_rooms 
             WHERE is_private = 0 OR owner_id = ?`,
            [req.user.id]
        );

        res.status(200).json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Banování uživatele
router.post('/rooms/:roomId/ban', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body; // ID uživatele, kterého chceme zabanovat
    const ownerId = req.user.id; // ID vlastníka místnosti

    try {
        // Zkontrolujeme, zda je aktuální uživatel vlastníkem místnosti
        const [room] = await db.execute('SELECT * FROM chat_rooms WHERE id = ? AND owner_id = ?', [roomId, ownerId]);
        if (room.length === 0) {
            return res.status(403).json({ error: 'You are not the owner of this room.' });
        }

        // Přidání uživatele do tabulky banned_users
        await db.execute('INSERT INTO banned_users (room_id, user_id) VALUES (?, ?)', [roomId, userId]);
        res.status(200).json({ message: 'User banned successfully.' });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Export routeru
module.exports = router;