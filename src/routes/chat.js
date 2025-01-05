const express = require('express');
const authenticateToken = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Vytvoření nové chatovací místnosti
router.post('/rooms', authenticateToken, async (req, res) => {
    const { name, isPrivate } = req.body;
    const ownerId = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'Room name is required' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO chat_rooms (name, is_private, owner_id) VALUES (?, ?, ?)',
            [name, isPrivate || false, ownerId]
        );
        res.status(201).json({ message: 'Chat room created', roomId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Vrácení všech zpráv z místnosti
router.get('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
    const { roomId } = req.params;

    try {
        const [messages] = await db.execute(
            'SELECT messages.id, messages.content, messages.created_at, users.username FROM messages JOIN users ON messages.user_id = users.id WHERE room_id = ?',
            [roomId]
        );
        res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Vrácení všech místností
router.get('/rooms', authenticateToken, async (req, res) => {
    try {
        const [rooms] = await db.execute(
            'SELECT * FROM chat_rooms WHERE is_private = 0 OR owner_id = ?',
            [req.user.id]
        );
        res.status(200).json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
