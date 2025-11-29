auth.onAuthStateChanged(user=>{
    if(!user) window.location='index.html';
    else document.getElementById('email').textContent=user.email;
});
document.getElementById('logout').onclick=()=>auth.signOut();
