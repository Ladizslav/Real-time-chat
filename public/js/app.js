const socket = io.connect('http://localhost:8080');

socket.on('message', (data) => {
    const chatBox = document.getElementById('chat-box');
    const newMessage = document.createElement('div');
    newMessage.textContent = `${data.userId}: ${data.content}`;
    chatBox.appendChild(newMessage);
});

function sendMessage(roomId, userId, content) {
    socket.emit('message', { roomId, userId, content });
}
