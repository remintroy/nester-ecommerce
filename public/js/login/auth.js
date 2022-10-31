// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAwK0KSATNGpMxm8GkPVYOo1HaCHdx60AY",
    authDomain: "project-dev-h.firebaseapp.com",
    projectId: "project-dev-h",
    storageBucket: "project-dev-h.appspot.com",
    messagingSenderId: "784200160287",
    appId: "1:784200160287:web:0860b9a855901e79e5f12a",
    measurementId: "G-SJMKP0EY5K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const provider = new GoogleAuthProvider();
const auth = getAuth();

function loginWithGoogle() {

    signInWithPopup(auth, provider)
        .then((result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const idToken = result._tokenResponse.idToken;

            credentialsToServer({
                idToken: idToken,
                accessToken: credential.accessToken,
                typeOfLogin: 'google'
            });

        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // ...
            console.log(email)
            console.log(errorMessage)
        });

};

function credentialsToServer(data) {

    let disp_state = document.getElementById("disp_state");

    const disp = ({ message, isGood, returnVal }) => {
        disp_state.style.backgroundColor = isGood ? 'rgb(205 255 196 / 56%)' : 'rgb(255 203 203 / 56%)';
        disp_state.style.display = message || returnVal == false ? 'flex' : 'none';
        disp_state.innerText = message ? message : disp_state.innerText;
        return isGood || message == '' ? true : returnVal;
    };

    fetch('/user_signin_google', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(res => {
            if (res.status == 'error') {
                disp({
                    message: res.message
                });
            } else {
                disp({
                    message: res.message,
                    isGood: true
                });
                window.location.href = res.action;
            };
        })
        .catch(error => {
            console.error('Faild while connecting to server => ', error);
        })

};

document.getElementById("googleLoginBtn").addEventListener('click', (e) => {
    loginWithGoogle();
});

