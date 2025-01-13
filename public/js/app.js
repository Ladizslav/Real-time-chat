const API_BASE = `${window.location.origin}/api/auth`;

async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    if (!username || !password) {
        alert('Username and password are required!');
        return;
    }

    try {
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
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Registration failed. Please try again.');
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        alert('Username and password are required!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            sessionStorage.setItem('username', username); 
            sessionStorage.setItem('token', data.token); 
            alert('Login successful!');
            window.location.href = '/chat.html'; 
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Login failed. Please try again.');
    }
}
