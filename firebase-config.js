const firebaseConfig = {
  apiKey: "AIzaSyC2R0kZ0YH4KL02_agoFUEIGSLBLxZnKc",
  authDomain: "black-dog-balades.firebaseapp.com",
  projectId: "black-dog-balades",
  storageBucket: "black-dog-balades.appspot.com",
  messagingSenderId: "225264690589",
  appId: "1:225264690589:web:1c33a454b5e94b95d497be"
};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.firestore();
