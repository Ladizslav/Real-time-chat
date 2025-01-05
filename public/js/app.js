const API_BASE = `${window.location.origin}/api/auth`;

async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
        alert('User registered successfully!');
    } else {
        alert(`Error: ${data.error}`);
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
        sessionStorage.setItem('token', data.token);
        alert('Login successful!');
        window.location.href = '/chat.html';
    } else {
        alert(`Error: ${data.error}`);
    }
}
