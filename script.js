// Script simple pour Black Dog Balades : login + création de compte

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const messageEl = document.getElementById("auth-message");

  function showMessage(text, type = "error") {
    messageEl.textContent = text;
    messageEl.classList.remove("error", "success");
    if (type) messageEl.classList.add(type);
  }

  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
      showMessage("Merci de remplir l'email et le mot de passe.");
      return;
    }
    try {
      await auth.signInWithEmailAndPassword(email, password);
      showMessage("Connexion réussie 🐾", "success");
    } catch (e) {
      console.error(e);
      showMessage(e.message || "Erreur de connexion.");
    }
  });

  registerBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
      showMessage("Merci de remplir l'email et le mot de passe.");
      return;
    }
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      showMessage("Compte créé 🎉 Vous pouvez maintenant vous connecter.", "success");
    } catch (e) {
      console.error(e);
      showMessage(e.message || "Erreur lors de la création du compte.");
    }
  });
});
