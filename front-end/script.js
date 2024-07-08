console.log("Scripting");
document.addEventListener('DOMContentLoaded', function() {
    // Get the login and sign-up buttons
    const loginButton = document.getElementById('loginButton');
    const signUpButton = document.querySelector(".btn");

    // Add click event listeners
    loginButton.addEventListener('click', function() {
        window.location.href = 'login.html';
    });

    signUpButton.addEventListener('click', function() {
        window.location.href = 'login.html';
    });
});