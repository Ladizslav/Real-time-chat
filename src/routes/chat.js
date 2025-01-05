const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/rooms', async (req, res) => {
    const { name, isPrivate, ownerId } = req.body;

    const [result] = await db.execute(
        'INSERT INTO chat_rooms (name, is_private, owner_id) VALUES (?, ?, ?)',
        [name, isPrivate, ownerId]
    );

    res.json({ roomId: result.insertId });
});

router.get('/messages', async (req, res) => {
    const { roomId } = req.query;

    const [messages] = await db.execute('SELECT * FROM messages WHERE room_id = ?', [roomId]);
    res.json(messages);
});

module.exports = router;
