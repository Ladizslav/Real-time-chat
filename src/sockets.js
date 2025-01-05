const profanityFilter = require('./utils/profanity');
const db = require('./db');
const express = require('express');
const router = express.Router();
const authenticateToken = require('./middleware/auth'); // Adjust the path as needed

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected');

        // Připojení k místnosti
        socket.on('joinRoom', async ({ roomId, username }) => {
            try {
                // Zkontrolujeme, zda místnost existuje
                const [room] = await db.execute('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
                if (room.length === 0) {
                    socket.emit('error', { message: 'Room does not exist.' });
                    return;
                }
        
                // Pokud je místnost soukromá, zkontrolujeme seznam povolených uživatelů
                if (room[0].is_private) {
                    const [allowedUsers] = await db.execute(
                        'SELECT * FROM allowed_users WHERE room_id = ? AND user_id = ?',
                        [roomId, username]
                    );
        
                    if (allowedUsers.length === 0) {
                        socket.emit('error', { message: 'Access denied. This room is private.' });
                        return;
                    }
                }
        
                // Připojení k místnosti
                socket.join(roomId);
                console.log(`${username} joined room ${roomId}`);
                io.to(roomId).emit('message', { username, content: `${username} has joined the room.` });
            } catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', { message: 'An error occurred while joining the room.' });
            }
        });
        
        
        router.post('/rooms/:roomId/ban', authenticateToken, async (req, res) => {
            const { roomId } = req.params;
            const { userId } = req.body;
            const ownerId = req.user.id;
        
            try {
                // Zkontrolujeme, zda aktuální uživatel je vlastníkem místnosti
                const [room] = await db.execute('SELECT * FROM chat_rooms WHERE id = ? AND owner_id = ?', [roomId, ownerId]);
                if (room.length === 0) {
                    return res.status(403).json({ error: 'You are not the owner of this room.' });
                }
        
                // Přidání uživatele do seznamu zabanovaných
                await db.execute('INSERT INTO banned_users (room_id, user_id) VALUES (?, ?)', [roomId, userId]);
        
                // Odpojení uživatele, pokud je aktuálně v místnosti
                const socketsToKick = Array.from(io.sockets.sockets.values()).filter(
                    (socket) => socket.rooms.has(roomId) && socket.username === userId
                );
        
                socketsToKick.forEach((socket) => {
                    socket.leave(roomId);
                    socket.emit('error', { message: 'You have been banned from this room.' });
                });
        
                res.status(200).json({ message: 'User banned successfully and kicked from the room.' });
            } catch (error) {
                console.error('Error banning user:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // Opustit místnost
        socket.on('leaveRoom', ({ roomId, username }) => {
            try {
                socket.leave(roomId);
                console.log(`${username} left room ${roomId}`);
                io.to(roomId).emit('message', { username, content: `${username} has left the room.` });
            } catch (error) {
                console.error(`Error leaving room ${roomId}:`, error);
            }
        });

        // Příjem zpráv
        socket.on('message', async (data) => {
            const { roomId, username, content } = data;
        
            try {
                const [room] = await db.execute('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
                if (room.length === 0) {
                    socket.emit('error', { message: 'Room does not exist' });
                    return;
                }
        
                if (room[0].enable_filter) {
                    const containsProfanity = await profanityFilter.checkProfanity(content);
                    if (containsProfanity) {
                        socket.emit('profanityWarning', { message: 'Your message contains inappropriate language.' });
        
                        // Odeslání notifikace vlastníkovi místnosti
                        const [owner] = await db.execute('SELECT username FROM users WHERE id = ?', [room[0].owner_id]);
                        if (owner.length > 0) {
                            const ownerSocket = Array.from(io.sockets.sockets.values()).find(
                                (s) => s.username === owner[0].username
                            );
        
                            if (ownerSocket) {
                                ownerSocket.emit('profanityNotification', {
                                    username,
                                    content,
                                    message: `Blocked message from user ${username}: "${content}"`,
                                });
                            } else {
                                console.log(`Owner socket for ${owner[0].username} not found.`);
                            }
                        }
        
                        return;
                    }
                }
        
                // Odeslání zprávy do místnosti
                io.to(roomId).emit('message', { username, content });
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });
        
        // Odpojení klienta
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};
