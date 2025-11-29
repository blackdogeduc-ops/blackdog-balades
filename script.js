// Black Dog Balades - script principal
// Hypothèse : un utilisateur = un chien (simplification pour démarrer)

// ==================== UTILITAIRES ====================

function formatDateISO(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche
  const diff = (day === 0 ? -6 : 1) - day; // Lundi comme début
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

const SLOT_LABELS = [
  "Matin",
  "Début d’après-midi",
  "Fin d’après-midi",
  "Soirée"
];

// ==================== ÉTAT GLOBAL ====================

let currentUser = null;      // firebase.User
let currentUserDoc = null;   // document utilisateur (FireStore)
let currentDogDoc = null;    // document chien
let weekSlots = {};          // { 'YYYY-MM-DD': { label: slotDocId | null } }
let currentGroupId = null;   // pour le chat

// ==================== NAVIGATION ====================

const screens = document.querySelectorAll(".screen");
const nav = document.getElementById("main-nav");
const navButtons = document.querySelectorAll(".nav-btn");

function showScreen(id) {
  screens.forEach(s => s.classList.add("hidden"));
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");
  navButtons.forEach(btn => {
    if (btn.dataset.target === id) btn.classList.add("active");
    else if (btn.classList.contains("nav-btn")) btn.classList.remove("active");
  });
}

// ==================== AUTH ====================

const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const btnLogin = document.getElementById("btn-login");
const btnRegister = document.getElementById("btn-register");
const authMessage = document.getElementById("auth-message");
const btnLogout = document.getElementById("btn-logout");

btnLogin.addEventListener("click", async () => {
  authMessage.textContent = "";
  try {
    await auth.signInWithEmailAndPassword(authEmail.value.trim(), authPassword.value.trim());
  } catch (e) {
    authMessage.textContent = e.message;
  }
});

btnRegister.addEventListener("click", async () => {
  authMessage.textContent = "";
  try {
    const cred = await auth.createUserWithEmailAndPassword(
      authEmail.value.trim(),
      authPassword.value.trim()
    );
    // créer un doc utilisateur et un chien vide
    await db.collection("users").doc(cred.user.uid).set({
      email: cred.user.email,
      role: "member",
      approved: false,
      city: "",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await db.collection("dogs").doc(cred.user.uid).set({
      ownerId: cred.user.uid,
      name: "Mon chien",
      profileCode: 2, // polyvalent par défaut
      city: "",
      color: "#5CD673", // vert
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    authMessage.textContent = "Compte créé. En attente de validation par l'admin.";
  } catch (e) {
    authMessage.textContent = e.message;
  }
});

btnLogout.addEventListener("click", async () => {
  await auth.signOut();
});

// Observer l'état de connexion
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (!user) {
    // déconnecté
    nav.classList.add("hidden");
    document.getElementById("screen-auth").classList.add("active");
    showScreen("screen-auth");
    return;
  }

  // connecté
  nav.classList.remove("hidden");
  document.getElementById("screen-auth").classList.remove("active");
  await loadUserData(user.uid);
  buildWeekGrid();
  loadGroups();
  showScreen("screen-home");
});

// ==================== CHARGEMENT DES DONNÉES UTILISATEUR ====================

async function loadUserData(uid) {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    // Au cas où
    await userRef.set({
      email: currentUser.email,
      role: "member",
      approved: false,
      city: "",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    currentUserDoc = (await userRef.get()).data();
  } else {
    currentUserDoc = userSnap.data();
  }

  const dogRef = db.collection("dogs").doc(uid);
  const dogSnap = await dogRef.get();
  if (dogSnap.exists) {
    currentDogDoc = dogSnap.data();
  } else {
    currentDogDoc = null;
  }

  // mise à jour accueil
  const homeInfo = document.getElementById("home-user-info");
  homeInfo.textContent = `Connecté en tant que ${currentUserDoc.email || ""}`;

  const warning = document.getElementById("home-approval-warning");
  if (currentUserDoc.approved) warning.classList.add("hidden");
  else warning.classList.remove("hidden");

  // navigation admin
  const btnAdminNav = document.getElementById("btn-admin-nav");
  if (currentUserDoc.role === "admin") {
    btnAdminNav.classList.remove("hidden");
  } else {
    btnAdminNav.classList.add("hidden");
  }

  renderProfile();
  if (currentUserDoc.role === "admin") {
    loadAdmin();
  }
}

// ==================== DISPONIBILITÉS SEMAINE ====================

const weekContainer = document.getElementById("week-container");

async function buildWeekGrid() {
  weekContainer.innerHTML = "";
  weekSlots = {};

  const today = new Date();
  const start = getStartOfWeek(today); // lundi
  const userId = currentUser.uid;

  // Charger les slots de la semaine pour ce chien
  const startStr = formatDateISO(start);
  const end = addDays(start, 6);
  const endStr = formatDateISO(end);

  const slotsSnap = await db.collection("slots")
    .where("ownerId", "==", userId)
    .where("date", ">=", startStr)
    .where("date", "<=", endStr)
    .get();

  slotsSnap.forEach(doc => {
    const data = doc.data();
    const key = data.date;
    if (!weekSlots[key]) weekSlots[key] = {};
    weekSlots[key][data.timeSlot] = doc.id;
  });

  const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    const dateStr = formatDateISO(d);
    const dayBlock = document.createElement("div");
    dayBlock.className = "day-block";

    const header = document.createElement("div");
    header.className = "day-header";
    const nameSpan = document.createElement("span");
    nameSpan.className = "day-name";
    nameSpan.textContent = dayNames[i];
    const dateSpan = document.createElement("span");
    dateSpan.className = "day-date";
    dateSpan.textContent = dateStr;
    header.appendChild(nameSpan);
    header.appendChild(dateSpan);

    const slotGrid = document.createElement("div");
    slotGrid.className = "slot-grid";

    SLOT_LABELS.forEach(label => {
      const btn = document.createElement("button");
      btn.className = "slot-btn";
      btn.textContent = label;
      btn.dataset.date = dateStr;
      btn.dataset.label = label;

      const selected = weekSlots[dateStr] && weekSlots[dateStr][label];
      if (selected) btn.classList.add("selected");

      btn.addEventListener("click", () => toggleSlot(dateStr, label, btn));
      slotGrid.appendChild(btn);
    });

    dayBlock.appendChild(header);
    dayBlock.appendChild(slotGrid);
    weekContainer.appendChild(dayBlock);
  }
}

async function toggleSlot(dateStr, label, btnEl) {
  if (!currentUserDoc || !currentDogDoc) return;
  const userId = currentUser.uid;
  const dogId = currentUser.uid; // 1 user = 1 dog (docId = uid)

  // si déjà sélectionné, supprimer le slot
  const existingId = weekSlots[dateStr] && weekSlots[dateStr][label];
  if (existingId) {
    await db.collection("slots").doc(existingId).delete();
    btnEl.classList.remove("selected");
    delete weekSlots[dateStr][label];
    return;
  }

  // créer un slot
  const newDoc = await db.collection("slots").add({
    ownerId: userId,
    dogId: dogId,
    date: dateStr,
    timeSlot: label,
    locked: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    city: currentDogDoc.city || currentUserDoc.city || ""
  });

  if (!weekSlots[dateStr]) weekSlots[dateStr] = {};
  weekSlots[dateStr][label] = newDoc.id;
  btnEl.classList.add("selected");
}

// ==================== PROFIL & COMPATIBILITÉ (simplifié) ====================

const profileDogContainer = document.getElementById("profile-dog");
const compatibleDogsContainer = document.getElementById("compatible-dogs");

// ici, on ne recode pas tout l'algorithme de compatibilité pour le front,
// on affiche surtout les autres chiens avec leur pastille couleur.
// La vraie logique de compatibilité est plutôt côté back (Cloud Functions).

async function renderProfile() {
  profileDogContainer.innerHTML = "";
  compatibleDogsContainer.innerHTML = "";

  if (!currentDogDoc) {
    profileDogContainer.innerHTML = "<p>Pas de chien enregistré.</p>";
    return;
  }

  const dogDiv = document.createElement("div");
  dogDiv.className = "list-item";

  const badge = document.createElement("span");
  badge.className = "badge-color";
  badge.style.backgroundColor = currentDogDoc.color || "#5CD673";

  const main = document.createElement("div");
  main.className = "list-main";
  const text = document.createElement("span");
  text.textContent = `${currentDogDoc.name || "Mon chien"} – ${currentDogDoc.city || "Ville inconnue"}`;
  main.appendChild(badge);
  main.appendChild(text);
  dogDiv.appendChild(main);

  profileDogContainer.appendChild(dogDiv);

  // chiens compatibles (version simple : tous les autres pour l'instant)
  const dogsSnap = await db.collection("dogs").get();
  dogsSnap.forEach(doc => {
    if (doc.id === currentUser.uid) return;
    const d = doc.data();
    const row = document.createElement("div");
    row.className = "list-item";

    const b = document.createElement("span");
    b.className = "badge-color";
    b.style.backgroundColor = d.color || "#999";

    const m = document.createElement("div");
    m.className = "list-main";
    const t = document.createElement("span");
    t.textContent = `${d.name || "Chien"} – ${d.city || ""}`;
    m.appendChild(b);
    m.appendChild(t);
    row.appendChild(m);

    compatibleDogsContainer.appendChild(row);
  });
}

// ==================== GROUPES & CHAT (côté front simplifié) ====================

const groupsList = document.getElementById("groups-list");
const chatSection = document.getElementById("chat-section");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");

let chatUnsubscribe = null;

async function loadGroups() {
  groupsList.innerHTML = "";

  if (!currentUser) return;

  const groupsSnap = await db.collection("groups")
    .where("membersIds", "array-contains", currentUser.uid)
    .orderBy("date")
    .get();

  if (groupsSnap.empty) {
    groupsList.innerHTML = "<p>Aucun groupe pour l'instant.</p>";
    chatSection.classList.add("hidden");
    if (chatUnsubscribe) chatUnsubscribe();
    return;
  }

  groupsSnap.forEach(doc => {
    const g = doc.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.dataset.groupId = doc.id;

    const left = document.createElement("div");
    left.className = "list-main";
    const label = document.createElement("span");
    label.textContent = `${g.date} – ${g.timeSlot} – ${g.citySuggested || ""}`;
    left.appendChild(label);

    row.appendChild(left);

    row.addEventListener("click", () => openGroupChat(doc.id, g));
    groupsList.appendChild(row);
  });
}

function openGroupChat(groupId, groupData) {
  currentGroupId = groupId;
  chatSection.classList.remove("hidden");
  chatMessages.innerHTML = "";

  if (chatUnsubscribe) chatUnsubscribe();

  chatUnsubscribe = db.collection("groups").doc(groupId)
    .collection("messages")
    .orderBy("createdAt")
    .onSnapshot(snap => {
      chatMessages.innerHTML = "";
      snap.forEach(doc => {
        const m = doc.data();
        renderMessage(m);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function renderMessage(m) {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-bubble " + (m.senderId === currentUser.uid ? "me" : "other");

  const meta = document.createElement("div");
  meta.className = "chat-meta";
  meta.textContent = m.senderEmail || "";

  const text = document.createElement("div");
  text.textContent = m.text;

  wrapper.appendChild(meta);
  wrapper.appendChild(text);
  chatMessages.appendChild(wrapper);
}

chatSend.addEventListener("click", async () => {
  if (!currentGroupId) return;
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";

  await db.collection("groups").doc(currentGroupId)
    .collection("messages")
    .add({
      senderId: currentUser.uid,
      senderEmail: currentUser.email,
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
});

// ==================== ADMIN ====================

const adminPendingUsers = document.getElementById("admin-pending-users");
const adminDogs = document.getElementById("admin-dogs");

async function loadAdmin() {
  adminPendingUsers.innerHTML = "";
  adminDogs.innerHTML = "";

  // utilisateurs non approuvés
  const usersSnap = await db.collection("users")
    .where("approved", "==", false)
    .get();
  usersSnap.forEach(doc => {
    const u = doc.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.textContent = u.email || doc.id;

    const btn = document.createElement("button");
    btn.className = "btn primary";
    btn.textContent = "Approuver";
    btn.addEventListener("click", async () => {
      await db.collection("users").doc(doc.id).update({ approved: true });
      loadAdmin();
    });

    row.appendChild(btn);
    adminPendingUsers.appendChild(row);
  });

  // chiens
  const dogsSnap = await db.collection("dogs").get();
  dogsSnap.forEach(doc => {
    const d = doc.data();
    const row = document.createElement("div");
    row.className = "list-item";

    const left = document.createElement("div");
    left.className = "list-main";

    const badge = document.createElement("span");
    badge.className = "badge-color";
    badge.style.backgroundColor = d.color || "#999";

    const label = document.createElement("span");
    label.textContent = `${d.name || "Chien"} – ${d.city || ""}`;

    left.appendChild(badge);
    left.appendChild(label);

    row.appendChild(left);
    adminDogs.appendChild(row);
  });
}

// ==================== NAV BUTTONS ====================

navButtons.forEach(btn => {
  const target = btn.dataset.target;
  if (!target) return;
  btn.addEventListener("click", () => {
    showScreen(target);
    if (target === "screen-slots") buildWeekGrid();
    if (target === "screen-groups") loadGroups();
    if (target === "screen-admin" && currentUserDoc && currentUserDoc.role === "admin") loadAdmin();
  });
});
