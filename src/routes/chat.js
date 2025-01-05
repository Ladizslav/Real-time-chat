const express = require('express');
const authenticateToken = require('../middleware/auth'); // Middleware pro autentizaci
const db = require('../db'); // Připojení k databázi

const router = express.Router(); // Inicializace routeru

// Vytvoření nové místnosti
router.post('/rooms', authenticateToken, async (req, res) => {
    const { name, isPrivate, enableFilter, allowedUsers } = req.body; // Přidáme seznam povolených uživatelů
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

        // Pokud je místnost soukromá, přidejte povolené uživatele
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
// Export routeru
module.exports = router;