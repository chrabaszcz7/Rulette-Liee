import { Timestamp } from 'firebase/firestore'

// User types
export interface User {
  id: string
  email: string
  nickname: string
  suffix: string
  avatarUrl: string | null
  wins: number
  losses: number
  totalGames: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface UserStats {
  wins: number
  losses: number
  totalGames: number
  winrate: number
}

// Friends types
export interface FriendRequest {
  id: string
  fromUserId: string
  fromNickname: string
  fromSuffix: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Timestamp
}

export interface Friend {
  id: string
  userId: string
  nickname: string
  suffix: string
  avatarUrl: string | null
  addedAt: Timestamp
}

// Room types
export type RoomStatus = 'waiting' | 'active' | 'finished'

export interface RoomPlayer {
  id: string
  nickname: string
  suffix: string
  avatarUrl: string | null
  isHost: boolean
  isAlive: boolean
  isReady: boolean
}

export interface Room {
  id: string
  code: string
  hostId: string
  players: RoomPlayer[]
  maxPlayers: number
  status: RoomStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Game types
export type GameState = 
  | 'waiting_for_players'
  | 'assigning_roles'
  | 'mission_phase'
  | 'decision_phase'
  | 'roulette_phase'
  | 'eliminated'
  | 'finished'

export type Mission = 'TRUTH' | 'LIE'
export type RoleBadge = '🐴' | '🎭' | '🐺'

export interface GameRound {
  roundNumber: number
  missionPlayerId: string
  decisionPlayerId: string
  mission: Mission
  roleBadge: RoleBadge
  decision: 'TRUTH' | 'LIE' | null
  eliminatedPlayerId: string | null
  rouletteResult: number | null
}

export interface Game {
  id: string
  roomId: string
  state: GameState
  chamber: number // 1-6, the "death" chamber
  currentRound: number
  rounds: GameRound[]
  alivePlayers: string[]
  winnerId: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Chat types
export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  nickname: string
  suffix: string
  message: string
  createdAt: Timestamp
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number
  userId: string
  nickname: string
  suffix: string
  avatarUrl: string | null
  wins: number
  losses: number
  winrate: number
}
