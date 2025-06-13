document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const login = document.getElementById("login-email").value;
    const password = document.getElementById("login-pass").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password })
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem("userLoggedIn", "true");

        window.location.href = "/index.html";
    } else {
        alert(data.message); 
    }
});
