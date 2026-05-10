import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA4ZGZOepGTWumGb7wYrmGydPO7NpxufoE",
  authDomain: "dentar.firebaseapp.com",
  projectId: "dentar",
  storageBucket: "dentar.firebasestorage.app",
  messagingId: "406956312805",
  appId: "1:406956312805:web:0a6e0a3cbb9993395f2c0c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);