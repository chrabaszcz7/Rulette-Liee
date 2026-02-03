'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LeaderboardEntry, User } from '@/types'
import { calculateWinrate } from '@/lib/utils'

export function useLeaderboard(limitCount: number = 10) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('wins', 'desc'),
      limit(limitCount)
    )

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
        const data = doc.data() as User
        return {
          rank: index + 1,
          userId: data.id,
          nickname: data.nickname,
          suffix: data.suffix,
          avatarUrl: data.avatarUrl,
          wins: data.wins,
          losses: data.losses,
          winrate: calculateWinrate(data.wins, data.losses),
        }
      })
      setLeaderboard(entries)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [limitCount])

  return { leaderboard, loading }
}
