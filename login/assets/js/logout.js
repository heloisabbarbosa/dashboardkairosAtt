document.getElementById("logout-button").addEventListener("click", (event) => {
    event.preventDefault(); 

    localStorage.removeItem("userLoggedIn"); 

    window.location.href = "/login/login.html"; 
});
