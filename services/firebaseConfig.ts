
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAoMc2WglIqsICiEoNEmDAlFLy_-oj7Jbw",
    authDomain: "communityguardian-58e77.firebaseapp.com",
    projectId: "communityguardian-58e77",
    storageBucket: "communityguardian-58e77.firebasestorage.app",
    messagingSenderId: "1010542256902",
    appId: "1:1010542256902:web:95b33958fc9f9cc5f8f487"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
