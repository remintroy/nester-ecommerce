// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-analytics.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber,
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

// declaring and setting recaptcha to window object
export const setReCaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier('submit_for_send_otp', {
        'size': 'invisible',
        'callback': (response) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            // ...
            onSignInSubmit();
        }
    }, auth);
};

// to disp error in page
const disp = ({ message, isGood, returnVal }) => {
    const disp_state = document.getElementById("disp_state");
    disp_state.style.backgroundColor = isGood ? 'rgb(205 255 196 / 56%)' : 'rgb(255 203 203 / 56%)';
    disp_state.style.display = message || returnVal == false ? 'flex' : 'none';
    disp_state.innerText = message ? message : disp_state.innerText;
    return isGood || message == '' ? true : returnVal;
};

// to send otp to mobile number
export const sendOtpToUser = (phoneNumber) => {
    return new Promise((resolve, reject) => {

        const appVerifier = window.recaptchaVerifier;

        const auth = getAuth();
        signInWithPhoneNumber(auth, phoneNumber, appVerifier)
            .then((confirmationResult) => {

                window.confirmationResult = confirmationResult;
                resolve('OTP SEND');

            }).catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // ...
                let finalErrorMessage = errorCode.split('/').pop().split('-').join(' ');

                reject(finalErrorMessage);
            });
    });
};

// login with google main function
const loginWithGoogle = () => {

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
            // ...
            let finalErrorMessage = errorCode.split('/').pop().split('-').join(' ');

            disp({
                message: finalErrorMessage
            })
        });

};

// send idToken to server after successfully login with google
const credentialsToServer = (data) => {

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
        });
};

// event listener for login with google btn
const googleLoginBtn = document.getElementById('googleLoginBtn');
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', (e) => {
        loginWithGoogle();
    });
}else{
    setReCaptcha();
};

