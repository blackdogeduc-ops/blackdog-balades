// ⚠️ Mets tes vraies infos Firebase ici
const firebaseConfig = {
    apiKey: "AIZaSyC2R0kZOYH4KL02_ag0FUEIGSLBLxZnKc",
    authDomain: "black-dog-balades.firebaseapp.com",
    projectId: "black-dog-balades",
    storageBucket: "black-dog-balades.appspot.com",
    messagingSenderId: "225264690589",
    appId: "1:225264690589:web:1c33a454b5e94b95d497be"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
