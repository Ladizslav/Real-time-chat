const express = require('express');
const router = express.Router(); 
const authenticateToken = require('./middleware/auth');
const db = require('./db');


module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('joinRoom', async ({ roomId, username }) => {
            try {
                const [room] = await db.execute('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
                if (room.length === 0) {
                    socket.emit('error', { message: 'Room does not exist.' });
                    return;
                }
        
                const [banned] = await db.execute('SELECT * FROM banned_users WHERE room_id = ? AND user_id = ?', [roomId, username]);
                if (banned.length > 0) {
                    socket.emit('error', { message: 'You are banned from this room.' });
                    return;
                }
        
                socket.join(roomId);
                console.log(`${username} joined room ${roomId}`);
        
                // Poslat systémovou zprávu o připojení uživatele do místnosti
                io.to(roomId).emit('message', {
                    username: 'System',
                    content: `${username} has joined the room.`,
                });
        
                socket.emit('success', { message: 'Joined room successfully.' });
            } catch (error) {
                socket.emit('error', { message: 'An error occurred.' });
                console.error('Error joining room:', error);
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
                // Ověření existence místnosti
                const [room] = await db.execute('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
                if (room.length === 0) {
                    socket.emit('error', { message: 'Room does not exist' });
                    return;
                }
        
                // Filtr na vulgarity
                if (room[0].enable_filter) {
                    const containsProfanity = await profanityFilter.checkProfanity(content);
                    if (containsProfanity) {
                        socket.emit('profanityWarning', { message: 'Your message contains inappropriate language.' });
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
