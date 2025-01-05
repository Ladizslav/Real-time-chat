require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// WebSocket events
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (data) => {
        socket.join(data.room);
        console.log(`${data.user} joined room ${data.room}`);
    });

    socket.on('message', async (data) => {
        // Insert message into DB
        const [result] = await db.execute(
            'INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)',
            [data.roomId, data.userId, data.content]
        );

        io.to(data.room).emit('message', {
            userId: data.userId,
            content: data.content,
            id: result.insertId
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Server start
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
