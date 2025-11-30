const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const msg = document.getElementById("message");

// ===== CRÉATION DE COMPTE =====
document.getElementById("signup-btn").onclick = async () => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
        msg.textContent = "Merci de remplir l’email et le mot de passe.";
        return;
    }

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        msg.textContent = "Compte créé ✔";
    } catch (e) {
        msg.textContent = e.message;
    }
};

// ===== CONNEXION =====
document.getElementById("login-btn").onclick = async () => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
        msg.textContent = "Merci de remplir l’email et le mot de passe.";
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        window.location = "home.html";
    } catch (e) {
        msg.textContent = e.message;
    }
};
