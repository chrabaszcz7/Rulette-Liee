'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FriendRequest, User } from '@/types'
import { useUserStore } from '@/store/userStore'
import { parseNickname } from '@/lib/utils'

export function useFriends() {
  const [friends, setFriends] = useState<User[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const { user } = useUserStore()

  useEffect(() => {
    if (!user) {
      setFriends([])
      setPendingRequests([])
      setSentRequests([])
      return
    }

    // Listen to friends collection
    const friendsQuery = query(
      collection(db, 'users', user.id, 'friends')
    )
    const unsubscribeFriends = onSnapshot(friendsQuery, async (snapshot) => {
      const friendIds = snapshot.docs.map(doc => doc.data().userId)
      
      if (friendIds.length > 0) {
        const friendsData: User[] = []
        for (const friendId of friendIds) {
          const friendQuery = query(collection(db, 'users'), where('id', '==', friendId))
          const friendSnapshot = await getDocs(friendQuery)
          if (!friendSnapshot.empty) {
            friendsData.push(friendSnapshot.docs[0].data() as User)
          }
        }
        setFriends(friendsData)
      } else {
        setFriends([])
      }
    })

    // Listen to pending friend requests (received)
    const pendingQuery = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', user.id),
      where('status', '==', 'pending')
    )
    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      setPendingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FriendRequest[])
    })

    // Listen to sent friend requests
    const sentQuery = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', user.id),
      where('status', '==', 'pending')
    )
    const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
      setSentRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FriendRequest[])
    })

    return () => {
      unsubscribeFriends()
      unsubscribePending()
      unsubscribeSent()
    }
  }, [user])

  const sendFriendRequest = useCallback(async (fullNickname: string) => {
    if (!user) throw new Error('User not authenticated')

    const parsed = parseNickname(fullNickname)
    if (!parsed) throw new Error('Invalid nickname format. Use: nickname#XXXXX')

    // Find user by nickname and suffix
    const usersQuery = query(
      collection(db, 'users'),
      where('nickname', '==', parsed.nickname),
      where('suffix', '==', parsed.suffix)
    )
    const usersSnapshot = await getDocs(usersQuery)

    if (usersSnapshot.empty) {
      throw new Error('User not found')
    }

    const targetUser = usersSnapshot.docs[0].data() as User

    if (targetUser.id === user.id) {
      throw new Error('Cannot send friend request to yourself')
    }

    // Check if already friends
    const existingFriendQuery = query(
      collection(db, 'users', user.id, 'friends'),
      where('userId', '==', targetUser.id)
    )
    const existingFriendSnapshot = await getDocs(existingFriendQuery)
    if (!existingFriendSnapshot.empty) {
      throw new Error('Already friends')
    }

    // Check if request already exists
    const existingRequestQuery = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', user.id),
      where('toUserId', '==', targetUser.id),
      where('status', '==', 'pending')
    )
    const existingRequestSnapshot = await getDocs(existingRequestQuery)
    if (!existingRequestSnapshot.empty) {
      throw new Error('Friend request already sent')
    }

    // Create friend request
    await addDoc(collection(db, 'friendRequests'), {
      fromUserId: user.id,
      fromNickname: user.nickname,
      fromSuffix: user.suffix,
      toUserId: targetUser.id,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
  }, [user])

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    if (!user) throw new Error('User not authenticated')

    const requestRef = doc(db, 'friendRequests', requestId)
    const request = pendingRequests.find(r => r.id === requestId)
    
    if (!request) throw new Error('Request not found')

    // Update request status
    await updateDoc(requestRef, { status: 'accepted' })

    // Add to both users' friends collections
    await addDoc(collection(db, 'users', user.id, 'friends'), {
      userId: request.fromUserId,
      addedAt: serverTimestamp(),
    })

    await addDoc(collection(db, 'users', request.fromUserId, 'friends'), {
      userId: user.id,
      addedAt: serverTimestamp(),
    })
  }, [user, pendingRequests])

  const rejectFriendRequest = useCallback(async (requestId: string) => {
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'rejected' })
  }, [])

  const removeFriend = useCallback(async (friendId: string) => {
    if (!user) throw new Error('User not authenticated')

    // Find and delete from current user's friends
    const myFriendsQuery = query(
      collection(db, 'users', user.id, 'friends'),
      where('userId', '==', friendId)
    )
    const myFriendsSnapshot = await getDocs(myFriendsQuery)
    for (const doc_ of myFriendsSnapshot.docs) {
      await deleteDoc(doc_.ref)
    }

    // Find and delete from friend's friends
    const theirFriendsQuery = query(
      collection(db, 'users', friendId, 'friends'),
      where('userId', '==', user.id)
    )
    const theirFriendsSnapshot = await getDocs(theirFriendsQuery)
    for (const doc_ of theirFriendsSnapshot.docs) {
      await deleteDoc(doc_.ref)
    }
  }, [user])

  return {
    friends,
    pendingRequests,
    sentRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  }
}
