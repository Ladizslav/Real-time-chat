const API_BASE_URL = "http://localhost/api";

// Elements
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const chatDiv = document.getElementById("chat");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-btn");
const messagesDiv = document.getElementById("messages");

let websocket;

// Helper: Display messages
function displayMessage(content, sender = "Server") {
    const messageElement = document.createElement("div");
    messageElement.textContent = `${sender}: ${content}`;
    messagesDiv.appendChild(messageElement);
}

// Helper: Switch screens
function switchScreen(screen) {
    if (screen === "chat") {
        document.getElementById("auth").style.display = "none";
        chatDiv.style.display = "block";
    } else {
        document.getElementById("auth").style.display = "block";
        chatDiv.style.display = "none";
    }
}

// Login event
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.success) {
        alert("Login successful!");
        switchScreen("chat");
        setupWebSocket(data.token);
    } else {
        alert("Login failed: " + data.message);
    }
});

// Register event
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;

    const response = await fetch(`${API_BASE_URL}/auth.php?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.success) {
        alert("Registration successful! Please login.");
    } else {
        alert("Registration failed: " + data.message);
    }
});

// WebSocket setup
function setupWebSocket(token) {
    websocket = new WebSocket(`ws://localhost:8080?token=${token}`);

    websocket.onopen = () => {
        displayMessage("Connected to the server!");
    };

    websocket.onmessage = (event) => {
        const { sender, content } = JSON.parse(event.data);
        displayMessage(content, sender);
    };

    websocket.onclose = () => {
        displayMessage("Disconnected from the server.");
    };
}

// Send message event
sendButton.addEventListener("click", () => {
    const message = messageInput.value;
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ content: message }));
        displayMessage(message, "You");
        messageInput.value = "";
    } else {
        alert("Unable to send message. WebSocket is not connected.");
    }
});
