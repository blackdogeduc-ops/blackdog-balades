auth.onAuthStateChanged(user=>{
    if(!user) window.location='index.html';
    else document.getElementById('username').textContent='Connecté en tant que : '+user.email;
});

document.getElementById('logout').onclick=()=>auth.signOut();
