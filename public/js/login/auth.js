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

    fetch('/login', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(res => {
            console.log('response from server => ', res);
        })
        .catch(error => {
            console.error('error while communicating to server => ', error);
        })

};

export const loginWithEmail = ({email, password}) => {

};

document.getElementById("googleLoginBtn").addEventListener('click', (e) => {
    loginWithGoogle();
});

