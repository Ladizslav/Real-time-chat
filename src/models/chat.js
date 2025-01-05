const socket = io.connect(window.location.origin);

function sendMessage() {
    const content = document.getElementById('chat-input').value;
    const roomId = 'default-room'; // Replace with dynamic room ID
    const userId = sessionStorage.getItem('userId');

    socket.emit('message', { roomId, userId, content });
    document.getElementById('chat-input').value = '';
}

socket.on('message', (data) => {
    const chatBox = document.getElementById('chat-box');
    const message = document.createElement('div');
    message.textContent = `${data.userId}: ${data.content}`;
    chatBox.appendChild(message);
});
