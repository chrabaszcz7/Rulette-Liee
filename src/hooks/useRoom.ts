'use client'

import { useEffect, useCallback } from 'react'
import { 
  doc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  getDoc,
  getDocs
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Room, RoomPlayer } from '@/types'
import { generateRoomCode } from '@/lib/utils'
import { useRoomStore } from '@/store/roomStore'
import { useUserStore } from '@/store/userStore'

export function useRoom() {
  const { user } = useUserStore()
  const { room, setRoom, clearRoom } = useRoomStore()

  const createRoom = useCallback(async (maxPlayers: number = 6) => {
    if (!user) throw new Error('User not authenticated')

    const code = generateRoomCode()
    const hostPlayer: RoomPlayer = {
      id: user.id,
      nickname: user.nickname,
      suffix: user.suffix,
      avatarUrl: user.avatarUrl,
      isHost: true,
      isAlive: true,
      isReady: true,
    }

    const roomData = {
      code,
      hostId: user.id,
      players: [hostPlayer],
      maxPlayers,
      status: 'waiting' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const roomRef = await addDoc(collection(db, 'rooms'), roomData)
    
    return { id: roomRef.id, code }
  }, [user])

  const joinRoom = useCallback(async (code: string) => {
    if (!user) throw new Error('User not authenticated')

    // Find room by code
    const roomsQuery = query(collection(db, 'rooms'), where('code', '==', code))
    const roomsSnapshot = await getDocs(roomsQuery)

    if (roomsSnapshot.empty) {
      throw new Error('Room not found')
    }

    const roomDoc = roomsSnapshot.docs[0]
    const roomData = roomDoc.data() as Omit<Room, 'id'>

    if (roomData.status !== 'waiting') {
      throw new Error('Game already started')
    }

    if (roomData.players.length >= roomData.maxPlayers) {
      throw new Error('Room is full')
    }

    if (roomData.players.some(p => p.id === user.id)) {
      throw new Error('Already in this room')
    }

    const newPlayer: RoomPlayer = {
      id: user.id,
      nickname: user.nickname,
      suffix: user.suffix,
      avatarUrl: user.avatarUrl,
      isHost: false,
      isAlive: true,
      isReady: false,
    }

    await updateDoc(doc(db, 'rooms', roomDoc.id), {
      players: arrayUnion(newPlayer),
      updatedAt: serverTimestamp(),
    })

    return roomDoc.id
  }, [user])

  const leaveRoom = useCallback(async (roomId: string) => {
    if (!user) throw new Error('User not authenticated')

    const roomRef = doc(db, 'rooms', roomId)
    const roomSnapshot = await getDoc(roomRef)

    if (!roomSnapshot.exists()) {
      throw new Error('Room not found')
    }

    const roomData = roomSnapshot.data() as Omit<Room, 'id'>
    const playerToRemove = roomData.players.find(p => p.id === user.id)

    if (!playerToRemove) {
      throw new Error('Not in this room')
    }

    await updateDoc(roomRef, {
      players: arrayRemove(playerToRemove),
      updatedAt: serverTimestamp(),
    })

    clearRoom()
  }, [user, clearRoom])

  const toggleReady = useCallback(async (roomId: string) => {
    if (!user) throw new Error('User not authenticated')

    const roomRef = doc(db, 'rooms', roomId)
    const roomSnapshot = await getDoc(roomRef)

    if (!roomSnapshot.exists()) {
      throw new Error('Room not found')
    }

    const roomData = roomSnapshot.data() as Omit<Room, 'id'>
    const updatedPlayers = roomData.players.map(p => 
      p.id === user.id ? { ...p, isReady: !p.isReady } : p
    )

    await updateDoc(roomRef, {
      players: updatedPlayers,
      updatedAt: serverTimestamp(),
    })
  }, [user])

  const subscribeToRoom = useCallback((roomId: string) => {
    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (snapshot) => {
      if (snapshot.exists()) {
        setRoom({ id: snapshot.id, ...snapshot.data() } as Room)
      } else {
        clearRoom()
      }
    })

    return unsubscribe
  }, [setRoom, clearRoom])

  return {
    room,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    subscribeToRoom,
  }
}
