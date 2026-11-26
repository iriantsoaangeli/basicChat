// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDy8u4QKBntiqB0HKhISe34acpI4EnG3Jo",
  authDomain: "basicchat-90d7a.firebaseapp.com",
  projectId: "basicchat-90d7a",
  storageBucket: "basicchat-90d7a.firebasestorage.app",
  messagingSenderId: "207031092737",
  appId: "1:207031092737:web:ff7e83cb24d33d9b8fe200",
  measurementId: "G-5XJZ0Q7WRF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);