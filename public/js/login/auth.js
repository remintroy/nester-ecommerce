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
    apiKey: "AIzaSyBfu8Ds3RXiz1fqf_m8PDGjKZhARAtJ4fg",
    authDomain: "com-project-dev.firebaseapp.com",
    projectId: "com-project-dev",
    storageBucket: "com-project-dev.appspot.com",
    messagingSenderId: "103628091995",
    appId: "1:103628091995:web:22d39b31b2f4c2d703057e",
    measurementId: "G-WWGK0DPV5L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();
const auth = getAuth();

setPersistence(auth, browserSessionPersistence);

// login with google main function
const loginWithGoogle = async () => {

    // status display documents and elements
    const disp_state = document.getElementById('status_disp');
    const loader = document.getElementById('preloder');
    disp_state.classList.remove('err');
    disp_state.innerText = '';
    disp_state.style.display = 'none';

    try {

        // show loader
        loader.style.display = 'flex';

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
        const response = await responseFromServer.json();

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
        loader.style.display = 'none';
        disp_state.classList.add('err')
        disp_state.innerText = finalErrorMessage;
        disp_state.style.display = 'block';
        notify(finalErrorMessage);
        return 0;
    };
};

// event listener for login with google btn
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('googleLoginBtn').addEventListener('click', (e) => {
        loginWithGoogle();
    });
});


