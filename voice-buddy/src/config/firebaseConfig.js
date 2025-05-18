import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
        apiKey: "AIzaSyCz3423Ctn4VcsC-NUGNo0xvjBplPKb_eM",
        authDomain: "voicebuddy-7c464.firebaseapp.com",
        projectId: "voicebuddy-7c464",
        storageBucket: "voicebuddy-7c464.firebasestorage.app",
        messagingSenderId: "360315038406",
        appId: "1:360315038406:web:a05354047f7a5bfad805c7"
      
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);


export { auth, googleProvider,db };
