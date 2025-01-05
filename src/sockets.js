const db = require('./db');
const profanityFilter = require('./utils/profanity');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('joinRoom', ({ roomId, userId }) => {
            socket.join(roomId);
            console.log(`User ${userId} joined room ${roomId}`);
        });

        socket.on('message', async (data) => {
            const { roomId, userId, content } = data;

            // Profanity check
            const containsProfanity = await profanityFilter.checkProfanity(content);
            if (containsProfanity) {
                io.to(roomId).emit('profanityWarning', { userId, message: 'Your message was blocked by the profanity filter.' });
                return;
            }

            // Uložení zprávy do databáze
            try {
                await db.execute('INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)', [
                    roomId,
                    userId,
                    content,
                ]);
                io.to(roomId).emit('message', { userId, content });
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};
