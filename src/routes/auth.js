const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);

    res.json({ message: 'User registered successfully' });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, users[0].password_hash);
    if (!valid) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', userId: users[0].id });
});

module.exports = router;
