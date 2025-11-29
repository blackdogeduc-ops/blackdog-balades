const email=document.getElementById('email');
const pass=document.getElementById('password');
const msg=document.getElementById('message');

document.getElementById('signup-btn').onclick=async ()=>{
    try{
        await auth.createUserWithEmailAndPassword(email.value, pass.value);
        msg.textContent='Compte créé ✔';
    }catch(e){msg.textContent=e.message;}
};

document.getElementById('login-btn').onclick=async ()=>{
    try{
        await auth.signInWithEmailAndPassword(email.value, pass.value);
        window.location='home.html';
    }catch(e){msg.textContent=e.message;}
};
