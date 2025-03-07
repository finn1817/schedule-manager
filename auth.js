// Simple username/password authentication
document.getElementById('login-btn').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    
    // simple hardcoded credentials for marks login (whatever he wants it to be) - I can always improve this later
    if (username === "admin" && password === "password") {
        // a redirect to dashboard after successful login
        window.location.href = "dashboard.html";
    } else {
        errorElement.textContent = "Invalid username or password";
    }
});
