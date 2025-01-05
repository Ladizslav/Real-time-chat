const express = require('express');
const authenticateToken = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Vytvoření nové místnosti
router.post('/rooms', authenticateToken, async (req, res) => {
    const { name, isPrivate, enableFilter } = req.body;
    const ownerId = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'Room name is required' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO chat_rooms (name, is_private, owner_id, enable_filter) VALUES (?, ?, ?, ?)',
            [name, isPrivate || false, ownerId, enableFilter || false]
        );
        res.status(201).json({ message: 'Room created successfully', roomId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
