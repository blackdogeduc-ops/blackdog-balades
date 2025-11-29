const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const errorMessage = document.getElementById("error-message");

signupBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        errorMessage.textContent = "Merci de remplir l'email et le mot de passe.";
        return;
    }
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        errorMessage.textContent = "✔ Compte créé !";
    } catch (error) {
        errorMessage.textContent = error.message;
    }
});

loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        errorMessage.textContent = "Merci de remplir l'email et le mot de passe.";
        return;
    }
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        errorMessage.textContent = "✔ Connexion réussie !";
    } catch (error) {
        errorMessage.textContent = error.message;
    }
});
