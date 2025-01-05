const socket = io.connect(window.location.origin);

// Získání uživatelského jména a tokenu z sessionStorage
const username = sessionStorage.getItem('username');
const token = sessionStorage.getItem('token');

// Defaultní místnost (tuto logiku můžete upravit)
let currentRoomId = 'default-room';

// Při načtení stránky nastavíme uživatelské jméno a připojíme k místnosti
window.onload = () => {
    if (!username || !token) {
        alert('You must be logged in to access the chat.');
        window.location.href = '/';
    }
    document.getElementById('username-display').textContent = `Logged in as: ${username}`;
    joinRoom(currentRoomId);
};

// Funkce pro připojení do místnosti
async function joinRoom(roomId) {
    currentRoomId = roomId; // Uložíme aktuální místnost
    socket.emit('joinRoom', { roomId, username });

    socket.on('error', (data) => {
        alert(data.message); // Zobrazí chybu při připojení
    });

    // Přijímání zpráv
    socket.on('message', (data) => {
        const chatBox = document.getElementById('chat-box');
        const newMessage = document.createElement('div');
        newMessage.textContent = `${data.username}: ${data.content}`;
        chatBox.appendChild(newMessage);
    });
}

// Funkce pro odesílání zpráv
function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value;

    if (!content) {
        alert('Message cannot be empty!');
        return;
    }

    socket.emit('message', { roomId: currentRoomId, username, content });
    input.value = ''; // Vyčistí vstupní pole
}

// Funkce pro vytvoření nové místnosti
async function createRoom() {
    const roomName = document.getElementById('room-name').value;
    const isPrivate = document.getElementById('is-private').checked;
    const enableFilter = document.getElementById('enable-filter').checked;
    const allowedUsers = isPrivate ? prompt('Enter usernames (comma-separated):').split(',') : [];

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
            body: JSON.stringify({ name: roomName, isPrivate, enableFilter, allowedUsers }),
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

// Funkce pro odhlášení uživatele
function logout() {
    sessionStorage.clear();
    window.location.href = '/';
}
