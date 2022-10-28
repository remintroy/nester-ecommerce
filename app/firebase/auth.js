import { initializeApp, applicationDefault } from "firebase-admin/app";

initializeApp({
    credential: applicationDefault()
});

console.log('hai')