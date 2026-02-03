'use client'

import { useEffect, useState } from 'react'
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User } from '@/types'
import { generateSuffix } from '@/lib/utils'
import { useUserStore } from '@/store/userStore'

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, setUser, clearUser } = useUserStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      
      if (firebaseUser) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          setUser(userDoc.data() as User)
        }
      } else {
        clearUser()
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, clearUser])

  const register = async (email: string, password: string, nickname: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const suffix = generateSuffix()
    
    const userData: Omit<User, 'id'> & { id: string } = {
      id: userCredential.user.uid,
      email,
      nickname,
      suffix,
      avatarUrl: null,
      wins: 0,
      losses: 0,
      totalGames: 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    }

    await setDoc(doc(db, 'users', userCredential.user.uid), userData)
    setUser(userData as User)
    
    return userCredential.user
  }

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
    if (userDoc.exists()) {
      setUser(userDoc.data() as User)
    }
    
    return userCredential.user
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    clearUser()
  }

  return {
    firebaseUser,
    user,
    loading,
    register,
    login,
    signOut,
  }
}
