const profanityFilter = require('./utils/profanity');
const db = require('./db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('joinRoom', ({ roomId, username }) => {
            socket.join(roomId);
            console.log(`${username} joined room ${roomId}`);
        });

        socket.on('message', async (data) => {
            const { roomId, username, content } = data;

            const containsProfanity = await profanityFilter.checkProfanity(content);
            if (containsProfanity) {
                socket.emit('profanityWarning', { message: 'Your message contains inappropriate language.' });
                return;
            }

            io.to(roomId).emit('message', { username, content });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};
