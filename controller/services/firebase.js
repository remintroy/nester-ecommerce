import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from 'firebase-admin/auth';

initializeApp({
    credential: applicationDefault()
});

export const signInWithGoogleSDK = ({ idToken }) => {
    return new Promise((resolve, reject) => {

        getAuth()
            .verifyIdToken(idToken)
            .then((decodedToken) => {
                const uid = decodedToken.uid;
                getAuth()
                    .getUser(uid)
                    .then(user => {
                        resolve(user); // login success form google
                    })
                    .catch(error => {
                        console.error('GoogleLogin_GettingUserData => ', error);
                        reject("Error Fetching user data"); return 0;
                    });
                // ...
            })
            .catch((error) => {
                // Handle error
                console.error('GoogleLogin_ValidatingIDTocken => ', error);
                reject("Error verifying user"); return 0;
            });

    });
};

export const signInWithOTPSDK = ({ idToken }) => {
    return new Promise((resolve, reject) => {

        getAuth()
            .verifyIdToken(idToken)
            .then((decodedToken) => {
                const uid = decodedToken.uid;
                getAuth()
                    .getUser(uid)
                    .then(user => {
                        resolve(user); // login success form google
                    })
                    .catch(error => {
                        console.error('OTPLogin_GettingUserData => ', error);
                        reject("Error Fetching user data"); return 0;
                    });
                // ...
            })
            .catch((error) => {
                // Handle error
                console.error('OTPLogin_ValidatingIDTocken => ', error);
                reject("Error verifying user"); return 0;
            });

    });
};