const socket = io.connect(window.location.origin);

// Získání uživatelského jména
const username = sessionStorage.getItem('username');
const token = sessionStorage.getItem('token');
const roomId = 'default-room'; // Defaultní místnost, můžete přidat dynamické ID

// Připojení k místnosti
socket.emit('joinRoom', { roomId, username });

// Zobrazení přihlášeného uživatele
window.onload = () => {
    if (!username || !token) {
        alert('You must be logged in to access the chat.');
        window.location.href = '/'; // Přesměruje zpět na přihlašovací stránku
    }
    document.getElementById('username-display').textContent = `Logged in as: ${username}`;
};

// Odesílání zpráv
function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value;

    if (!content) {
        alert('Message cannot be empty!');
        return;
    }

    socket.emit('message', { roomId, username, content });
    input.value = ''; // Vyčistí vstupní pole
}

// Příjem zpráv
socket.on('message', (data) => {
    const chatBox = document.getElementById('chat-box');
    const newMessage = document.createElement('div');
    newMessage.textContent = `${data.username}: ${data.content}`;
    chatBox.appendChild(newMessage);
});

// Upozornění na nevhodný obsah
socket.on('profanityWarning', (data) => {
    alert(data.message); // Zobrazí upozornění uživateli
});

// Vytvoření nové místnosti
async function createRoom() {
    const roomName = document.getElementById('room-name').value;
    const isPrivate = document.getElementById('is-private').checked;
    const enableFilter = document.getElementById('enable-filter').checked;

    if (!roomName) {
        alert('Room name is required!');
        return;
    }

    try {
        const response = await fetch(`${window.location.origin}/api/chat/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: roomName, isPrivate, enableFilter }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Room created successfully!');
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error creating room:', error);
    }
}

// Odhlášení uživatele
function logout() {
    sessionStorage.clear();
    window.location.href = '/';
}
