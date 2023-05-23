import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyClZrTdtlYjGb4DuvPd3Bo8PRjvsJEBTc4",
  authDomain: "choresapp-f6726.firebaseapp.com",
  projectId: "choresapp-f6726",
  storageBucket: "choresapp-f6726.appspot.com",
  messagingSenderId: "187788568370",
  appId: "1:187788568370:web:ca0a0a6f28ce042317192b",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
export default firebase;
