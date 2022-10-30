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
                    .then(user=>{
                        console.log('user data form google => ',user);
                    })
                    .catch(error=>console.log(error));
                // ...
            })
            .catch((error) => {
                // Handle error
                console.log(error)
            });
            
    });
};