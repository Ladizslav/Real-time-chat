const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const db = require('../db');


router.post('/rooms', authenticateToken, async (req, res) => {
    const { name, isPrivate, enableFilter, allowedUsers } = req.body;
    console.log('Request body:', req.body);
    console.log('User ID:', req.user);

    if (!name) {
        return res.status(400).json({ error: 'Room name is required' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO chat_rooms (name, is_private, owner_id, enable_filter) VALUES (?, ?, ?, ?)',
            [name, isPrivate || false, req.user.id, enableFilter || false]
        );

        const roomId = result.insertId;

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
router.post('/rooms/:roomId/ban', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;
    const ownerId = req.user.id;

    try {
        const [room] = await db.execute('SELECT * FROM chat_rooms WHERE id = ? AND owner_id = ?', [roomId, ownerId]);
        if (room.length === 0) {
            return res.status(403).json({ error: 'You are not the owner of this room.' });
        }

        await db.execute('INSERT INTO banned_users (room_id, user_id) VALUES (?, ?)', [roomId, userId]);
        res.status(200).json({ message: 'User banned successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.get('/messages', authenticateToken, async (req, res) => {
    try {
        const [messages] = await db.execute(`
            SELECT * FROM messages
        `);
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching all messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Vrácení všech zpráv vybraného uživatele
router.get('/messages/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const [messages] = await db.execute(`
            SELECT * FROM messages WHERE user_id = ?
        `, [userId]);
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching user messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Vrácení všech zpráv vybrané chat room
router.get('/messages/room/:roomId', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    try {
        const [messages] = await db.execute(`
            SELECT * FROM messages WHERE room_id = ?
        `, [roomId]);
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching room messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Vrácení všech zpráv obsahujících vybrané slovo (case-insensitive)
router.get('/messages/search', authenticateToken, async (req, res) => {
    const { keyword } = req.query; // Query parameter ?keyword=value
    if (!keyword) {
        return res.status(400).json({ error: 'Keyword query parameter is required' });
    }
    try {
        const [messages] = await db.execute(`
            SELECT * FROM messages WHERE LOWER(content) LIKE ?
        `, [`%${keyword.toLowerCase()}%`]);
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages by keyword:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;