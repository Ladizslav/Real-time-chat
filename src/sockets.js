const profanityFilter = require('./utils/profanity');
const db = require('./db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected');

        // Připojení k místnosti
        socket.on('joinRoom', async ({ roomId, username }) => {
            try {
                // Zkontroluj, zda místnost existuje
                const [room] = await db.execute('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
                if (room.length === 0) {
                    socket.emit('error', { message: 'Room does not exist' });
                    return;
                }

                // Zamezíme opakovanému připojení do stejné místnosti
                const rooms = Array.from(socket.rooms);
                if (rooms.includes(roomId)) {
                    console.log(`${username} is already in room ${roomId}`);
                    return;
                }

                // Pokud je místnost soukromá, zkontroluj přístup uživatele
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

        // Příjem zpráv
        socket.on('message', async (data) => {
            const { roomId, username, content } = data;

            try {
                // Získání místnosti
                const [room] = await db.execute('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
                if (room.length === 0) {
                    socket.emit('error', { message: 'Room does not exist' });
                    return;
                }

                // Kontrola na Profanity Filter
                if (room[0].enable_filter) {
                    const containsProfanity = await profanityFilter.checkProfanity(content);
                    if (containsProfanity) {
                        socket.emit('profanityWarning', { message: 'Your message contains inappropriate language.' });

                        // Informujeme vlastníka místnosti o nevhodné zprávě
                        const ownerSocket = Array.from(io.sockets.sockets.values()).find(
                            (s) => s.username === room[0].owner_id
                        );
                        if (ownerSocket) {
                            ownerSocket.emit('profanityNotification', {
                                username,
                                message: `User ${username} tried to send a blocked message: "${content}"`,
                            });
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
