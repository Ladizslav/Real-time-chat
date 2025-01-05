router.post('/rooms', authenticateToken, async (req, res) => {
    const { name, isPrivate, enableFilter, allowedUsers } = req.body; // Přidáme allowedUsers jako pole uživatelů
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
                await db.execute('INSERT INTO allowed_users (room_id, user_id) VALUES (?, ?)', [roomId, userId]);
            }
        }

        res.status(201).json({ message: 'Room created successfully', roomId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
