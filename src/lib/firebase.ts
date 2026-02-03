import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: "AIzaSyDDwYjGGtr5CSM760IXxalukHqt4UwOfxA",
  authDomain: "rulette-lie.firebaseapp.com",
  databaseURL: "https://rulette-lie-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rulette-lie",
  storageBucket: "rulette-lie.firebasestorage.app",
  messagingSenderId: "606956653315",
  appId: "1:606956653315:web:8ca9345947b3977429f736",
  measurementId: "G-6H6RHG9LGR"
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'europe-west1')

export default app
