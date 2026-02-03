'use client'

import { useEffect, useCallback } from 'react'
import { 
  doc, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { Game } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { useUserStore } from '@/store/userStore'

export function useGame(roomId: string | null) {
  const { user } = useUserStore()
  const { game, setGame, clearGame } = useGameStore()

  useEffect(() => {
    if (!roomId) {
      clearGame()
      return
    }

    // Find game by roomId
    const gamesQuery = query(collection(db, 'games'), where('roomId', '==', roomId))
    
    const unsubscribeGames = onSnapshot(gamesQuery, (snapshot) => {
      if (!snapshot.empty) {
        const gameDoc = snapshot.docs[0]
        setGame({ id: gameDoc.id, ...gameDoc.data() } as Game)
      }
    })

    return () => {
      unsubscribeGames()
    }
  }, [roomId, setGame, clearGame])

  const startGame = useCallback(async (roomId: string) => {
    const startGameFn = httpsCallable(functions, 'startGame')
    await startGameFn({ roomId })
  }, [])

  const makeDecision = useCallback(async (decision: 'TRUTH' | 'LIE') => {
    if (!game || !user) return
    
    const makeDecisionFn = httpsCallable(functions, 'makeDecision')
    await makeDecisionFn({ gameId: game.id, decision })
  }, [game, user])

  const spinRoulette = useCallback(async () => {
    if (!game) return
    
    const spinRouletteFn = httpsCallable(functions, 'spinRoulette')
    await spinRouletteFn({ gameId: game.id })
  }, [game])

  const getCurrentRound = useCallback(() => {
    if (!game || game.rounds.length === 0) return null
    return game.rounds[game.rounds.length - 1]
  }, [game])

  const isMyTurn = useCallback((role: 'mission' | 'decision') => {
    if (!game || !user) return false
    const currentRound = getCurrentRound()
    if (!currentRound) return false
    
    if (role === 'mission') {
      return currentRound.missionPlayerId === user.id
    }
    return currentRound.decisionPlayerId === user.id
  }, [game, user, getCurrentRound])

  return {
    game,
    startGame,
    makeDecision,
    spinRoulette,
    getCurrentRound,
    isMyTurn,
  }
}
