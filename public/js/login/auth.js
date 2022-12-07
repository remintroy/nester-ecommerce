// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-analytics.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    setPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/9.13.0/firebase-auth.js";

// config files
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

setPersistence(auth, browserSessionPersistence);

// login with google main function
const loginWithGoogle = async () => {
    try {
        // opening popup
        const result = await signInWithPopup(auth, provider);

        // after successfully sign user with
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const idToken = result._tokenResponse.idToken;

        // submit user details to server to login
        const responseFromServer = await fetch('/user_signin_google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idToken: idToken,
                accessToken: credential.accessToken,
                typeOfLogin: 'google'
            })
        });

        // parsing response form server
        const response = responseFromServer.json();

        if (response.status == 'error') throw response.message;

        // redirecting user to desired location
        window.location.href = response.action;

    } catch (error) {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // ...
        let finalErrorMessage = errorCode ? errorCode.split('/').pop().split('-').join(' ') : error;

        // displaying errror to user
        notify(finalErrorMessage);
    };
};

// event listener for login with google btn
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('googleLoginBtn').addEventListener('click', (e) => {
        loginWithGoogle();
    });
});


