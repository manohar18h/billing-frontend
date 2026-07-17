import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA9QGo7LH1nip9vF989i0gVVJwK17ijElQ",
  authDomain: "hambire-jewellery.firebaseapp.com",
  projectId: "hambire-jewellery",
  storageBucket: "hambire-jewellery.firebasestorage.app",
  messagingSenderId: "1068670521258",
  appId: "1:1068670521258:web:9be5a53165389c8212e5d3"
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

export const auth = getAuth(app);


