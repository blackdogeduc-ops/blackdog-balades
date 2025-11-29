// ATTENTION : NE TRADUIS PAS CE FICHIER.
// Remplace SEULEMENT les valeurs entre guillemets par celles de la console Firebase.

const firebaseConfig = {
  apiKey: "A_REMPLACER",
  authDomain: "A_REMPLACER.firebaseapp.com",
  projectId: "A_REMPLACER",
  storageBucket: "A_REMPLACER.appspot.com",
  messagingSenderId: "A_REMPLACER",
  appId: "A_REMPLACER"
};

// Ne change pas ces lignes :
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
