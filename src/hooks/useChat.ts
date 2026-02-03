'use client'

import { useEffect, useCallback, useState } from 'react'
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ChatMessage } from '@/types'
import { useUserStore } from '@/store/userStore'

export function useChat(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const { user } = useUserStore()

  useEffect(() => {
    if (!roomId) {
      setMessages([])
      return
    }

    const messagesRef = collection(db, 'rooms', roomId, 'messages')
    const messagesQuery = query(
      messagesRef, 
      orderBy('createdAt', 'asc'),
      limit(100)
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[]
      setMessages(newMessages)
    })

    return () => unsubscribe()
  }, [roomId])

  const sendMessage = useCallback(async (message: string) => {
    if (!roomId || !user || !message.trim()) return

    const messageData = {
      roomId,
      userId: user.id,
      nickname: user.nickname,
      suffix: user.suffix,
      message: message.trim(),
      createdAt: serverTimestamp(),
    }

    await addDoc(collection(db, 'rooms', roomId, 'messages'), messageData)
  }, [roomId, user])

  return {
    messages,
    sendMessage,
  }
}
