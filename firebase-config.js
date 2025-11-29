// IMPORTANT : remplis ces valeurs avec les infos de ton projet Firebase.
// Tu les trouves dans la console Firebase > Paramètres du projet > Config SDK Web.
const firebaseConfig = {
  apiKey: "A_REMPLACER",
  authDomain: "A_REMPLACER.firebaseapp.com",
  projectId: "A_REMPLACER",
  storageBucket: "A_REMPLACER.appspot.com",
  messagingSenderId: "A_REMPLACER",
  appId: "A_REMPLACER"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
